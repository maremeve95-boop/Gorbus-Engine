import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const partPaths = Array.from({ length: 9 }, (_, index) =>
  resolve('build-assets', `v05-source-${String(index + 1).padStart(2, '0')}.br64`)
);
const base64 = partPaths.map((path) => readFileSync(path, 'utf8').trim()).join('');
const compressed = Buffer.from(base64, 'base64');
const digest = createHash('sha256').update(compressed).digest('hex');

if (digest !== '8cbfa4bcb0c11e24310207b1bb502d44b66fc1aab42a75b9b955bf98cdb7ed44') {
  throw new Error('Gorbus Engine source archive failed its SHA-256 integrity check. Check the build-assets parts.');
}

const archive = brotliDecompressSync(compressed);
if (archive.length !== 153600) {
  throw new Error(`Unexpected source archive size: ${archive.length} bytes.`);
}

const wanted = new Set(['index.html', 'styles.css', 'src/main.js']);
const written = new Set();

function readTarString(buffer) {
  const end = buffer.indexOf(0);
  return buffer.subarray(0, end === -1 ? buffer.length : end).toString('utf8');
}

let offset = 0;
while (offset + 512 <= archive.length) {
  const header = archive.subarray(offset, offset + 512);
  const name = readTarString(header.subarray(0, 100));
  if (!name) break;

  const sizeText = readTarString(header.subarray(124, 136)).trim();
  const size = Number.parseInt(sizeText || '0', 8);
  if (!Number.isFinite(size) || size < 0) {
    throw new Error(`Invalid TAR entry size for "${name}".`);
  }

  const dataStart = offset + 512;
  const dataEnd = dataStart + size;
  if (dataEnd > archive.length) {
    throw new Error(`Truncated TAR entry: "${name}".`);
  }

  if (wanted.has(name)) {
    const target = resolve(name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, archive.subarray(dataStart, dataEnd));
    written.add(name);
    console.log(`Prepared ${name} (${size.toLocaleString()} bytes)`);
  }

  offset = dataStart + Math.ceil(size / 512) * 512;
}

const missing = [...wanted].filter((name) => !written.has(name));
if (missing.length) {
  throw new Error(`Source archive is incomplete. Missing: ${missing.join(', ')}`);
}

console.log('Gorbus Engine 0.5 source restored and verified. Starting Vite build.');
