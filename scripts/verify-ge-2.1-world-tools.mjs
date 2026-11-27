import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const main = readFileSync('src/main.js', 'utf8');
const studio = readFileSync('src/gorbus-v2-studio.js', 'utf8');
const prepare = readFileSync('prepare.mjs', 'utf8');

const checks = [
  ['multi-selection state is initialized', main.includes('let selectedObjects = new Set()')],
  ['Ctrl/Cmd and Shift hierarchy selection', main.includes('event.ctrlKey||event.metaKey') && main.includes('event.shiftKey') && main.includes('visibleObjects.slice')],
  ['viewport modifier selection', main.includes('(e.ctrlKey||e.metaKey)') && main.includes('setObjectSelection([...next]')],
  ['select-all and clear-selection public API', main.includes('selectAll:()=>setObjectSelection(editable,selected)') && main.includes('clearSelection:()=>selectObject(null)')],
  ['temporary Rapier world for batch placement', main.includes('async function autoSettleObjects') && main.includes('new RAPIER.World') && main.includes('world.step()')],
  ['batch placement uses selected objects and has a safe batch cap', main.includes('objects = [...selectedObjects]') && main.includes('targets.length>300')],
  ['existing colliders are used as static supports', main.includes("componentHas(obj,'Box Collider')") && main.includes("componentHas(obj,'Capsule Collider')")],
  ['2D plane constraints are respected during placement', main.includes('setEnabledTranslations?.(true,true,false)') && main.includes('is2d?0:pos.z')],
  ['batch placement returns transforms and marks project dirty', main.includes('obj.position.set(pos.x,pos.y,is2d?0:pos.z)') && main.includes('updateReadout();markDirty();refreshHierarchy();')],
  ['world design UI exposes select all, clear and physics place', studio.includes('geV21SelectAll') && studio.includes('geV21ClearSelection') && studio.includes('geV21Settle')],
  ['world tool status follows selection changes', studio.includes('engine.selectedObjects?.length') && studio.includes('gorbus-selection-changed')],
  ['preparation restores GE 2.1 patches after GE 2.0', prepare.includes("import('./scripts/ge-2.1-world-tools.mjs')") && prepare.includes('patchGE21Main') && prepare.includes('patchGE21Studio')]
];

for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  assert.ok(passed, `GE 2.1 verification failed: ${label}`);
}
console.log(`\nGE 2.1 world tools: ${checks.length}/${checks.length} structural checks passed.`);
