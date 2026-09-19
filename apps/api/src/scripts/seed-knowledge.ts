/**
 * Offline Knowledge Seeding Script.
 *
 * Usage: pnpm seed:knowledge
 *
 * 1. Reads all Markdown files in /knowledge/
 * 2. Parses YAML frontmatter into structured metadata
 * 3. Populates MongoDB `products` and `knowledge_sources` collections
 * 4. Indexes documents into the ResilientKnowledgeStore datasets
 * 5. Executes cognify() offline
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongo, getDb, getMongoStatus } from '../db/connection.js';
import { getConfig } from '../config/env.js';
import { createKnowledgeStore, type KnowledgeDocument } from '../adapters/knowledge/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.resolve(__dirname, '../../../../knowledge');

interface ParsedDoc {
  frontmatter: Record<string, unknown>;
  content: string;
}

function parseFrontmatter(raw: string): ParsedDoc {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  if (!match) {
    return { frontmatter: {}, content: raw };
  }

  const rawYml = match[1] ?? '';
  const content = match[2]?.trim() ?? '';
  const frontmatter: Record<string, unknown> = {};

  const lines = rawYml.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let valStr = trimmed.slice(colonIdx + 1).trim();

    // Strip quotes
    if ((valStr.startsWith('"') && valStr.endsWith('"')) || (valStr.startsWith("'") && valStr.endsWith("'"))) {
      valStr = valStr.slice(1, -1);
    }

    // Parse types
    if (valStr === 'true') {
      frontmatter[key] = true;
    } else if (valStr === 'false') {
      frontmatter[key] = false;
    } else if (!isNaN(Number(valStr)) && valStr !== '') {
      frontmatter[key] = Number(valStr);
    } else if (valStr.startsWith('[') && valStr.endsWith(']')) {
      const arrayItems = valStr
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
      frontmatter[key] = arrayItems;
    } else {
      frontmatter[key] = valStr;
    }
  }

  return { frontmatter, content };
}

export async function seedKnowledge(): Promise<{ totalDocs: number; productsAdded: number }> {
  console.log('🌱 Starting offline knowledge ingestion...');
  const config = getConfig();
  const store = createKnowledgeStore(config);

  // Optional Mongo connection
  try {
    await connectMongo(config.MONGODB_URI, config.MONGODB_DB_NAME);
  } catch {
    console.log('ℹ️ Running without MongoDB (in-memory mode for knowledge store)');
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  console.log(`📂 Found ${files.length} knowledge files in ${KNOWLEDGE_DIR}`);

  const productDocs: KnowledgeDocument[] = [];
  const insuranceDocs: KnowledgeDocument[] = [];
  const faqDocs: KnowledgeDocument[] = [];
  let productsCount = 0;

  for (const file of files) {
    const fullPath = path.join(KNOWLEDGE_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontmatter, content } = parseFrontmatter(raw);

    const docId = (frontmatter['id'] as string) || file.replace(/\.md$/, '');
    const title = (frontmatter['name'] as string) || docId;
    const domain = (frontmatter['domain'] as string) || 'general';
    const source = (frontmatter['source'] as string) || 'Demo Knowledge Source';
    const provider = (frontmatter['provider'] as string) || 'Demo Provider';
    const version = String(frontmatter['version'] ?? '1.0');
    const effectiveDate = String(frontmatter['effective_date'] ?? '2026-01-01');
    const synthetic = frontmatter['synthetic'] === true;
    const conflictsWith = frontmatter['conflicts_with'] as string | undefined;

    const doc: KnowledgeDocument = {
      id: docId,
      title,
      content,
      domain,
      source,
      provider,
      version,
      effectiveDate,
      synthetic,
      ...(conflictsWith !== undefined ? { conflictsWith } : {}),
      metadata: frontmatter,
    };

    // Categorize by dataset
    if (domain === 'lending') {
      productDocs.push(doc);
    } else if (domain === 'insurance') {
      insuranceDocs.push(doc);
    } else {
      faqDocs.push(doc);
    }

    // Populate MongoDB products and knowledge_sources if DB is available
    const dbStatus = getMongoStatus();
    if (dbStatus.connected) {
      const db = getDb();
      if (frontmatter['annual_rate_min'] || frontmatter['min_sum_insured_lakh']) {
        productsCount++;
        await db.collection('products').updateOne(
          { id: docId },
          {
            $set: {
              id: docId,
              name: title,
              domain,
              ...frontmatter,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }

      await db.collection('knowledge_sources').updateOne(
        { id: docId },
        {
          $set: {
            id: docId,
            title,
            source,
            provider,
            version,
            effectiveDate,
            domain,
            ingestionStatus: 'cognified',
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }

  // Add and cognify datasets offline
  console.log(`📥 Ingesting ${productDocs.length} lending docs to 'financial_products'...`);
  await store.add('financial_products', productDocs);
  await store.cognify('financial_products');

  console.log(`📥 Ingesting ${insuranceDocs.length} insurance docs to 'insurance_knowledge'...`);
  await store.add('insurance_knowledge', insuranceDocs);
  await store.cognify('insurance_knowledge');

  console.log(`📥 Ingesting ${faqDocs.length} FAQ / glossary docs to 'demo_faq'...`);
  await store.add('demo_faq', faqDocs);
  await store.cognify('demo_faq');

  console.log('✅ Knowledge seeding complete:');
  console.log(`   - Total documents indexed: ${files.length}`);
  console.log(`   - Financial products added: ${productsCount || productDocs.length}`);
  console.log(`   - Datasets cognified: financial_products, insurance_knowledge, demo_faq`);

  return { totalDocs: files.length, productsAdded: productsCount || productDocs.length };
}

// Execute directly if run from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedKnowledge()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
