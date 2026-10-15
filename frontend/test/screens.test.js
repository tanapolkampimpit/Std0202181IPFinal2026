import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';

let employees;
function response(data, status = 200) { return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data) }; }
beforeEach(() => {
  employees = [{ id: '1', name: 'John Doe', position: 'Software Engineer', status: 'Active', salary: 45000 }];
  global.fetch = jest.fn(async (url, options) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    const body = options.body ? JSON.parse(options.body) : {};
    if (path === '/api/login') return body.password === 'password123' ? response({ success: true, token: 'mock-jwt-token' }) : response({ error: 'Invalid username or password.' }, 401);
    if (options.headers.Authorization !== 'Bearer mock-jwt-token') return response({ error: 'Unauthorized' }, 401);
    if (path === '/api/employees' && options.method === 'GET') return response(employees);
    if (path === '/api/employees' && options.method === 'POST') { const created = { ...body, id: '2', status: 'Active' }; employees.push(created); return response(created, 201); }
    if (path.endsWith('/status')) { employees[0].status = employees[0].status === 'Active' ? 'On Leave' : 'Active'; return response(employees[0]); }
    if (path === '/api/employees/1' && options.method === 'DELETE') { employees = employees.filter(({ id }) => id !== '1'); return response({ success: true }); }
    if (path === '/api/employees/salary-clusters') return response({ success: true, clusters: [{ group: 'Tier 1', centroid: 45000, count: 1 }, { group: 'Tier 2', centroid: null, count: 0 }, { group: 'Tier 3', centroid: null, count: 0 }] });
    throw new Error(`Unexpected request: ${path}`);
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

async function signIn() {
  await fireEvent.changeText(screen.getByLabelText('Username'), 'admin');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));
  await screen.findByText('John Doe');
}
test('protected dashboard does not mount before sign in; password is secure; login/logout work', async () => {
  await render(<App />);
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  expect(screen.queryByText('Welcome back, Admin')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  await signIn();
  expect(screen.getByText('Welcome back, Admin')).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/employees'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }) }));
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
test('employee form validates, posts a Number and refreshes the list', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Add Employee' }));
  await fireEvent.press(screen.getAllByRole('button', { name: 'Add Employee' }).at(-1));
  expect(screen.getByText('Please enter the employee’s name.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Full name'), 'Jane Doe');
  await fireEvent.changeText(screen.getByLabelText('Position'), 'Designer');
  await fireEvent.changeText(screen.getByLabelText('Monthly salary (THB)'), '32000.50');
  await fireEvent.press(screen.getAllByRole('button', { name: 'Add Employee' }).at(-1));
  await screen.findByText('Jane Doe');
  const call = fetch.mock.calls.find(([, options]) => options.method === 'POST' && options.body.includes('Jane Doe'));
  expect(JSON.parse(call[1].body).salary).toBe(32000.5);
  expect(screen.getByText('2 team members')).toBeTruthy();
});
test('toggle updates the status; Delete waits for a native confirmation and Cancel makes no request', async () => {
  await render(<App />); await signIn();
  await fireEvent.press(screen.getByRole('button', { name: 'Toggle Status for John Doe' }));
  await waitFor(() => expect(employees[0].status).toBe('On Leave'));
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
test('analytics starts loading immediately and renders exactly the three response tiers', async () => {
  await render(<App />); await signIn();
  const normalFetch = global.fetch;
  let finish;
  global.fetch = jest.fn((url, options) => url.endsWith('salary-clusters') ? new Promise((resolve) => { finish = () => resolve(response({ success: true, clusters: [{ group: 'Tier 1', centroid: 12345.67, count: 1 }, { group: 'Tier 2', centroid: null, count: 0 }, { group: 'Tier 3', centroid: null, count: 0 }] })); }) : normalFetch(url, options));
  await fireEvent.press(screen.getByRole('button', { name: 'Analyze Salary Structure' }));
  expect(screen.getByLabelText('Analyzing salaries')).toBeTruthy();
  await act(async () => finish());
  expect(screen.getAllByText(/^Tier [123]$/)).toHaveLength(3);
  expect(screen.getAllByText('—')).toHaveLength(2);
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
  await screen.findByText('Tier 1');
  expect(screen.queryByText('Analysis temporarily unavailable.')).toBeNull();
});
