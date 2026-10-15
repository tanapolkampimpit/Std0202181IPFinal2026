import { mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('..', import.meta.url));
const destination = path.resolve(process.argv[2] ?? path.join(source, '..', '..', 'Backend'));
const relative = path.relative(source, destination);
if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('Choose an output folder outside backend.');
let exists = true;
try { await access(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; exists = false; }
if (exists) throw new Error('Output folder already exists. Supply a new destination; existing files will not be overwritten.');
await mkdir(destination, { recursive: true });
for (const name of ['.env.example', 'package.json', 'package-lock.json', 'README.md', 'run.sh', 'src', 'scripts', 'sql', 'test', 'integration']) {
  await cp(path.join(source, name), path.join(destination, name), { recursive: true, filter: (entry) => !['.env', 'node_modules', '.git'].includes(path.basename(entry)) });
}
console.log(`FileZilla package created: ${destination}`);
console.log('Local .env, credentials and node_modules were excluded. Configure a private .env on the server.');
