import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Resolve against this module, so direct `node backend/src/server.js` also works.
// Existing process environment takes precedence. This never writes .env.
export function loadConfig(input) {
  const file = new URL('../.env', import.meta.url);
  const env = input ?? { ...(existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {}), ...process.env };
  const integer = (value, fallback, label) => {
    const result = Number(value ?? fallback);
    if (!Number.isInteger(result) || result < 1 || result > 65535) throw new Error(`${label} must be between 1 and 65535.`);
    return result;
  };
  const config = {
    port: integer(env.APP_PORT ?? env.PORT, 3000, 'APP_PORT'), host: env.APP_HOST ?? env.HOST ?? '0.0.0.0',
    corsOrigin: parseOrigins(env.CORS_ORIGINS),
    jwtSecret: env.JWT_SECRET,
    database: {
      host: env.DB_HOST ?? '127.0.0.1', port: integer(env.DB_PORT, 3306, 'DB_PORT'),
      user: env.DB_USER, password: env.DB_PASSWORD ?? '', database: env.DB_NAME ?? 'ip_std6730202181',
      charset: 'utf8mb4', waitForConnections: true, connectionLimit: integer(env.DB_CONNECTION_LIMIT, 5, 'DB_CONNECTION_LIMIT'),
      supportBigNumbers: true, bigNumberStrings: true, connectTimeout: 10000,
    },
  };
  if (!config.database.user) throw new Error('Set DB_USER in backend/.env.');
  if (!config.jwtSecret || Buffer.byteLength(config.jwtSecret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes.');
  return config;
}

function parseOrigins(value) {
  if (!value?.trim() || value.trim() === '*') return '*';
  let origins;
  if (value.trim().startsWith('[')) {
    try { origins = JSON.parse(value); }
    catch { throw new Error('CORS_ORIGINS must be a JSON array or comma-separated origins.'); }
  } else origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!Array.isArray(origins) || !origins.length || origins.some((origin) => {
    try { return typeof origin !== 'string' || new URL(origin).origin !== origin || !['http:', 'https:'].includes(new URL(origin).protocol); }
    catch { return true; }
  })) throw new Error('CORS_ORIGINS must contain valid http/https origins without trailing slashes.');
  return origins;
}
