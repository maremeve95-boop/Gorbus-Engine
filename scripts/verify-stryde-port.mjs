import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const scene = JSON.parse(readFileSync('ports/stryde-v14/STRYDE_Training_Range.gorbus', 'utf8'));
const source = readFileSync('ports/stryde-v14/main.luau', 'utf8');
const readme = readFileSync('ports/stryde-v14/README.md', 'utf8');
const names = new Set(scene.objects.map(object => object.name));
const beacons = scene.objects.filter(object => object.name.startsWith('Stryde_Beacon_'));
const player = scene.objects.find(object => object.name === 'Stryde_Player');
const checks = [
  ['scene is a Gorbus v8 3D project', scene.format === 'GorbusScene' && scene.version === 8 && scene.mode === '3d'],
  ['project bundles the same main.luau source', scene.files?.['main.luau'] === source && scene.luauScript === source],
  ['main Luau lifecycle is implemented', ['function onStart()', 'function onUpdate(dt: number)', 'function onStop()'].every(token => source.includes(token))],
  ['native first-person controls are used', source.includes('Gorbus.controlCharacter(speed, 6.8, PLAYER)') && source.includes('Gorbus.getMouseDelta()')],
  ['native mouse buttons power scanning and focus', source.includes('Gorbus.isMouseButtonDown(0)') && source.includes('Gorbus.isMouseButtonDown(2)')],
  ['native game HUD reports timer, score, precision, scan mode and rank', source.includes('Gorbus.setGameHUD(') && source.includes('Gorbus.clearGameHUD()') && source.includes('Gorbus.showGameMessage(')],
  ['first-person player mesh is hidden only for gameplay and restored on stop', source.includes('Gorbus.setObjectVisible(PLAYER, false)') && source.includes('Gorbus.setObjectVisible(PLAYER, true)') && player?.visible === true],
  ['raycast-based scanning challenge is implemented', source.includes('Gorbus.raycast(') && source.includes('function sendScanPulse()')],
  ['60-second training round and restart are implemented', source.includes('local ROUND_SECONDS = 60') && source.includes('Gorbus.isKeyJustPressed("t")')],
  ['four non-destructive scan modes exist', ['ORBITAL', 'LUMEN', 'ECHO', 'PRISM'].every(name => source.includes(name)) && source.includes('score += scanMode.points')],
  ['six beacon objects are present', beacons.length === 6 && [1,2,3,4,5,6].every(index => names.has('Stryde_Beacon_0' + index))],
  ['three beacons move during the round', (source.match(/moving = true/g) || []).length === 3],
  ['player has a dynamic capsule body', !!player && player.type === 'CAPSULE' && player.components.includes('Rigidbody') && player.components.includes('Capsule Collider') && player.physics?.type === 'dynamic'],
  ['arena floor and beacons have fixed colliders', names.has('Stryde_Floor') && beacons.every(beacon => beacon.components.includes('Box Collider') && beacon.physics?.type === 'fixed')],
  ['scans activate and respawn beacons without health or damage simulation', source.includes('BALIZA ACTIVADA') && source.includes('beacon.respawn = 1.7') && !source.includes('.health') && !source.includes('damage')],
  ['README documents scan controls and remaining scope', readme.includes('Clic izquierdo:** escanear') && readme.includes('Qué todavía no está portado')]
];
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  assert.ok(passed, `STRYDE port verification failed: ${label}`);
}
console.log(`\nSTRYDE port: ${checks.length}/${checks.length} structural checks passed.`);
