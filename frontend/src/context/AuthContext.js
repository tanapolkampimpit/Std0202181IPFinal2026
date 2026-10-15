import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createApi } from '../services/client';
import { readSession, sessionStorage } from '../services/sessionStorage';
import { API_URL } from '../config';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const currentSession = useRef(null);
  const invalidate = useCallback((expectedToken) => {
    if (expectedToken && currentSession.current?.token !== expectedToken) return;
    currentSession.current = null;
    setSession(null);
    sessionStorage.clear().catch(() => {});
  }, []);
  const logout = useCallback(() => invalidate(), [invalidate]);
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await sessionStorage.load();
      if (!active) return;
      const restored = readSession(saved, API_URL);
      if (saved && !restored) await sessionStorage.clear().catch(() => {});
      if (!active) return;
      currentSession.current = restored;
      setSession(restored);
      setRestoring(false);
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!session) return;
    const checkExpiry = () => { if (Date.now() >= session.expiresAt) invalidate(session.token); };
    const timer = setTimeout(checkExpiry, Math.min(session.expiresAt - Date.now(), 2147483647));
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') checkExpiry(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, [session, invalidate]);
  const token = session?.token ?? null;
  const username = session?.username ?? '';
  const api = useMemo(() => createApi({ baseUrl: API_URL, token, onUnauthorized: () => invalidate(token) }), [token, invalidate]);
  const login = useCallback(async (username, password) => {
    const response = await api('/api/login', { method: 'POST', body: { username, password } });
    if (!response?.success || !response.token) throw new Error('Sign in was not completed. Please try again.');
    const next = readSession({ token: response.token, username: username.trim(), apiUrl: API_URL }, API_URL);
    if (!next) throw new Error('Your session is invalid or expired. Please sign in again.');
    // Storage may be unavailable (for example restricted browser storage).
    // Keep sign-in usable for the current app session in that case.
    await sessionStorage.save(next, API_URL).catch(() => {});
    currentSession.current = next;
    setSession(next);
  }, [api]);
  return <AuthContext.Provider value={{ token, username, restoring, api, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
