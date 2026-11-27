import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const main = readFileSync('src/main.js', 'utf8');
const prepare = readFileSync('prepare.mjs', 'utf8');
const checks = [
  ['runtime HUD helper is injected before the Luau bridge', main.includes('function ensureGorbusRuntimeHUD()') && main.includes('function createLuauBridge(scriptObjectName=null){')],
  ['HUD is mounted inside the game viewport', main.includes("document.getElementById('viewport')") && main.includes('viewport.appendChild(root)')],
  ['HUD remains non-interactive over the viewport', main.includes('pointer-events:none') && main.includes('gorbusRuntimeGameHUD.visible')],
  ['HUD displays timer, score, precision, scan mode, activated beacons and rank', ["data-stryde='time'", "data-stryde='score'", "data-stryde='accuracy'", "data-stryde='mode'", "data-stryde='nodes'", "data-stryde='rank'"].every(token => main.includes(token))],
  ['dynamic HUD values use textContent', main.includes("querySelector('[data-stryde=\"time\"]').textContent") && main.includes("querySelector('[data-stryde=\"mode\"]').textContent") && main.includes("querySelector('[data-stryde=\"nodes\"]').textContent")],
  ['scan feedback uses a bounded toast timer', main.includes('showGorbusRuntimeHUDMessage') && main.includes('Math.min(4000, Number(duration) || 1050)')],
  ['Luau exposes set, toast and clear game HUD APIs', main.includes('setGameHUD:(seconds=60') && main.includes('showGameMessage:(message,duration=1050)') && main.includes('clearGameHUD:()=>clearGorbusRuntimeHUD()')],
  ['AI context documents the runtime HUD APIs', main.includes('Gorbus.setGameHUD(seconds,score,accuracy,modeName,activatedNodes,rank)') && main.includes('Gorbus.clearGameHUD()')],
  ['GE 2.1 preparation applies the HUD patch after mouse input', prepare.includes("import('./scripts/ge-2.1-mouse-input.mjs')") && prepare.includes("import('./scripts/ge-2.1-runtime-hud.mjs')") && prepare.indexOf('patchGE21MouseInput') < prepare.indexOf('patchGE21RuntimeHUD')],
  ['HUD includes a narrow viewport layout', main.includes('@media(max-width:620px)')],
  ['HUD labels describe a scan mode and activated beacons', main.includes('MODO DE ESCANEO') && main.includes('BALIZAS ACTIVADAS') && main.includes('CLIC ESCANEAR')]
];
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  assert.ok(passed, `GE 2.1 runtime HUD verification failed: ${label}`);
}
console.log(`\nGE 2.1 runtime HUD: ${checks.length}/${checks.length} structural checks passed.`);
