import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi, ApiError } from '../src/services/client.js';

const { BLUEHR_TEST_API_URL: baseUrl, BLUEHR_TEST_USERNAME: username, BLUEHR_TEST_PASSWORD: password } = process.env;
test('frontend Fetch helper integrates with the running MySQL API', { skip: !baseUrl || !username || !password ? 'Set BLUEHR_TEST_API_URL, BLUEHR_TEST_USERNAME and BLUEHR_TEST_PASSWORD for a disposable test environment.' : false }, async (t) => {
  const publicApi = createApi({ baseUrl });
  await assert.rejects(() => publicApi('/api/employees'), (error) => error instanceof ApiError && error.status === 401);
  await assert.rejects(() => publicApi('/api/login', { method: 'POST', body: { username, password: 'wrong' } }), /Invalid username/);
  const { token } = await publicApi('/api/login', { method: 'POST', body: { username, password } });
  const api = createApi({ baseUrl, token });
  const before = await api('/api/employees');
  const employee = await api('/api/employees', { method: 'POST', body: { name: 'Mobile Integration', position: 'QA Engineer', salary: 38000 } });
  let removed = false;
  t.after(async () => { if (!removed) await api(`/api/employees/${employee.id}`, { method: 'DELETE' }); });
  assert.equal((await api('/api/employees')).length, before.length + 1);
  assert.equal((await api(`/api/employees/${employee.id}/status`, { method: 'PUT' })).status, 'On Leave');
  const analysis = await api('/api/employees/salary-clusters');
  assert.equal(analysis.clusters.length, 3);
  assert.equal(analysis.clusters.reduce((sum, group) => sum + group.count, 0), before.length + 1);
  await api(`/api/employees/${employee.id}`, { method: 'DELETE' });
  removed = true;
  assert.equal((await api('/api/employees')).length, before.length);
  let signedOut = false;
  const expired = createApi({ baseUrl, token: 'bad-token', onUnauthorized: () => { signedOut = true; } });
  await assert.rejects(() => expired('/api/employees'), (error) => error.status === 401);
  assert.equal(signedOut, true);
});
