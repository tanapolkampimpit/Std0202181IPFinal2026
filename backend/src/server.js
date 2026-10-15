import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
const server = createApp().listen(port, '0.0.0.0', () => {
  console.log(`BlueHR API listening on 0.0.0.0:${port}`);
  console.log('Development only: in-memory data and mock bearer authentication.');
});
server.on('error', (error) => { console.error(`Unable to start BlueHR API: ${error.message}`); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
