import { test, expect } from '@playwright/test';

let createdId;
const apiBase = process.env.BLUEHR_TEST_API_URL ?? 'http://localhost:3000';
const username = process.env.BLUEHR_TEST_USERNAME;
const password = process.env.BLUEHR_TEST_PASSWORD;
let headers;
test.skip(!username || !password, 'Set BLUEHR_TEST_USERNAME and BLUEHR_TEST_PASSWORD for a disposable database environment.');
test.afterEach(async ({ request }) => {
  if (createdId) await request.delete(`${apiBase}/api/employees/${createdId}`, { headers });
  createdId = undefined;
});

test('real Expo preview: responsive login, authenticated CRUD and current salary tiers', async ({ page, request }) => {
  const login = await request.post(`${apiBase}/api/login`, { data: { username, password } });
  expect(login.ok()).toBe(true);
  headers = { Authorization: `Bearer ${(await login.json()).token}` };
  const initial = await (await request.get(`${apiBase}/api/employees`, { headers })).json();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const width of [320, 375, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/preview-login.png', fullPage: true });
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('button', { name: 'Add Employee', exact: true })).toBeVisible();
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/preview-dashboard.png', fullPage: true });
  await page.getByRole('button', { name: 'Add Employee', exact: true }).click();
  await page.getByRole('button', { name: 'Save Employee', exact: true }).click();
  await expect(page.getByText('Please enter the employee’s name.')).toBeVisible();
  const uniqueName = `Browser QA ${Date.now()}`;
  await page.getByLabel('Full name', { exact: true }).fill(uniqueName);
  await page.getByLabel('Position', { exact: true }).fill('Quality Engineer');
  await page.getByLabel('Monthly salary (THB)', { exact: true }).fill('37500.50');
  const createdResponse = page.waitForResponse((response) => response.url().endsWith('/api/employees') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save Employee', exact: true }).click();
  createdId = (await (await createdResponse).json()).id;
  await expect(page.getByText('Employee added successfully.')).toBeVisible();
  await page.getByRole('button', { name: `Actions for ${uniqueName}` }).click();
  await page.getByRole('button', { name: `Toggle Status for ${uniqueName}` }).click();
  await expect(page.getByText('Employee status updated.')).toBeVisible();
  await page.getByRole('button', { name: `Actions for ${uniqueName}` }).click();
  await page.getByRole('button', { name: `Toggle Status for ${uniqueName}` }).click();
  await page.getByRole('button', { name: 'Analyze Salary Structure', exact: true }).click();
  await expect(page.getByText('Group 1 (Low)', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Group [123] \((Low|Medium|High)\)$/)).toHaveCount(3);
  await expect(page.getByText(`3 salary groups · ${initial.length + 1} employees analyzed`, { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/preview-analytics.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to team' }).click();
  await page.getByRole('button', { name: `Actions for ${uniqueName}`, exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: `Actions for ${uniqueName}`, exact: true }).click();
  await page.getByRole('button', { name: `Delete ${uniqueName}`, exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText(uniqueName, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Actions for ${uniqueName}`, exact: true }).click();
  await page.getByRole('button', { name: `Delete ${uniqueName}`, exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText(uniqueName, { exact: true })).toHaveCount(0);
  createdId = undefined;
  await page.getByRole('button', { name: 'Logout' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  expect(errors).toEqual([]);
});
