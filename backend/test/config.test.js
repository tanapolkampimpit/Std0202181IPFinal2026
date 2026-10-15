import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { employeeInput, userInput } from '../src/validation.js';

const minimum = { DB_USER: 'test-user', JWT_SECRET: 'x'.repeat(48) };
test('config uses APP_HOST, APP_PORT, connection limit and JSON CORS without mutating input', () => {
  const input = { ...minimum, APP_HOST: '127.0.0.1', APP_PORT: '8088', PORT: '3000', DB_CONNECTION_LIMIT: '7', CORS_ORIGINS: '["http://localhost:8081","https://example.com"]' };
  const before = { ...input };
  const config = loadConfig(input);
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 8088);
  assert.equal(config.database.connectionLimit, 7);
  assert.deepEqual(config.corsOrigin, ['http://localhost:8081', 'https://example.com']);
  assert.deepEqual(input, before);
});
test('config accepts comma-separated CORS, supports HOST/PORT aliases and rejects bad settings', () => {
  assert.deepEqual(loadConfig({ ...minimum, HOST: '127.0.0.1', PORT: '8000', CORS_ORIGINS: 'http://localhost:8081,https://example.com' }).corsOrigin, ['http://localhost:8081', 'https://example.com']);
  assert.equal(loadConfig({ ...minimum, HOST: '127.0.0.1', PORT: '8000' }).port, 8000);
  for (const input of [{}, { ...minimum, APP_PORT: '0' }, { ...minimum, APP_PORT: '65536' }, { ...minimum, DB_CONNECTION_LIMIT: '0' }, { ...minimum, JWT_SECRET: 'short' }, { ...minimum, CORS_ORIGINS: '[broken' }, { ...minimum, CORS_ORIGINS: '[42]' }, { ...minimum, CORS_ORIGINS: 'https://example.com/path' }]) assert.throws(() => loadConfig(input));
});
test('API cannot start without database stores or authentication', () => {
  assert.throws(() => createApp(), /MySQL/);
  assert.throws(() => createApp({}), /MySQL/);
});
test('employee validation respects MySQL text and DECIMAL limits', () => {
  const valid = { name: ' สมชาย ', position: ' HR ', salary: 9999999999.99 };
  assert.deepEqual(employeeInput(valid), { data: { name: 'สมชาย', position: 'HR', salary: 9999999999.99 }, errors: {} });
  for (const salary of ['100', 0, -1, NaN, Infinity, 0.001, 10000000000, null]) assert.ok(employeeInput({ ...valid, salary }).errors.salary);
  assert.ok(employeeInput({ ...valid, name: 'a'.repeat(101) }).errors.name);
  assert.ok(employeeInput({ ...valid, status: 'Invalid' }, { update: true }).errors.status);
});
test('user validation enforces bcrypt byte limits and explicit roles', () => {
  assert.equal(Object.keys(userInput({ username: 'test', password: '12345678' }).errors).length, 0);
  assert.ok(userInput({ username: 'test', password: 'ก'.repeat(25) }).errors.password);
  assert.ok(userInput({ username: 'test', password: 'short' }).errors.password);
  assert.ok(userInput({ username: 'test', password: '12345678', role: 'Owner' }).errors.role);
  assert.deepEqual(userInput({ username: 'test' }, { update: true }), { data: { username: 'test' }, errors: {} });
});
