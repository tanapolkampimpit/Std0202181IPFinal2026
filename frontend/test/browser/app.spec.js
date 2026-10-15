import { test, expect } from '@playwright/test';

let createdId;
let startingJohnStatus;
const headers = { Authorization: 'Bearer mock-jwt-token' };
test.afterEach(async ({ request }) => {
  if (createdId) await request.delete(`http://localhost:3000/api/employees/${createdId}`, { headers });
  const current = await (await request.get('http://localhost:3000/api/employees', { headers })).json();
  const john = current.find(({ id }) => id === '1');
  if (john && startingJohnStatus && john.status !== startingJohnStatus) await request.put('http://localhost:3000/api/employees/1/status', { headers });
});

test('real Expo preview: responsive login, authenticated CRUD and current salary tiers', async ({ page, request }) => {
  const initial = await (await request.get('http://localhost:3000/api/employees', { headers })).json();
  startingJohnStatus = initial.find(({ id }) => id === '1').status;
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
  await page.getByLabel('Username', { exact: true }).fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('John Doe', { exact: true })).toBeVisible();
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/preview-dashboard.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle Status for John Doe' }).click();
  await expect(page.getByText('Employee status updated.')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle Status for John Doe' }).click();
  await page.getByRole('button', { name: 'Add Employee', exact: true }).click();
  await page.getByRole('button', { name: 'Add Employee', exact: true }).last().click();
  await expect(page.getByText('Please enter the employee’s name.')).toBeVisible();
  const uniqueName = `Browser QA ${Date.now()}`;
  await page.getByLabel('Full name', { exact: true }).fill(uniqueName);
  await page.getByLabel('Position', { exact: true }).fill('Quality Engineer');
  await page.getByLabel('Monthly salary (THB)', { exact: true }).fill('37500.50');
  const createdResponse = page.waitForResponse((response) => response.url().endsWith('/api/employees') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add Employee', exact: true }).last().click();
  createdId = (await (await createdResponse).json()).id;
  await expect(page.getByText('Employee added successfully.')).toBeVisible();
  await page.getByRole('button', { name: 'Analyze Salary Structure', exact: true }).click();
  await expect(page.getByText('Tier 1', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Tier [123]$/)).toHaveCount(3);
  await expect(page.getByText(String(initial.length + 1), { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/preview-analytics.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to team' }).click();
  await page.getByRole('button', { name: `Delete ${uniqueName}`, exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: `Delete ${uniqueName}`, exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText(uniqueName, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Delete ${uniqueName}`, exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText(uniqueName, { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Logout' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  expect(errors).toEqual([]);
});
