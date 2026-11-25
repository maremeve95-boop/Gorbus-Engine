import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const partPaths = Array.from({ length: 7 }, (_, index) =>
  resolve('build-assets', `source-${String(index + 1).padStart(2, '0')}.br64`)
);
const base64 = partPaths.map((path) => readFileSync(path, 'utf8').trim()).join('');
const compressed = Buffer.from(base64, 'base64');
const digest = createHash('sha256').update(compressed).digest('hex');

if (digest !== '230c1fb2519de44c6e339f8072bd6fa5d7956e1e53f5b15d8d1844cf854aabd4') {
  throw new Error('Gorbus source archive failed its SHA-256 integrity check. Check the build-assets parts.');
}

const archive = brotliDecompressSync(compressed);
if (archive.length !== 133120) {
  throw new Error(`Unexpected source archive size: ${archive.length} bytes.`);
}

const wanted = new Set(['index.html', 'styles.css', 'src/main.js']);
const written = new Set();
let offset = 0;

function readTarString(buffer) {
  const end = buffer.indexOf(0);
  return buffer.subarray(0, end === -1 ? buffer.length : end).toString('utf8');
}

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
console.log('Gorbus source restored and verified. Starting Vite build.');
