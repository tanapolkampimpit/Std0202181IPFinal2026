import { loadConfig } from '../src/config.js';
import { createPool, checkSchema } from '../src/stores/mysql.js';

let pool;
try {
  const config = loadConfig();
  pool = createPool(config.database);
  await checkSchema(pool);
  console.log('Database connection and both BlueHR table schemas are OK. No data was changed.');
} catch (error) {
  console.error('Database check failed:', error.code ?? error.message);
  process.exitCode = 1;
} finally { await pool?.end(); }
