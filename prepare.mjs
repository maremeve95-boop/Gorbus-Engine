import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const partPaths = Array.from({ length: 10 }, (_, index) =>
  resolve('build-assets', `v06-source-${String(index + 1).padStart(2, '0')}.br64`)
);
const base64 = partPaths.map((path) => readFileSync(path, 'utf8').trim()).join('');
const compressed = Buffer.from(base64, 'base64');
const digest = createHash('sha256').update(compressed).digest('hex');

if (digest !== 'aca141e223549efce6cbfe96ef411527be95d965c547dbf65bffc1a81e0cd502') {
  throw new Error('Gorbus Engine 0.6 source archive failed SHA-256 integrity verification.');
}

const archive = brotliDecompressSync(compressed);
if (archive.length !== 184320) {
  throw new Error(`Unexpected source archive size: ${archive.length} bytes.`);
}

const wanted = new Set(['index.html', 'styles.css', 'src/main.js']);
const written = new Set();
function tarString(buffer) {
  const end = buffer.indexOf(0);
  return buffer.subarray(0, end === -1 ? buffer.length : end).toString('utf8');
}

let offset = 0;
while (offset + 512 <= archive.length) {
  const header = archive.subarray(offset, offset + 512);
  const name = tarString(header.subarray(0, 100));
  if (!name) break;
  const sizeText = tarString(header.subarray(124, 136)).trim();
  const size = Number.parseInt(sizeText || '0', 8);
  if (!Number.isFinite(size) || size < 0) throw new Error(`Invalid TAR entry size for "${name}".`);
  const dataStart = offset + 512;
  const dataEnd = dataStart + size;
  if (dataEnd > archive.length) throw new Error(`Truncated TAR entry: "${name}".`);
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
if (missing.length) throw new Error(`Source archive is incomplete: ${missing.join(', ')}`);

// Small UX corrections that are intentionally kept in source control as build-time patches.
const mainPath = resolve('src/main.js');
let main = readFileSync(mainPath, 'utf8');
if (!main.includes('topMenus.view=')) {
  const anchor = "};\ndocument.querySelectorAll('.main-menu button')";
  const menus = `};
topMenus.view=[{label:'Mostrar cuadrícula',action:()=>$('gridToggle').click()},{label:'Mostrar estadísticas',action:()=>$('statsToggle').click()},{label:'Maximizar panel inferior',action:()=>$('maximizeView').click()},{label:'Restablecer perspectiva',action:()=>$('viewBtn').click()}];
topMenus.window=[{label:'Proyecto',action:()=>document.querySelector('.bottom-tab[data-bottom="project"]').click()},{label:'Consola',action:()=>document.querySelector('.bottom-tab[data-bottom="console"]').click()},{label:'Luau Scripts',action:()=>document.querySelector('.bottom-tab[data-bottom="scripts"]').click()},{label:'Gorbus AI',action:openGorbusAI}];
document.querySelectorAll('.main-menu button')`;
  if (!main.includes(anchor)) throw new Error('Could not locate main menu insertion point for Ver/Ventana.');
  main = main.replace(anchor, menus);
}
main = main
  .replace("return {format:'GorbusScene',version:5,project:projectTitle,createdWith:'Gorbus Engine 0.5'", "return {format:'GorbusScene',version:6,project:projectTitle,createdWith:'Gorbus Engine 0.6'")
  .replace("sceneData.createdWith='Gorbus Engine 0.5';sceneData.version=4;", "sceneData.createdWith='Gorbus Engine 0.6';sceneData.version=6;")
  .replace("Gorbus Engine 0.5 listo.", "Gorbus Engine 0.6 listo.");
writeFileSync(mainPath, main);

// Fix the Puter routing for DeepSeek V4.1 Flash.
// Keep the model fixed, but do not pin a provider: Puter will choose a provider
// that actually serves the model. reasoning_effort is only documented for
// OpenAI models in Puter's generic chat options, so DeepSeek uses its defaults.
const oldModelPattern = /const GORBUS_AI_MODEL\s*=\s*['"]deepseek\/deepseek-v4\.1-flash-1017['"]\s*;/;
const newModelDeclaration = "const GORBUS_AI_MODEL = 'deepseek/deepseek-v4.1-flash';";
if (oldModelPattern.test(main)) {
  main = main.replace(oldModelPattern, newModelDeclaration);
} else if (!/const GORBUS_AI_MODEL\s*=\s*['"]deepseek\/deepseek-v4\.1-flash['"]\s*;/.test(main)) {
  throw new Error('Could not find Gorbus AI model declaration while applying the Puter routing fix.');
}
main = main
  .replace(/const GORBUS_AI_PROVIDER\s*=\s*['"]deepseek['"]\s*;\s*/g, '')
  .replace(/provider\s*:\s*GORBUS_AI_PROVIDER\s*,?/g, '')
  .replace(/fallback\s*:\s*false\s*,?/g, '')
  .replace(/reasoning_effort\s*:\s*['"]high['"]\s*,?/g, '');

if (main.includes('GORBUS_AI_PROVIDER') || main.includes('reasoning_effort')) {
  throw new Error('Old Puter provider or reasoning options remain after the routing fix.');
}
if (!main.includes(newModelDeclaration)) {
  throw new Error('The fixed DeepSeek V4.1 Flash model was not applied to Gorbus AI.');
}
writeFileSync(mainPath, main);

// Keep the fixed model label in the UI synchronized with the API request.
const htmlPath = resolve('index.html');
let html = readFileSync(htmlPath, 'utf8');
html = html
  .replaceAll('DeepSeek V4.1 Flash 1017', 'DeepSeek V4.1 Flash')
  .replaceAll('DEEPSEEK V4.1 FLASH 1017', 'DEEPSEEK V4.1 FLASH');
writeFileSync(htmlPath, html);

console.log('Gorbus Engine 0.6 source restored, UI patches applied, and Puter model routing fixed.');
