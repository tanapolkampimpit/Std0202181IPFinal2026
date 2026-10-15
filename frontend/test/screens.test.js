import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';

let employees;
const mockToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 28800 })).toString('base64url')}.test-signature`;
function response(data, status = 200) { return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data) }; }
beforeEach(() => {
  employees = [{ id: '1', name: 'John Doe', position: 'Software Engineer', status: 'Active', salary: 45000 }];
  global.fetch = jest.fn(async (url, options) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const body = options.body ? JSON.parse(options.body) : {};
    if (path === '/api/login') return body.password === 'password123' ? response({ success: true, token: mockToken }) : response({ error: 'Invalid username or password.' }, 401);
    if (options.headers.Authorization !== `Bearer ${mockToken}`) return response({ error: 'Unauthorized' }, 401);
    if (path === '/api/employees' && options.method === 'GET') return response(employees);
    if (path === '/api/employees' && options.method === 'POST') { const created = { ...body, id: '2', status: 'Active' }; employees.push(created); return response(created, 201); }
    if (path.endsWith('/status')) { employees[0].status = employees[0].status === 'Active' ? 'On Leave' : 'Active'; return response(employees[0]); }
    if (path === '/api/employees/1' && options.method === 'PUT') { employees[0] = { ...employees[0], ...body }; return response(employees[0]); }
    if (path === '/api/employees/1' && options.method === 'DELETE') { employees = employees.filter(({ id }) => id !== '1'); return response({ success: true }); }
    if (path === '/api/employees/salary-clusters') {
      const k = Number(new URL(url).searchParams.get('k') ?? 3);
      return response({ success: true, k, clusters: Array.from({ length: k }, (_, index) => ({ group: `Tier ${index + 1}`, centroid: index === 0 ? 45000 : null, count: index === 0 ? 1 : 0, salaries: index === 0 ? [45000] : [] })) });
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 80)); });
  jest.restoreAllMocks();
});

async function signIn() {
  await fireEvent.changeText(screen.getByLabelText('Username'), 'admin');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));
  await screen.findByText('John Doe');
}
test('protected dashboard does not mount before sign in; password is secure; login/logout work', async () => {
  await render(<App />);
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  expect(screen.queryByText('Hello, admin')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  await signIn();
  expect(screen.getByText('Hello, admin')).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/employees'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${mockToken}` }) }));
  await fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy();
  expect(screen.queryByText('John Doe')).toBeNull();
});
test('failed login displays native Alert and an inline error', async () => {
  await render(<App />);
  await fireEvent.changeText(screen.getByLabelText('Username'), 'admin');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'bad');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));
  await screen.findByText('Invalid username or password.');
  expect(Alert.alert).toHaveBeenCalledWith('Sign in failed', 'Invalid username or password.');
});

test('password visibility can be toggled without changing the entered value', async () => {
  await render(<App />);
  await fireEvent.changeText(screen.getByLabelText('Password'), 'OnlyForThisTest');
  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  expect(screen.getByLabelText('Password').props.value).toBe('OnlyForThisTest');
  await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
});

test('directory search filters name/position and clearing search restores the real list', async () => {
  await render(<App />); await signIn();
  await fireEvent.changeText(screen.getByLabelText('Search employees'), 'engineer');
  expect(screen.getByText('John Doe')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Search employees'), 'no matching employee');
  expect(screen.queryByText('John Doe')).toBeNull();
  expect(screen.getByText('No employees found')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByText('John Doe')).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: 'Employees' }));
  expect(screen.queryByText('Hello, admin')).toBeNull();
  expect(screen.getByText('John Doe')).toBeTruthy();
});
test('employee form validates, posts a Number and refreshes the list', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Add Employee' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save Employee' }));
  expect(screen.getByText('Please enter the employee’s name.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Full name'), 'Jane Doe');
  await fireEvent.changeText(screen.getByLabelText('Position'), 'Designer');
  await fireEvent.changeText(screen.getByLabelText('Monthly salary (THB)'), '32000.50');
  await fireEvent.press(screen.getByRole('button', { name: 'Save Employee' }));
  await screen.findByText('Jane Doe');
  const call = fetch.mock.calls.find(([, options]) => options.method === 'POST' && options.body.includes('Jane Doe'));
  expect(JSON.parse(call[1].body).salary).toBe(32000.5);
  expect(screen.getByText('2 of 2 employees shown')).toBeTruthy();
});
test('toggle updates the status; Delete waits for a native confirmation and Cancel makes no request', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Actions for John Doe' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Toggle Status for John Doe' }));
  await waitFor(() => expect(employees[0].status).toBe('On Leave'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Actions for John Doe' })).toBeEnabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Actions for John Doe' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete John Doe' })).toBeEnabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Delete John Doe' }));
  const choices = Alert.alert.mock.calls.at(-1)[2];
  expect(choices.map(({ text }) => text)).toEqual(['Cancel', 'Delete']);
  expect(fetch.mock.calls.filter(([, options]) => options.method === 'DELETE')).toHaveLength(0);
  expect(choices[0].onPress).toBeUndefined();
  await act(async () => choices[1].onPress());
  await screen.findByText('Your team starts here');
  expect(fetch.mock.calls.filter(([, options]) => options.method === 'DELETE')).toHaveLength(1);
});

