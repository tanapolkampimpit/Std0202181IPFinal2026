import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createApi } from '../services/client';
import { API_URL } from '../config';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const logout = useCallback(() => { setToken(null); setUsername(''); }, []);
  const api = useMemo(() => createApi({ baseUrl: API_URL, token, onUnauthorized: logout }), [token, logout]);
  const login = useCallback(async (username, password) => {
    const response = await api('/api/login', { method: 'POST', body: { username, password } });
    if (!response?.success || !response.token) throw new Error('Sign in was not completed. Please try again.');
    setToken(response.token);
    setUsername(username);
  }, [api]);
  return <AuthContext.Provider value={{ token, username, api, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
