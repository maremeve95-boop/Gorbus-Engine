import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const scene = JSON.parse(readFileSync('ports/stryde-v14/STRYDE_Training_Range.gorbus', 'utf8'));
const source = readFileSync('ports/stryde-v14/main.luau', 'utf8');
const names = new Set(scene.objects.map(object => object.name));
const targets = scene.objects.filter(object => object.name.startsWith('Stryde_Target_'));
const player = scene.objects.find(object => object.name === 'Stryde_Player');
const checks = [
  ['scene is a Gorbus v8 3D project', scene.format === 'GorbusScene' && scene.version === 8 && scene.mode === '3d'],
  ['project bundles the same main.luau source', scene.files?.['main.luau'] === source && scene.luauScript === source],
  ['main Luau lifecycle is implemented', ['function onStart()', 'function onUpdate(dt: number)', 'function onStop()'].every(token => source.includes(token))],
  ['native first-person controls are used', source.includes('Gorbus.controlCharacter(speed, 6.8, PLAYER)') && source.includes('Gorbus.getMouseDelta()')],
  ['native mouse buttons power firing and aiming', source.includes('Gorbus.isMouseButtonDown(0)') && source.includes('Gorbus.isMouseButtonDown(2)')],
  ['first-person player mesh is hidden only for gameplay and restored on stop', source.includes('Gorbus.setObjectVisible(PLAYER, false)') && source.includes('Gorbus.setObjectVisible(PLAYER, true)') && player?.visible === true],
  ['raycast-based target practice is implemented', source.includes('Gorbus.raycast(') && source.includes('function fireShot()')],
  ['60-second training round and restart are implemented', source.includes('local ROUND_SECONDS = 60') && source.includes('Gorbus.isKeyJustPressed("t")')],
  ['four weapon profiles exist', ['S-9 PULSE', 'K-2 AURA', 'BREAKER-8', 'LANCE-X'].every(name => source.includes(name))],
  ['six target objects are present', targets.length === 6 && [1,2,3,4,5,6].every(index => names.has('Stryde_Target_0' + index))],
  ['three targets are animated in the script', (source.match(/moving = true/g) || []).length === 3],
  ['player has a dynamic capsule body', !!player && player.type === 'CAPSULE' && player.components.includes('Rigidbody') && player.components.includes('Capsule Collider') && player.physics?.type === 'dynamic'],
  ['arena floor and targets have fixed colliders', names.has('Stryde_Floor') && targets.every(target => target.components.includes('Box Collider') && target.physics?.type === 'fixed')],
  ['README documents current scope and import steps', readFileSync('ports/stryde-v14/README.md', 'utf8').includes('Abrir en Gorbus Engine') && readFileSync('ports/stryde-v14/README.md', 'utf8').includes('Qué todavía no está portado')]
];
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  assert.ok(passed, `STRYDE port verification failed: ${label}`);
}
console.log(`\nSTRYDE port: ${checks.length}/${checks.length} structural checks passed.`);