test('Edit prefills current data, saves a changed name to the API and reloads the list', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Actions for John Doe' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Edit John Doe' }));
  expect(screen.getByLabelText('Full name').props.value).toBe('John Doe');
  expect(screen.getByLabelText('Position').props.value).toBe('Software Engineer');
  expect(screen.getByLabelText('Monthly salary (THB)').props.value).toBe('45000');
  await fireEvent.changeText(screen.getByLabelText('Full name'), 'สมชาย ใจดี');
  await fireEvent.press(screen.getByRole('button', { name: 'Save Changes' }));
  await screen.findByText('สมชาย ใจดี');
  expect(screen.queryByText('John Doe')).toBeNull();
  const index = fetch.mock.calls.findIndex(([url, options]) => url.endsWith('/api/employees/1') && options.method === 'PUT');
  expect(JSON.parse(fetch.mock.calls[index][1].body)).toEqual({ name: 'สมชาย ใจดี', position: 'Software Engineer', salary: 45000 });
  expect(fetch.mock.calls.slice(index + 1).some(([url, options]) => url.endsWith('/api/employees') && options.method === 'GET')).toBe(true);
  await fireEvent.press(screen.getByRole('tab', { name: 'Employees' }));
  await screen.findByText('สมชาย ใจดี');
});

test('Edit Cancel sends no update; a failed save keeps the form and original employee', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Actions for John Doe' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Edit John Doe' }));
  await fireEvent.changeText(screen.getByLabelText('Full name'), 'Discard this');
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  expect(fetch.mock.calls.some(([, options]) => options.method === 'PUT')).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Actions for John Doe' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Edit John Doe' }));
  expect(screen.getByLabelText('Full name').props.value).toBe('John Doe');
  const normalFetch = global.fetch;
  global.fetch = jest.fn((url, options) => options.method === 'PUT' ? Promise.resolve(response({ error: 'Database is unavailable.' }, 503)) : normalFetch(url, options));
  await fireEvent.changeText(screen.getByLabelText('Full name'), 'Not saved');
  await fireEvent.press(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(screen.getAllByText('Database is unavailable.').length).toBeGreaterThan(0));
  expect(screen.getByLabelText('Full name').props.value).toBe('Not saved');
  expect(employees[0].name).toBe('John Doe');
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
});
test('analytics starts loading immediately and renders exactly the three response tiers', async () => {
  await render(<App />); await signIn();
  const normalFetch = global.fetch;
  let finish;
  global.fetch = jest.fn((url, options) => url.endsWith('salary-clusters') ? new Promise((resolve) => { finish = () => resolve(response({ success: true, clusters: [{ group: 'Tier 1', centroid: 12345.67, count: 1 }, { group: 'Tier 2', centroid: null, count: 0 }, { group: 'Tier 3', centroid: null, count: 0 }] })); }) : normalFetch(url, options));
  await fireEvent.press(screen.getByRole('button', { name: 'Analyze Salary Structure' }));
  expect(screen.getByLabelText('Analyzing salaries')).toBeTruthy();
  await act(async () => finish());
  expect(screen.getAllByText(/^Group [123] \((Low|Medium|High)\)$/)).toHaveLength(3);
  expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/12,345.67/)).toBeTruthy();
});
test('analytics failure offers Retry and a successful retry clears the error', async () => {
  await render(<App />); await signIn();
  const normalFetch = global.fetch;
  global.fetch = jest.fn((url, options) => url.endsWith('salary-clusters') ? Promise.resolve(response({ error: 'Analysis temporarily unavailable.' }, 500)) : normalFetch(url, options));
  await fireEvent.press(screen.getByRole('button', { name: 'Analyze Salary Structure' }));
  await screen.findByText('Analysis temporarily unavailable.');
  global.fetch = normalFetch;
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Group 1 (Low)');
  expect(screen.queryByText('Analysis temporarily unavailable.')).toBeNull();
});

test('selecting K requests the selected number of real API groups', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Analyze Salary Structure' }));
  await screen.findByText('Group 1 (Low)');
  await fireEvent.press(screen.getByRole('button', { name: 'Choose number of salary groups, current K 3' }));
  await fireEvent.press(screen.getByRole('button', { name: '4 salary groups' }));
  await screen.findAllByText('Group 4');
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/employees/salary-clusters?k=4'), expect.anything());
    expect(screen.getAllByText(/^Group [1234]$/)).toHaveLength(8); // group cards and chart labels
    for (const title of ['Average Salary by Tier', 'Employee Distribution', 'Salary Range & Centroid', 'K-Means Salary Clusters']) expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByLabelText(/Salary scatter plot: 1 employees in 4 salary tiers/)).toBeTruthy();
    expect(screen.getByLabelText('Tier 1: minimum ฿45,000.00, average ฿45,000.00, maximum ฿45,000.00')).toBeTruthy();
});
