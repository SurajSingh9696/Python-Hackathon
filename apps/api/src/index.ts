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
    app.log.info('MongoDB connected successfully');
  } catch (err: any) {
    app.log.warn(
      `MongoDB connection failed (${err?.message || 'unknown error'}) — running in in-memory mock mode. ` +
      `To persist journeys and documents, provide a valid MONGODB_URI in your environment settings.`
    );
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.API_PORT;
  await app.listen({ port, host: config.API_HOST });
  app.log.info(`Sahaj API listening on http://${config.API_HOST}:${port}`);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
