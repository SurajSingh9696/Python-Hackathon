/**
 * Sahaj API — Entry point
 */
import { buildApp } from './http/app.js';
import { getConfig } from './config/env.js';
import { connectMongo } from './db/connection.js';

async function main() {
  const config = getConfig();
  const app = await buildApp(config);

  try {
    await connectMongo(config.MONGODB_URI, config.MONGODB_DB_NAME);
    app.log.info('MongoDB connected');
  } catch (err) {
    app.log.error({ err }, 'MongoDB connection failed — running without DB (mock mode)');
  }

  await app.listen({ port: config.API_PORT, host: config.API_HOST });
  app.log.info(`Sahaj API listening on http://${config.API_HOST}:${config.API_PORT}`);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
