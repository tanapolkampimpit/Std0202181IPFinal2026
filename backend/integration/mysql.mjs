import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { createPool, checkSchema, createEmployeeStore, createUserStore } from '../src/stores/mysql.js';
import { createDatabaseAuth, hashPassword } from '../src/security.js';

test('MySQL HTTP integration in a newly created disposable database', { timeout: 90000 }, async (t) => {
  // Never uses DB_NAME or the exam tables on the shared server.
  // Requires CREATE/DROP DATABASE on a LOCAL test MySQL/MariaDB server.
  const host = process.env.DB_TEST_HOST ?? '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('DB_TEST_HOST must be loopback; do not run these tests on the exam server.');
  const connectionConfig = { host, port: Number(process.env.DB_TEST_PORT ?? 3306), user: process.env.DB_TEST_USER ?? 'root', password: process.env.DB_TEST_PASSWORD ?? '' };
  const control = await mysql.createConnection(connectionConfig);
  const database = `tnpkhr_test_${randomBytes(8).toString('hex')}`;
  await control.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`);
  const pool = createPool({ ...connectionConfig, database, connectionLimit: 5 });
  t.after(async () => {
    await pool.end();
    try { await control.query(`DROP DATABASE \`${database}\``); }
    finally { await control.end(); }
  });
  const sql = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) await pool.query(statement);
  await checkSchema(pool);
  const users = createUserStore(pool);
  const passwordHash = await hashPassword('TestAdminPassword123!');
  const admin = await users.create({ username: 'admin', role: 'Admin', passwordHash });
  const secret = randomBytes(48).toString('hex');
  const app = createApp({ store: createEmployeeStore(pool), users, auth: createDatabaseAuth(users, secret), corsOrigin: ['http://localhost:8081'] });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  let token;
  async function request(path, { method = 'GET', body, bearer = token, raw } = {}) {
    const response = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, ...(body !== undefined || raw ? { body: raw ?? JSON.stringify(body) } : {}) });
    return { status: response.status, headers: response.headers, data: await response.json() };
  }

  await t.test('health, database login, bad passwords, fake and expired JWTs', async () => {
    assert.equal((await request('/health')).status, 200);
    assert.equal((await request('/login', { method: 'POST', body: { username: 'admin', password: 'wrong' } })).status, 401);
    assert.equal((await request('/login', { method: 'POST', body: { username: "' OR 1=1 --", password: 'wrong' } })).status, 401);
    assert.equal((await request('/employees', { bearer: 'invalid-token' })).status, 401);
    const login = await request('/login', { method: 'POST', body: { username: 'admin', password: 'TestAdminPassword123!' } });
    assert.equal(login.status, 200);
    token = login.data.token;
    assert.equal(jwt.verify(token, secret).sub, admin.user_id);
    const expired = jwt.sign({ pwv: 'bad' }, secret, { subject: admin.user_id, issuer: 'tnpkhr-ip-final', audience: 'tnpkhr-app', expiresIn: -1 });
    assert.equal((await request('/employees', { bearer: expired })).status, 401);
  });
  await t.test('all employee and user operations require database authentication', async () => {
    for (const path of ['/employees', '/employees/1', '/employees/salary-clusters', '/users', '/users/1']) {
      assert.equal((await request(path, { bearer: '' })).status, 401);
    }
    for (const [path, method] of [['/employees', 'POST'], ['/employees/1', 'PUT'], ['/employees/1', 'PATCH'], ['/employees/1/status', 'PUT'], ['/employees/1', 'DELETE'], ['/users', 'POST'], ['/users/1', 'PUT'], ['/users/1', 'DELETE']]) {
      assert.equal((await request(path, { method, body: {}, bearer: '' })).status, 401);
    }
  });

  let employee;
  await t.test('employee create/read/update/toggle and decimal/Unicode round trips', async () => {
    const created = await request('/employees', { method: 'POST', body: { name: '  สมชาย ใจดี  ', position: 'Engineer', salary: 12345.67 } });
    assert.equal(created.status, 201);
    employee = created.data;
    assert.match(employee.id, /^\d+$/);
    assert.equal(employee.name, 'สมชาย ใจดี');
    assert.equal(employee.salary, 12345.67);
    assert.equal((await request(`/employees/${employee.id}`)).data.salary, 12345.67);
    const updated = await request(`/employees/${employee.id}`, { method: 'PUT', body: { name: 'Updated', position: 'Senior Engineer', salary: 54321.09, status: 'On Leave' } });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.status, 'On Leave');
    assert.equal(updated.data.salary, 54321.09);
    assert.equal((await request(`/employees/${employee.id}/status`, { method: 'PUT' })).data.status, 'Active');
    assert.equal((await request(`/employees/${employee.id}`, { method: 'PUT', body: { name: 'Updated', position: 'Senior Engineer', salary: 54321.09 } })).status, 200);
  });
  await t.test('name-only edits persist in SQL; listing reads external SQL changes without caching', async () => {
    const path = `/employees/${employee.id}`;
    const before = (await request(path)).data;
    const renamed = await request(path, { method: 'PATCH', body: { name: 'เปลี่ยนชื่อจริง' } });
    assert.equal(renamed.status, 200);
    assert.deepEqual(renamed.data, { ...before, name: 'เปลี่ยนชื่อจริง' });
    const [rows] = await pool.execute('SELECT name FROM `Thanapol_Kha_Employee` WHERE id = ?', [employee.id]);
    assert.equal(rows[0].name, 'เปลี่ยนชื่อจริง');
    for (const body of [{}, { name: '' }, { salary: null }, { name: 'Invalid', id: '2' }]) {
      assert.equal((await request(path, { method: 'PATCH', body })).status, 400);
    }
    assert.equal((await request('/employees/2147483647', { method: 'PATCH', body: { name: 'Missing' } })).status, 404);
    await pool.execute('UPDATE `Thanapol_Kha_Employee` SET name = ? WHERE id = ?', ['Changed directly in SQL', employee.id]);
    const list = await request('/employees');
    assert.equal(list.data.find(({ id }) => id === employee.id).name, 'Changed directly in SQL');
    assert.equal(list.headers.get('cache-control'), 'no-store');
  });
  await t.test('salary limits, text limits, malformed JSON, invalid IDs and SQL injection', async () => {
    for (const salary of [0, -1, '100', 0.001, 10000000000, null]) {
      assert.equal((await request('/employees', { method: 'POST', body: { name: 'Name', position: 'HR', salary } })).status, 400);
    }
    assert.equal((await request('/employees', { method: 'POST', body: { name: 'a'.repeat(101), position: 'HR', salary: 1 } })).status, 400);
    assert.equal((await request('/employees', { method: 'POST', raw: '{invalid' })).status, 400);
    for (const id of ['1abc', '0', '-1', '2147483648', "1%20OR%201=1"]) {
      assert.equal((await request(`/employees/${id}`)).status, 404);
      assert.equal((await request(`/employees/${id}`, { method: 'DELETE' })).status, 404);
    }
    const injection = "Robert'); DROP TABLE x; --";
    const added = await request('/employees', { method: 'POST', body: { name: injection, position: 'QA', salary: 1 } });
    assert.equal(added.status, 201);
    assert.equal(added.data.name, injection);
    assert.equal((await request(`/employees/${added.data.id}`, { method: 'DELETE' })).status, 200);
  });
  await t.test('analytics reads current SQL rows; delete persists and reports 404 twice', async () => {
    const analytics = await request('/employees/salary-clusters');
    assert.equal(analytics.status, 200);
    assert.equal(analytics.data.clusters.reduce((total, item) => total + item.count, 0), 1);
    assert.equal(analytics.data.clusters[0].centroid, 54321.09);
      assert.deepEqual(analytics.data.clusters[0].salaries, [54321.09]);
    for (const k of [1, 2, 4, 10]) {
      const selected = await request(`/employees/salary-clusters?k=${k}`);
      assert.equal(selected.status, 200);
      assert.equal(selected.data.k, k);
      assert.equal(selected.data.clusters.length, k);
      assert.equal(selected.data.clusters.reduce((sum, group) => sum + group.count, 0), 1);
        assert.deepEqual(selected.data.clusters.flatMap((group) => group.salaries), [54321.09]);
    }
    for (const invalid of ['0', '11', '-1', '2.5', 'abc', '', '3&k=4']) {
      assert.equal((await request(`/employees/salary-clusters?k=${invalid}`)).status, 400);
    }
    const added = await request('/employees', { method: 'POST', body: { name: 'Temporary', position: 'HR', salary: 9999999999.99 } });
    assert.equal(added.status, 201);
    assert.equal((await request(`/employees/${added.data.id}`, { method: 'DELETE' })).status, 200);
    const [remaining] = await pool.execute('SELECT id FROM `Thanapol_Kha_Employee` WHERE id = ?', [added.data.id]);
    assert.equal(remaining.length, 0, 'DELETE must physically remove the SQL row');
    assert.equal((await request(`/employees/${added.data.id}`)).status, 404);
    assert.equal((await request(`/employees/${added.data.id}`, { method: 'DELETE' })).status, 404);
  });

  let regularUser;
  let regularToken;
  await t.test('admin user CRUD, duplicate names, bcrypt and public responses without hashes', async () => {
    const body = { username: 'staff', password: 'StaffPassword123!', role: 'User' };
    const result = await request('/users', { method: 'POST', body });
    assert.equal(result.status, 201);
    regularUser = result.data;
    assert.equal(regularUser.password_hash, undefined);
    const stored = await users.findByUsername('staff');
    assert.match(stored.password_hash, /^\$2[ab]\$/);
    assert.equal((await request('/users', { method: 'POST', body })).status, 409);
    assert.equal((await request(`/users/${regularUser.user_id}`)).data.username, 'staff');
    assert.ok((await request('/users')).data.every((user) => user.password_hash === undefined));
    const login = await request('/login', { method: 'POST', body: { username: 'staff', password: body.password } });
    regularToken = login.data.token;
    assert.equal(login.status, 200);
    assert.equal((await request('/employees', { bearer: regularToken })).status, 200);
    assert.equal((await request('/users', { bearer: regularToken })).status, 403);
  });
  await t.test('password changes revoke old sessions; current DB role controls access', async () => {
    const path = `/users/${regularUser.user_id}`;
    assert.equal((await request(path, { method: 'PUT', body: { username: 'staff', password: 'ChangedPassword123!', role: 'Admin' } })).status, 200);
    assert.equal((await request('/employees', { bearer: regularToken })).status, 401);
    const login = await request('/login', { method: 'POST', body: { username: 'staff', password: 'ChangedPassword123!' } });
    regularToken = login.data.token;
    assert.equal((await request('/users', { bearer: regularToken })).status, 200);
    assert.equal((await request(path, { method: 'PUT', body: { username: 'staff', role: 'User' } })).status, 200);
    assert.equal((await request('/users', { bearer: regularToken })).status, 403);
    assert.equal((await request(path, { method: 'DELETE' })).status, 200);
    assert.equal((await request('/employees', { bearer: regularToken })).status, 401);
    assert.equal((await request(path)).status, 404);
  });
  await t.test('last admin cannot be deleted or demoted', async () => {
    assert.equal((await request(`/users/${admin.user_id}`, { method: 'DELETE' })).status, 409);
    assert.equal((await request(`/users/${admin.user_id}`, { method: 'PUT', body: { username: 'admin', role: 'User' } })).status, 409);
  });
  await t.test('PHP bcrypt $2y$ passwords are accepted', async () => {
    await pool.execute('UPDATE `Thanapol_Kha_Users` SET password_hash = ? WHERE user_id = ?', [passwordHash.replace(/^\$2[ab]\$/, '$2y$'), admin.user_id]);
    const result = await request('/login', { method: 'POST', body: { username: 'admin', password: 'TestAdminPassword123!' } });
    assert.equal(result.status, 200);
    token = result.data.token;
  });
  await t.test('data survives a real API process restart and accepts the same signed token', async () => {
    await new Promise((resolve) => server.close(resolve));
    const child = spawn(process.execPath, ['src/server.js'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, APP_HOST: '127.0.0.1', APP_PORT: String(port), CORS_ORIGINS: '*', DB_HOST: host, DB_PORT: String(connectionConfig.port), DB_USER: connectionConfig.user, DB_PASSWORD: connectionConfig.password, DB_NAME: database, JWT_SECRET: secret },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const closed = once(child, 'exit');
    t.after(async () => { if (child.exitCode === null) { child.kill(); await closed; } });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('API child startup timed out')), 10000);
      child.stdout.on('data', (data) => { if (data.toString().includes('TNPKHR API listening')) { clearTimeout(timer); resolve(); } });
      child.once('exit', () => { clearTimeout(timer); reject(new Error('API child exited before listening')); });
      child.once('error', (error) => { clearTimeout(timer); reject(error); });
    });
    const result = await request(`/employees/${employee.id}`);
    assert.equal(result.status, 200);
    assert.equal(result.data.salary, 54321.09);
    child.kill();
    await closed;
  });
});
