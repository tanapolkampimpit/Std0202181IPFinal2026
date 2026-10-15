import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool, checkSchema, createEmployeeStore, createUserStore } from './stores/mysql.js';
import { createDatabaseAuth } from './security.js';

let pool;
try {
  const config = loadConfig();
  pool = createPool(config.database);
  await checkSchema(pool);
  const users = createUserStore(pool);
  const app = createApp({ corsOrigin: config.corsOrigin, users, store: createEmployeeStore(pool), auth: createDatabaseAuth(users, config.jwtSecret) });
  const server = app.listen(config.port, config.host, () => {
    console.log(`TNPKHR API listening on ${config.host}:${config.port} (mysql)`);
  });
  server.on('error', async (error) => {
    console.error(`Unable to listen: ${error.code ?? error.name}`);
    await pool?.end();
    process.exitCode = 1;
  });
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => { await pool?.end(); clearTimeout(timeout); process.exit(0); });
  });
} catch (error) {
  console.error('Startup failed:', error.code ?? error.message);
  await pool?.end();
  process.exitCode = 1;
}
