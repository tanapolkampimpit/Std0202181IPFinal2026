import { loadConfig } from '../src/config.js';
import { createPool, checkSchema, createUserStore } from '../src/stores/mysql.js';
import { hashPassword } from '../src/security.js';
import { userInput } from '../src/validation.js';

let pool;
try {
  const config = loadConfig();
  const { data, errors } = userInput({ username: process.env.ADMIN_USERNAME ?? process.argv[2] ?? 'admin', password: process.env.ADMIN_PASSWORD, role: 'Admin' });
  delete process.env.ADMIN_PASSWORD;
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
  pool = createPool(config.database);
  await checkSchema(pool);
  const users = createUserStore(pool);
  if (await users.findByUsername(data.username)) throw new Error('Username already exists; no existing account was changed.');
  const result = await users.create({ username: data.username, role: 'Admin', passwordHash: await hashPassword(data.password) });
  console.log(`Admin created: ${result.username} (ID ${result.user_id}).`);
} catch (error) {
  console.error('Create admin failed:', error.code ?? error.message);
  process.exitCode = 1;
} finally { await pool?.end(); }
