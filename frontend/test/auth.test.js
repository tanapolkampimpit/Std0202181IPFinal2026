import React from 'react';
import { Button, Text, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { readSession, sessionStorage, SESSION_KEY } from '../src/services/sessionStorage';
import { API_URL } from '../src/config';

const makeToken = (expires = Math.floor(Date.now() / 1000) + 28800) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ exp: expires })).toString('base64url')}.test-signature`;
const reply = (value, status = 200) => ({ ok: status === 200, status, text: async () => JSON.stringify(value) });
let token;

function Harness() {
  const { token: current, username, restoring, login, logout, api } = useAuth();
  if (restoring) return <Text>Restoring session</Text>;
  return <View><Text>{current ? `Signed in: ${username}` : 'Signed out'}</Text>
    <Button title="Login" onPress={() => login('admin', 'test-password').catch(() => {})} />
    <Button title="Logout" onPress={logout} />
    <Button title="Request" onPress={() => api('/api/employees').catch(() => {})} />
  </View>;
}
const tree = () => <AuthProvider><Harness /></AuthProvider>;
const savedSession = () => ({ token, username: 'admin', apiUrl: API_URL });
beforeEach(() => {
  token = makeToken();
  global.fetch = jest.fn(async () => reply({ success: true, token }));
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test('login remembers only token, username and API address; remount restores without another login', async () => {
  const view = await render(tree());
  await screen.findByText('Signed out');
  await fireEvent.press(screen.getByRole('button', { name: 'Login' }));
  await screen.findByText('Signed in: admin');
  expect(JSON.parse(SecureStore.__storage.get(SESSION_KEY))).toEqual(savedSession());
  expect(fetch).toHaveBeenCalledTimes(1);
  await view.unmount();
  await render(tree());
  await screen.findByText('Signed in: admin');
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('logout removes the persisted session and a new app instance stays logged out', async () => {
  SecureStore.__storage.set(SESSION_KEY, JSON.stringify(savedSession()));
  const view = await render(tree());
  await screen.findByText('Signed in: admin');
  await fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await screen.findByText('Signed out');
  await waitFor(() => expect(SecureStore.__storage.has(SESSION_KEY)).toBe(false));
  await view.unmount();
  await render(tree());
  await screen.findByText('Signed out');
  expect(fetch).not.toHaveBeenCalled();
});

test.each([
  ['expired', () => ({ ...savedSession(), token: makeToken(Math.floor(Date.now() / 1000) - 1) })],
  ['different API', () => ({ ...savedSession(), apiUrl: 'http://different-server:3019' })],
  ['malformed token', () => ({ ...savedSession(), token: 'broken' })],
])('%s saved sessions are removed before showing sign-in', async (_label, value) => {
  SecureStore.__storage.set(SESSION_KEY, JSON.stringify(value()));
  await render(tree());
  await screen.findByText('Signed out');
  expect(SecureStore.__storage.has(SESSION_KEY)).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});

test('corrupted storage is cleared and does not block opening the app', async () => {
  SecureStore.__storage.set(SESSION_KEY, '{invalid json');
  await render(tree());
  await screen.findByText('Signed out');
  expect(SecureStore.__storage.has(SESSION_KEY)).toBe(false);
});

test('the login screen waits while the saved session is loading', async () => {
  let finish;
  SecureStore.getItemAsync.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  await render(tree());
  expect(screen.getByText('Restoring session')).toBeTruthy();
  expect(screen.queryByText('Signed out')).toBeNull();
  await act(async () => finish(JSON.stringify(savedSession())));
  await screen.findByText('Signed in: admin');
});

test('a server 401 clears the stored session', async () => {
  SecureStore.__storage.set(SESSION_KEY, JSON.stringify(savedSession()));
  await render(tree());
  await screen.findByText('Signed in: admin');
  fetch.mockResolvedValueOnce(reply({ error: 'Unauthorized. Sign in again.' }, 401));
  await fireEvent.press(screen.getByRole('button', { name: 'Request' }));
  await screen.findByText('Signed out');
  await waitFor(() => expect(SecureStore.__storage.has(SESSION_KEY)).toBe(false));
});

test('a network error preserves the saved session', async () => {
  SecureStore.__storage.set(SESSION_KEY, JSON.stringify(savedSession()));
  await render(tree());
  await screen.findByText('Signed in: admin');
  fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await fireEvent.press(screen.getByRole('button', { name: 'Request' }));
  expect(screen.getByText('Signed in: admin')).toBeTruthy();
  expect(JSON.parse(SecureStore.__storage.get(SESSION_KEY))).toEqual(savedSession());
});

test('an open session expires automatically without waiting for another API request', async () => {
  jest.useFakeTimers();
  token = makeToken(Math.floor(Date.now() / 1000) + 60);
  SecureStore.__storage.set(SESSION_KEY, JSON.stringify(savedSession()));
  await render(tree());
  await screen.findByText('Signed in: admin');
  await act(async () => { jest.advanceTimersByTime(60001); });
  expect(screen.getByText('Signed out')).toBeTruthy();
  expect(SecureStore.__storage.has(SESSION_KEY)).toBe(false);
});

test('unavailable storage permits signing in for the current app session', async () => {
  SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Storage unavailable'));
  SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage unavailable'));
  await render(tree());
  await screen.findByText('Signed out');
  await fireEvent.press(screen.getByRole('button', { name: 'Login' }));
  await screen.findByText('Signed in: admin');
});

test('queued logout removes a session even when saving has not finished yet', async () => {
  let finish;
  SecureStore.setItemAsync.mockImplementationOnce((key, value) => new Promise((resolve) => {
    finish = () => { SecureStore.__storage.set(key, value); resolve(); };
  }));
  const saving = sessionStorage.save(savedSession(), API_URL);
  const clearing = sessionStorage.clear();
  await Promise.resolve();
  finish();
  await Promise.all([saving, clearing]);
  expect(SecureStore.__storage.has(SESSION_KEY)).toBe(false);
});

test('expiry must be a finite number in the future', () => {
  for (const exp of [null, '9999999999', 0, -1]) {
    expect(readSession({ ...savedSession(), token: makeToken(exp) }, API_URL)).toBeNull();
  }
});
