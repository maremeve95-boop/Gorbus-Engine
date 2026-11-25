import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const archivePath = resolve('build-assets/gorbus-source.tgz');
const archive = gunzipSync(readFileSync(archivePath));
const wanted = new Set(['index.html', 'styles.css', 'src/main.js']);
const written = new Set();

let offset = 0;
while (offset + 512 <= archive.length) {
  const header = archive.subarray(offset, offset + 512);
  const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
  if (!name) break;

  const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
  const size = Number.parseInt(sizeText || '0', 8);
  if (!Number.isFinite(size) || size < 0) {
    throw new Error(`Invalid TAR entry size for "${name}".`);
  }

  const dataStart = offset + 512;
  const dataEnd = dataStart + size;

  if (wanted.has(name)) {
    const target = resolve(name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, archive.subarray(dataStart, dataEnd));
    written.add(name);
    console.log(`Prepared ${name}`);
  }

  offset = dataStart + Math.ceil(size / 512) * 512;
}

const missing = [...wanted].filter((name) => !written.has(name));
if (missing.length) {
  throw new Error(`Source archive is incomplete. Missing: ${missing.join(', ')}`);
}
console.log('Gorbus source files restored. Starting Vite build.');
