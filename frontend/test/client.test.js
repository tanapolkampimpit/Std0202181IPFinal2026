import { createApi, ApiError } from '../src/services/client';

afterEach(() => jest.restoreAllMocks());
test('network failure produces a useful error with API address', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
  await expect(createApi({ baseUrl: 'http://10.0.2.2:3000' })('/api/employees')).rejects.toThrow('Cannot reach BlueHR at http://10.0.2.2:3000');
});
test('invalid JSON is reported clearly', async () => {
  global.fetch = jest.fn().mockResolvedValue({ status: 502, ok: false, text: async () => '<html>bad gateway</html>' });
  await expect(createApi({ baseUrl: 'http://localhost:3000' })('/api/employees')).rejects.toBeInstanceOf(ApiError);
});
test('timeout aborts the request and produces a retryable message', async () => {
  global.fetch = jest.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => { const error = new Error('Aborted'); error.name = 'AbortError'; reject(error); })));
  await expect(createApi({ baseUrl: 'http://localhost:3000', timeout: 10 })('/api/employees')).rejects.toThrow('The request took too long');
});
