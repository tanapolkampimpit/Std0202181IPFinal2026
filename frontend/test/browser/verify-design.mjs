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
const database = `bluehr_ui_${randomBytes(8).toString('hex')}`;
let pool, apiServer, staticServer, browser, page, databaseCreated = false;
const errors = [];
const requests = [];
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
  page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.method() + ' ' + request.url()); });
  await page.goto(`http://127.0.0.1:${staticServer.address().port}`);
  await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
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
  const name = 'Design Verification';
  await page.getByLabel('Full name', { exact: true }).fill(name);
  await page.getByLabel('Position', { exact: true }).fill('Quality Engineer');
  await page.getByLabel('Monthly salary (THB)', { exact: true }).fill('37500.50');
  await page.screenshot({ path: path.join(output, 'employee-modal.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Save Employee' }).click();
  await page.getByText('Employee added successfully.', { exact: true }).waitFor();
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
  assert.equal((await employees.list()).length, 5);
  await page.getByRole('tab', { name: 'Analytics', exact: true }).click();
  await page.getByText('Group 1 (Low)', { exact: true }).waitFor();
  assert.equal(await page.getByText(/^Group [123] \((Low|Medium|High)\)$/).count(), 3);
  assert.ok(await page.getByLabel('Average monthly salary by group').count());
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth), `Analytics overflows at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(output, 'analytics-mobile.png') });
  await page.getByRole('button', { name: 'Refresh analysis' }).click();
  await page.getByText('Group 1 (Low)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
  assert.deepEqual(errors, [], 'The browser reported errors');
  await writeFile(path.join(output, 'verification.json'), JSON.stringify({ passed: true, breakpoints: [320, 375, 768, 1024, 1440], browserErrors: errors, database: 'disposable local SQL database', interactions: ['password visibility', 'keyboard focus', 'login', 'search', 'empty search', 'create', 'toggle status', 'cancel delete', 'confirm delete', 'salary chart', 'refresh analysis', 'logout'] }, null, 2));
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
