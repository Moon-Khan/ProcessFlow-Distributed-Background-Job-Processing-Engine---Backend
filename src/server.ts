import { createApp } from './app.js';
import { config } from './config.js';
import { AppDataSource } from './db/data-source.js';

async function main() {
  await AppDataSource.initialize();
  console.log(`Connected to Postgres at ${config.db.host}:${config.db.port}/${config.db.name}`);

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
