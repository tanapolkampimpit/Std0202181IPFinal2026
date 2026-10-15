import express from 'express';
import cors from 'cors';
import { salaryClusters } from './algorithms/kmeans.js';
import { hashPassword, requireAdmin } from './security.js';
import { employeeInput, userInput } from './validation.js';

export function createApp({ store, auth, users, corsOrigin = '*' } = {}) {
  if (!store || !auth || !users) throw new Error('MySQL employee/user stores and database authentication are required.');
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', async (_req, res) => {
    try { await store.ping(); res.json({ success: true, database: 'ok' }); }
    catch { res.status(503).json({ success: false, error: 'Database is unavailable.' }); }
  });
  app.post('/api/login', async (req, res) => {
    const token = await auth.login(req.body?.username, req.body?.password);
    if (!token) return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    res.json({ success: true, token });
  });
  app.use('/api/employees', auth.middleware);

  // Static analytics path is deliberately registered before dynamic ID paths.
  app.get('/api/employees/salary-clusters', async (_req, res) => {
    const employees = await store.list();
    res.json({ success: true, clusters: salaryClusters(employees.map(({ salary }) => salary)) });
  });

  app.get('/api/employees', async (_req, res) => res.json(await store.list()));
  app.get('/api/employees/:id', async (req, res) => {
    const item = await store.get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Employee not found.' });
    res.json(item);
  });

  app.post('/api/employees', async (req, res) => {
    const { data, errors } = employeeInput(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: 'Please check the employee details.', errors });
    res.status(201).json(await store.create(data));
  });

  app.put('/api/employees/:id/status', async (req, res) => {
    const employee = await store.toggle(req.params.id);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found.' });
    return res.json(employee);
  });

  app.put('/api/employees/:id', async (req, res) => {
    const { data, errors } = employeeInput(req.body, { update: true });
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: 'Please check the employee details.', errors });
    const item = await store.update(req.params.id, data);
    if (!item) return res.status(404).json({ success: false, error: 'Employee not found.' });
    res.json(item);
  });
  app.delete('/api/employees/:id', async (req, res) => {
    if (!await store.remove(req.params.id)) return res.status(404).json({ success: false, error: 'Employee not found.' });
    return res.json({ success: true, message: 'Employee deleted.' });
  });

  if (users) {
    app.use('/api/users', auth.middleware, requireAdmin);
    app.get('/api/users', async (_req, res) => res.json(await users.list()));
    app.get('/api/users/:id', async (req, res) => {
      const item = await users.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'User not found.' });
      res.json(item);
    });
    app.post('/api/users', async (req, res) => {
      const { data, errors } = userInput(req.body);
      if (Object.keys(errors).length) return res.status(400).json({ success: false, error: 'Please check the user details.', errors });
      const passwordHash = await hashPassword(data.password);
      res.status(201).json(await users.create({ username: data.username, role: data.role, passwordHash }));
    });
    app.put('/api/users/:id', async (req, res) => {
      const { data, errors } = userInput(req.body, { update: true });
      if (Object.keys(errors).length) return res.status(400).json({ success: false, error: 'Please check the user details.', errors });
      const passwordHash = data.password === undefined ? undefined : await hashPassword(data.password);
      const item = await users.update(req.params.id, { username: data.username, role: data.role, passwordHash });
      if (!item) return res.status(404).json({ success: false, error: 'User not found.' });
      res.json(item);
    });
    app.delete('/api/users/:id', async (req, res) => {
      if (!await users.remove(req.params.id)) return res.status(404).json({ success: false, error: 'User not found.' });
      res.json({ success: true, message: 'User deleted.' });
    });
  }
  app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, error: 'Request body must contain valid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ success: false, error: 'Request body is too large.' });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: 'Username already exists.' });
    if (error.status === 409) return res.status(409).json({ success: false, error: error.message });
    if (['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'].includes(error.code)) {
      return res.status(503).json({ success: false, error: 'Database is unavailable.' });
    }
    console.error('API request failed:', error.code ?? error.name);
    return res.status(500).json({ success: false, error: 'Something went wrong on the server.' });
  });
  return app;
}
