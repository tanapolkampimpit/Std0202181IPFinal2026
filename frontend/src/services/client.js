export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

// Pure Fetch helper: shared by React Native screens and live integration tests.
export function createApi({ baseUrl, token, onUnauthorized, timeout = 15000 }) {
  const base = baseUrl.replace(/\/+$/, '');
  return async function request(path, { method = 'GET', body } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      const raw = await response.text();
      let data;
      try { data = raw ? JSON.parse(raw) : null; }
      catch { throw new ApiError('The server returned an unreadable response. Check the API address and try again.', response.status); }
      if (!response.ok) {
        if (response.status === 401 && token) onUnauthorized?.();
        throw new ApiError(data?.error || `Request failed (${response.status}). Please try again.`, response.status, data?.errors);
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError') throw new ApiError('The request took too long. Check your connection and try again.');
      throw new ApiError(`Cannot reach BlueHR at ${base}. Check that the server is running and your network address is correct.`);
    } finally { clearTimeout(timer); }
  };
}
