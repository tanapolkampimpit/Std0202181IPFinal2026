import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

export const SESSION_KEY = 'tnpkhr.auth.session.v1';

// Decoding exp controls local UI lifetime only. The API still verifies the JWT
// signature and checks the current database user on every protected request.
export function readSession(value, apiUrl, now = Date.now()) {
  if (!value || value.apiUrl !== apiUrl || typeof value.token !== 'string' || typeof value.username !== 'string' || !value.username.trim()) return null;
  try {
    const { exp } = jwtDecode(value.token);
    const expiresAt = exp * 1000;
    if (typeof exp !== 'number' || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
    return { token: value.token, username: value.username, expiresAt };
  } catch { return null; }
}

const get = () => Platform.OS === 'web' ? globalThis.localStorage.getItem(SESSION_KEY) : SecureStore.getItemAsync(SESSION_KEY);
const set = (value) => Platform.OS === 'web' ? globalThis.localStorage.setItem(SESSION_KEY, value) : SecureStore.setItemAsync(SESSION_KEY, value);
const remove = () => Platform.OS === 'web' ? globalThis.localStorage.removeItem(SESSION_KEY) : SecureStore.deleteItemAsync(SESSION_KEY);

// Preserve write order so logout cannot be undone by an earlier pending save.
let pending = Promise.resolve();
function write(action) {
  const result = pending.then(action);
  pending = result.catch(() => {});
  return result;
}

export const sessionStorage = {
  async load() {
    await pending;
    try {
      const raw = await get();
      return raw ? JSON.parse(raw) : null;
    } catch {
      await this.clear().catch(() => {});
      return null;
    }
  },
  save({ token, username }, apiUrl) {
    return write(() => set(JSON.stringify({ token, username, apiUrl })));
  },
  clear() { return write(remove); },
};
