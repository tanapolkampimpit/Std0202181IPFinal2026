import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { initialEmployees } from './data/employees.js';
import { requireAuth, MOCK_TOKEN } from './middleware/auth.js';
import { salaryClusters } from './algorithms/kmeans.js';

export function createApp(seed = initialEmployees()) {
  const app = express();
  let employees = seed.map((employee) => ({ ...employee }));
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (username === 'admin' && password === 'password123') {
      return res.status(200).json({ success: true, token: MOCK_TOKEN });
    }
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  });

  app.use('/api/employees', requireAuth);

  // Static analytics path is deliberately registered before dynamic ID paths.
  app.get('/api/employees/salary-clusters', (_req, res) => {
    res.json({ success: true, clusters: salaryClusters(employees.map(({ salary }) => salary)) });
  });

  app.get('/api/employees', (_req, res) => res.json(employees));

  app.post('/api/employees', (req, res) => {
    const { name, position, salary } = req.body ?? {};
    const errors = {};
    if (typeof name !== 'string' || !name.trim()) errors.name = 'Enter an employee name.';
    if (typeof position !== 'string' || !position.trim()) errors.position = 'Enter a position.';
    if (typeof salary !== 'number' || !Number.isFinite(salary) || salary <= 0) {
      errors.salary = 'Salary must be a finite number greater than zero.';
    }
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: 'Please check the employee details.', errors });
    const employee = { id: randomUUID(), name: name.trim(), position: position.trim(), status: 'Active', salary };
    employees.push(employee);
    return res.status(201).json(employee);
  });

  app.put('/api/employees/:id/status', (req, res) => {
    const employee = employees.find(({ id }) => id === req.params.id);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found.' });
    employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
    return res.json(employee);
  });

  app.delete('/api/employees/:id', (req, res) => {
    const index = employees.findIndex(({ id }) => id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Employee not found.' });
    employees.splice(index, 1);
    return res.json({ success: true, message: 'Employee deleted.' });
  });

  app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, error: 'Request body must contain valid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ success: false, error: 'Request body is too large.' });
    console.error(error);
    return res.status(500).json({ success: false, error: 'Something went wrong on the server.' });
  });
  return app;
}
