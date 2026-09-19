/**
 * MongoDB connection manager.
 * Singleton client — connect once at startup, reuse across requests.
 */
import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let connected = false;

export async function connectMongo(uri: string, dbName: string): Promise<Db> {
  if (db) return db;

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
    maxPoolSize: 10,
    minPoolSize: 2,
  });

  await client.connect();
  db = client.db(dbName);
  connected = true;

  // Graceful shutdown
  process.on('SIGINT', () => void client?.close());
  process.on('SIGTERM', () => void client?.close());

  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongo() first.');
  }
  return db;
}

export function getMongoStatus(): { connected: boolean; dbName: string | null } {
  return {
    connected,
    dbName: db?.databaseName ?? null,
  };
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
  connected = false;
}
