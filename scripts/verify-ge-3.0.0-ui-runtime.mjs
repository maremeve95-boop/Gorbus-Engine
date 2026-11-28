import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { patchGE300UIRuntime } from './ge-3.0.0-ui-runtime.mjs';
const source=readFileSync(new URL('./ge-3.0.0-ui-runtime.mjs',import.meta.url),'utf8');
const checks=[
 ['exports UI patch',source.includes('export function patchGE300UIRuntime')],
 ['mounts in viewport',source.includes("document.getElementById('viewport')")],
 ['creates panels/text/buttons',['uiCreatePanel:','uiCreateText:','uiCreateButton:'].every(x=>source.includes(x))],
 ['handles click events',source.includes('uiWasClicked:')&&source.includes('wasGorbusUIClicked')],
 ['supports layout/style/visibility/cleanup',['uiSetRect:','uiSetStyle:','uiSetVisible:','uiClear:'].every(x=>source.includes(x))],
 ['uses textContent and not HTML injection',source.includes('el.textContent')&&!source.includes('innerHTML')],
 ['allow-lists style names',source.includes('Object.prototype.hasOwnProperty.call(allowed')],
 ['rejects CSS URL/script expressions',source.includes('/url/i')&&source.includes('/expression/i')&&source.includes('/javascript:/i')],
 ['responsive small-screen styles',source.includes('@media(max-width:620px)')],
 ['documents no world-space UI',source.includes('todavía no crea UI interactiva en el espacio 3D')]
];
const fixture='function createLuauBridge(scriptObjectName=null){\\n    clearGameHUD:()=>clearGorbusRuntimeHUD(),\\n}\\n- Gorbus.clearGameHUD(): retira el HUD al terminar el juego.';
const once=patchGE300UIRuntime(fixture);
checks.push(['inserts runtime API',once.includes('ensureGorbusRuntimeUIRoot')&&once.includes('uiCreatePanel:')]);
checks.push(['documents public API',once.includes('Gorbus.uiCreatePanel')]);
checks.push(['patch is idempotent',patchGE300UIRuntime(once)===once]);
for(const [name,ok] of checks){console.log((ok?'PASS ':'FAIL ')+name);assert.ok(ok,name);}
console.log('GE 3.0 UI runtime: '+checks.length+'/'+checks.length+' checks passed.');
