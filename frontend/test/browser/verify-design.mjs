// Visual/interaction verification against a REAL API and a disposable LOCAL SQL DB.
// Fixture employees exist only in the test database, never in application code.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { auditFonts } from './font-audit.mjs';
import { createApp } from '../../../backend/src/app.js';
import { createPool, checkSchema, createEmployeeStore, createUserStore } from '../../../backend/src/stores/mysql.js';
import { createDatabaseAuth, hashPassword } from '../../../backend/src/security.js';

const requireBackend = createRequire(new URL('../../../backend/package.json', import.meta.url));
const express = requireBackend('express');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = path.join(root, 'test-results', 'design');
const host = process.env.DB_TEST_HOST ?? '127.0.0.1';
if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Only a loopback test database is allowed.');
const dbConfig = { host, port: Number(process.env.DB_TEST_PORT ?? 3306), user: process.env.DB_TEST_USER ?? 'root', password: process.env.DB_TEST_PASSWORD ?? '', charset: 'utf8mb4' };
const control = createPool(dbConfig);
const database = `tnpkhr_ui_${randomBytes(8).toString('hex')}`;
let pool, apiServer, staticServer, browser, page, databaseCreated = false;
const errors = [];
let expectingUnauthorized = false;
const requests = [];
const fontAudit = [];
const closeServer = (server) => server ? new Promise((resolve) => server.close(resolve)) : Promise.resolve();
try {
  await mkdir(output, { recursive: true });
  await control.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`);
  databaseCreated = true;
  pool = createPool({ ...dbConfig, database });
  const schema = await readFile(new URL('../../../backend/sql/schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(';').map((item) => item.trim()).filter(Boolean)) await pool.query(statement);
  await checkSchema(pool);
  const users = createUserStore(pool);
  const employees = createEmployeeStore(pool);
  const password = randomBytes(16).toString('hex');
  await users.create({ username: 'ui-admin', role: 'Admin', passwordHash: await hashPassword(password) });
  for (const [name, position, salary, leave] of [
    ['John Doe', 'Software Engineer', 45000, false],
    ['Sarah Wilson', 'UI/UX Designer', 35000, false],
    ['Michael Lee', 'HR Specialist', 28000, true],
    ['Emily Chen', 'Project Manager', 75000, false],
    ['James Miller', 'Intern', 18000, false],
  ]) {
    const employee = await employees.create({ name, position, salary });
    if (leave) await employees.toggle(employee.id);
  }
  apiServer = createApp({ store: employees, users, auth: createDatabaseAuth(users, randomBytes(48).toString('hex')) }).listen(0, '127.0.0.1');
  await once(apiServer, 'listening');
  const apiUrl = `http://127.0.0.1:${apiServer.address().port}`;
  console.log('Building the web preview with a temporary local API URL (no .env changes).');
  const cli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
  await promisify(execFile)(process.execPath, [cli, 'export', '--platform', 'web', '--clear', '--output-dir', path.join(output, 'web')], {
    cwd: root, env: { ...process.env, CI: '1', EXPO_PUBLIC_API_URL: apiUrl }, timeout: 120000, maxBuffer: 4 * 1024 * 1024,
  });
  staticServer = express().use(express.static(path.join(output, 'web'))).listen(0, '127.0.0.1');
  await once(staticServer, 'listening');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (expectingUnauthorized && message.text() === 'Failed to load resource: the server responded with a status of 401 (Unauthorized)') return;
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.method() + ' ' + request.url()); });
  await page.goto(`http://127.0.0.1:${staticServer.address().port}`);
  await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
  fontAudit.push(await auditFonts(page, 'login'));
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `Login overflows at ${width}`);
  }
  await page.screenshot({ path: path.join(output, 'login-desktop.png') });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel('Username', { exact: true }).fill('ui-admin');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Show password' }).click();
  assert.equal(await page.getByLabel('Password', { exact: true }).evaluate((input) => input.type), 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await page.getByLabel('Username', { exact: true }).focus();
  await page.keyboard.press('Tab');
  assert.ok(await page.getByLabel('Password', { exact: true }).evaluate((input) => input === document.activeElement));
  await page.screenshot({ path: path.join(output, 'login-mobile.png') });
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.getByText('Hello, ui-admin', { exact: true }).waitFor();
  await page.getByText('John Doe', { exact: true }).waitFor();
  fontAudit.push(await auditFonts(page, 'dashboard'));
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `Dashboard overflows at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(output, 'dashboard-mobile.png') });
  await page.getByLabel('Search employees').fill('designer');
  await page.getByText('Sarah Wilson', { exact: true }).waitFor();
  assert.equal(await page.getByText('John Doe', { exact: true }).count(), 0);
  await page.getByLabel('Search employees').fill('no matching employee');
  await page.getByText('No employees found', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByText('John Doe', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Add Employee', exact: true }).click();
  await page.getByRole('button', { name: 'Save Employee' }).click();
  await page.getByText('Please enter the employee’s name.', { exact: true }).waitFor();
  let name = 'Design Verification';
  await page.getByLabel('Full name', { exact: true }).fill(name);
  await page.getByLabel('Position', { exact: true }).fill('Quality Engineer');
  await page.getByLabel('Monthly salary (THB)', { exact: true }).fill('37500.50');
  await page.screenshot({ path: path.join(output, 'employee-modal.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Save Employee' }).click();
  await page.getByText('Employee added successfully.', { exact: true }).waitFor();
  const created = (await employees.list()).find((employee) => employee.name === name);
  assert.ok(created, 'Create must insert a real SQL row');
  await page.getByRole('button', { name: `Actions for ${name}` }).click();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `Employee actions overflow at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
  assert.equal(await page.getByLabel('Full name', { exact: true }).inputValue(), name);
  assert.equal(await page.getByLabel('Monthly salary (THB)', { exact: true }).inputValue(), '37500.5');
  name = 'แก้ไขชื่อพนักงาน';
  await page.getByLabel('Full name', { exact: true }).fill(name);
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `Edit dialog overflows at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(output, 'edit-employee-modal.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await page.getByText('Employee updated successfully.', { exact: true }).waitFor();
  const [renamedRows] = await pool.execute('SELECT name, salary FROM `Thanapol_Kha_Employee` WHERE id = ?', [created.id]);
  assert.equal(renamedRows[0].name, name, 'Editing must update the SQL row');
  assert.equal(Number(renamedRows[0].salary), 37500.5);
  const loginCount = requests.filter((request) => request.startsWith('POST ') && request.endsWith('/api/login')).length;
  const remembered = await page.evaluate(() => JSON.parse(localStorage.getItem('tnpkhr.auth.session.v1')));
  assert.deepEqual(Object.keys(remembered).sort(), ['apiUrl', 'token', 'username']);
  await page.reload();
  await page.getByText(name, { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Sign In', exact: true }).count(), 0);
  assert.equal(requests.filter((request) => request.startsWith('POST ') && request.endsWith('/api/login')).length, loginCount, 'Reload must restore the session without another login');
  const returningPage = await page.context().newPage();
  await returningPage.goto(`http://127.0.0.1:${staticServer.address().port}`);
  await returningPage.getByText(name, { exact: true }).waitFor();
  assert.equal(await returningPage.getByRole('button', { name: 'Sign In', exact: true }).count(), 0);
  await returningPage.close();
  await page.getByLabel('Search employees').fill(name);
  await page.getByRole('button', { name: `Actions for ${name}` }).click();
  await page.getByRole('button', { name: `Toggle Status for ${name}` }).click();
  await page.getByText('Employee status updated.', { exact: true }).waitFor();
  await page.getByRole('button', { name: `Actions for ${name}` }).click();
  await page.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByText(name, { exact: true }).waitFor();
  await page.getByRole('button', { name: `Actions for ${name}` }).click();
  await page.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByText('Employee deleted successfully.', { exact: true }).waitFor();
  const [deletedRows] = await pool.execute('SELECT id FROM `Thanapol_Kha_Employee` WHERE id = ?', [created.id]);
  assert.equal(deletedRows.length, 0, 'Deleting must remove the SQL row permanently');
  assert.equal((await employees.list()).length, 5);
  await page.getByRole('tab', { name: 'Analytics', exact: true }).click();
  await page.getByText('Group 1 (Low)', { exact: true }).waitFor();
  assert.equal(await page.getByText(/^Group [123] \((Low|Medium|High)\)$/).count(), 3);
  assert.ok(await page.getByLabel('Average monthly salary by group').count());
    for (const title of ['Average Salary by Tier', 'Employee Distribution', 'Salary Range & Centroid', 'K-Means Salary Clusters']) await page.getByRole('heading', { name: title, exact: true }).waitFor();
  fontAudit.push(await auditFonts(page, 'analytics'));
  for (const k of [4, 10, 1, 3]) {
    await page.getByRole('button', { name: /^Choose number of salary groups/ }).click();
    await page.getByRole('dialog', { name: 'Number of salary groups' }).waitFor();
    if (k === 4) await page.screenshot({ path: path.join(output, 'group-selector.png'), animations: 'disabled' });
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/employees/salary-clusters') && response.request().method() === 'GET');
    await page.getByRole('button', { name: `${k} salary ${k === 1 ? 'group' : 'groups'}`, exact: true }).click();
    const data = await (await responsePromise).json();
    assert.equal(data.k, k);
    assert.equal(data.clusters.length, k);
    assert.equal(data.clusters.reduce((sum, group) => sum + group.count, 0), 5);
    assert.deepEqual(data.clusters.flatMap((group) => group.salaries).sort((a, b) => a - b), [18000, 28000, 35000, 45000, 75000]);
    await page.getByText(k === 3 ? 'Group 1 (Low)' : 'Group 1', { exact: true }).first().waitFor();
    await page.getByRole('dialog', { name: 'Number of salary groups' }).waitFor({ state: 'detached' });
    if (k === 4) await page.screenshot({ path: path.join(output, 'analytics-k4.png'), animations: 'disabled' });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `K=${k} overflows`);
  }
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `Analytics overflows at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  for (let number = 1; number <= 4; number += 1) {
    const chart = page.getByTestId(`salary-chart-${number}`);
    await chart.scrollIntoViewIfNeeded();
    await chart.screenshot({ path: path.join(output, `salary-chart-${number}.png`) });
  }
  await page.screenshot({ path: path.join(output, 'analytics-mobile.png') });
  await page.getByRole('button', { name: 'Refresh analysis' }).click();
  await page.getByText('Group 1 (Low)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('tnpkhr.auth.session.v1')), null);
  await page.reload();
  await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Logout', exact: true }).count(), 0);
  // Restoring a session revoked on the server must clear saved sign-in too.
  await users.update((await users.findByUsername('ui-admin')).user_id, { username: 'ui-admin', passwordHash: await hashPassword(randomBytes(16).toString('hex')) });
  await page.evaluate((session) => localStorage.setItem('tnpkhr.auth.session.v1', JSON.stringify(session)), remembered);
  expectingUnauthorized = true;
  const revokedResponse = page.waitForResponse((response) => response.url().endsWith('/api/employees') && response.status() === 401);
  await page.reload();
  assert.equal((await revokedResponse).status(), 401);
  await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('tnpkhr.auth.session.v1')), null);
  expectingUnauthorized = false;
  assert.deepEqual(errors, [], 'The browser reported errors');
  await writeFile(path.join(output, 'font-audit.json'), JSON.stringify(fontAudit, null, 2));
  await writeFile(path.join(output, 'verification.json'), JSON.stringify({ passed: true, breakpoints: [320, 375, 768, 1024, 1440], browserErrors: errors, database: 'disposable local SQL database', interactions: ['password visibility', 'keyboard focus', 'login', 'search', 'empty search', 'create', 'edit name with SQL verification', 'restore session after reload', 'restore session in new tab', 'toggle status', 'cancel delete', 'confirm delete with SQL verification', 'salary chart', 'refresh analysis', 'logout persists after reload', 'server-revoked session is cleared'] }, null, 2));
  console.log(`UI verification passed. Screenshots: ${output}`);
} catch (error) {
  if (page) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
  console.error(JSON.stringify({ browserErrors: errors, apiRequests: requests }, null, 2));
  throw error;
} finally {
  await browser?.close();
  await closeServer(staticServer);
  await closeServer(apiServer);
  await pool?.end();
  if (databaseCreated) await control.query(`DROP DATABASE \`${database}\``);
  await control.end();
}
