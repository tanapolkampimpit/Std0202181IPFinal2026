import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { kMeans1D } from '../src/algorithms/kmeans.js';

test('HTTP API: authentication, validation, CRUD and live salary analysis', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const auth = { Authorization: 'Bearer mock-jwt-token' };
  async function request(path, { method = 'GET', body, headers = auth, raw } = {}) {
    const response = await fetch(`${base}/api${path}`, { method, headers: { ...headers, 'Content-Type': 'application/json' }, ...(body !== undefined || raw ? { body: raw || JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  }
  await t.test('correct login returns exactly HTTP 200 and mock token', async () => {
    assert.deepEqual(await request('/login', { method: 'POST', body: { username: 'admin', password: 'password123' }, headers: {} }), { status: 200, data: { success: true, token: 'mock-jwt-token' } });
  });
  await t.test('wrong or missing credentials return 401 and meaningful JSON', async () => {
    for (const body of [{ username: 'admin', password: 'wrong' }, {}, { username: 'ADMIN', password: 'password123' }]) {
      const result = await request('/login', { method: 'POST', body, headers: {} });
      assert.equal(result.status, 401); assert.match(result.data.error, /username or password/i);
    }
  });
  await t.test('all employee methods and analytics reject missing or invalid tokens', async () => {
    for (const [path, method] of [['/employees', 'GET'], ['/employees', 'POST'], ['/employees/1/status', 'PUT'], ['/employees/1', 'DELETE'], ['/employees/salary-clusters', 'GET']]) {
      for (const headers of [{}, { Authorization: 'Bearer wrong' }]) assert.equal((await request(path, { method, headers })).status, 401);
    }
  });
  await t.test('initial list contains at least five employees with valid schema', async () => {
    const { status, data } = await request('/employees');
    assert.equal(status, 200); assert.ok(data.length >= 5);
    assert.equal(new Set(data.map(({ id }) => id)).size, data.length);
    for (const employee of data) {
      assert.equal(typeof employee.id, 'string'); assert.equal(typeof employee.name, 'string'); assert.equal(typeof employee.position, 'string');
      assert.ok(['Active', 'On Leave'].includes(employee.status)); assert.ok(Number.isFinite(employee.salary) && employee.salary > 0);
    }
  });
  await t.test('missing, whitespace and wrong-type name/position/salary return 400', async () => {
    for (const body of [{}, { position: 'Engineer', salary: 10 }, { name: 'Name', salary: 10 }, { name: 'Name', position: 'Engineer' }, { name: '  ', position: 'HR', salary: 10 }, { name: 'Name', position: '\t ', salary: 10 }, { name: 12, position: 'HR', salary: 10 }, { name: 'Name', position: [], salary: 10 }]) {
      const result = await request('/employees', { method: 'POST', body });
      assert.equal(result.status, 400); assert.ok(result.data.error); assert.ok(result.data.errors);
    }
  });
  await t.test('invalid, numeric-string, NaN, Infinity, zero and negative salaries return 400', async () => {
    for (const salary of ['', 'abc', '45000', '  ', NaN, Infinity, null, 0, -1, true, [], {}]) {
      assert.equal((await request('/employees', { method: 'POST', body: { name: 'Name', position: 'HR', salary } })).status, 400);
    }
    assert.equal((await request('/employees', { method: 'POST', raw: '{"name":"Name","position":"HR","salary":1e999}' })).status, 400);
  });
  let created;
  await t.test('valid POST returns 201, trims text, assigns unique ID and Active status', async () => {
    const before = (await request('/employees')).data;
    const result = await request('/employees', { method: 'POST', body: { name: '  Test Employee  ', position: '  QA Engineer ', salary: 35200.5, status: 'On Leave', id: '1' } });
    assert.equal(result.status, 201); created = result.data;
    assert.equal(created.name, 'Test Employee'); assert.equal(created.position, 'QA Engineer'); assert.equal(created.status, 'Active'); assert.equal(created.salary, 35200.5);
    assert.ok(!before.some(({ id }) => id === created.id));
    assert.equal((await request('/employees')).data.length, before.length + 1);
  });
  await t.test('PUT toggles Active to On Leave and back', async () => {
    assert.equal((await request(`/employees/${created.id}/status`, { method: 'PUT' })).data.status, 'On Leave');
    assert.equal((await request(`/employees/${created.id}/status`, { method: 'PUT' })).data.status, 'Active');
  });
  async function verifyAnalytics() {
    const employees = (await request('/employees')).data;
    const { status, data } = await request('/employees/salary-clusters');
    assert.equal(status, 200); assert.equal(data.success, true); assert.equal(data.clusters.length, 3);
    assert.equal(data.clusters.reduce((sum, item) => sum + item.count, 0), employees.length);
    const assigned = kMeans1D(employees.map(({ salary }) => salary));
    data.clusters.forEach((cluster, i) => {
      assert.equal(cluster.group, `Tier ${i + 1}`); assert.equal(cluster.count, assigned[i].values.length);
      const expected = cluster.count ? Number((assigned[i].values.reduce((sum, salary) => sum + salary, 0) / cluster.count).toFixed(2)) : null;
      assert.equal(cluster.centroid, expected);
    });
  }
  await t.test('analytics returns three real tiers, correct counts and means after addition', verifyAnalytics);
  await t.test('DELETE removes employee and analytics recalculates from current array', async () => {
    assert.equal((await request(`/employees/${created.id}`, { method: 'DELETE' })).data.success, true);
    assert.ok(!(await request('/employees')).data.some(({ id }) => id === created.id));
    await verifyAnalytics();
  });
  await t.test('unknown employee IDs return 404 for toggle and delete', async () => {
    for (const [path, method] of [['/employees/missing/status', 'PUT'], ['/employees/missing', 'DELETE']]) {
      const result = await request(path, { method }); assert.equal(result.status, 404); assert.equal(result.data.error, 'Employee not found.');
    }
  });
  await t.test('malformed JSON and unknown routes return JSON errors', async () => {
    assert.equal((await request('/employees', { method: 'POST', raw: '{broken' })).status, 400);
    assert.equal((await request('/missing')).status, 404);
  });
  await t.test('deleting all employees produces three empty tiers, and adding works again', async () => {
    for (const employee of (await request('/employees')).data) await request(`/employees/${employee.id}`, { method: 'DELETE' });
    assert.deepEqual((await request('/employees/salary-clusters')).data.clusters, [1, 2, 3].map((i) => ({ group: `Tier ${i}`, centroid: null, count: 0 })));
    assert.equal((await request('/employees', { method: 'POST', body: { name: 'New team', position: 'HR', salary: 20000 } })).status, 201);
    await verifyAnalytics();
  });
});
