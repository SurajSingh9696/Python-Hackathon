#!/usr/bin/env node
// Bundle budget enforcer — run in CI to catch regressions.
// Usage: node scripts/bundle-budget.mjs
// Requires: pnpm build must have run first.

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import zlib from 'zlib';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const BUDGETS = {
  // Next.js .next/static/chunks
  'Initial JS (before 3D)': {
    pattern: /^(main|pages|app|framework|polyfills)/,
    maxGzip: 130 * 1024, // 130 KB
    exclude: /three|fiber|drei|thread/i,
  },
  '3D chunk': {
    pattern: /three|fiber|drei|thread/i,
    maxGzip: 250 * 1024, // 250 KB
  },
};

const NEXT_STATIC = join(process.cwd(), 'apps/web/.next/static/chunks');

if (!existsSync(NEXT_STATIC)) {
  console.error(`${RED}❌ .next/static/chunks not found. Run pnpm build first.${RESET}`);
  process.exit(1);
}

let failed = false;

function getGzipSize(filePath) {
  try {
    const buf = readFileSync(filePath);
    return zlib.gzipSync(buf).length;
  } catch {
    return Math.floor(statSync(filePath).size * 0.35);
  }
}

const files = readdirSync(NEXT_STATIC).filter((f) => f.endsWith('.js'));

for (const [label, budget] of Object.entries(BUDGETS)) {
  let totalGzip = 0;
  const matched = [];

  for (const file of files) {
    if (budget.exclude?.test(file)) continue;
    if (!budget.pattern.test(file)) continue;
    const filePath = join(NEXT_STATIC, file);
    const gzip = getGzipSize(filePath);
    totalGzip += gzip;
    matched.push({ file, gzip });
  }

  const kb = (totalGzip / 1024).toFixed(1);
  const maxKb = (budget.maxGzip / 1024).toFixed(0);
  const status = totalGzip <= budget.maxGzip;

  console.log(
    `${status ? GREEN + '✅' : RED + '❌'} ${label}: ${kb} KB gzip (budget: ${maxKb} KB)${RESET}`
  );

  if (!status) {
    failed = true;
    matched
      .sort((a, b) => b.gzip - a.gzip)
      .slice(0, 5)
      .forEach(({ file, gzip }) => {
        console.log(`   ${YELLOW}└─ ${file}: ${(gzip / 1024).toFixed(1)} KB${RESET}`);
      });
  }
}

if (failed) {
  console.error(`\n${RED}Bundle budget check FAILED.${RESET}`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}All bundle budgets OK.${RESET}`);
}
