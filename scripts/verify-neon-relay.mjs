import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scene = JSON.parse(readFileSync('samples/NEON_RELAY/NEON_RELAY.gorbus', 'utf8'));
const script = readFileSync('samples/NEON_RELAY/main.luau', 'utf8');
assert.equal(scene.format, 'GorbusScene', 'Scene must use GorbusScene format');
assert.equal(scene.version, 8, 'Scene format version must be 8');
assert.equal(scene.mode, '3d', 'NEON RELAY must be a 3D scene');
assert.equal(scene.files['main.luau'], scene.luauScript, 'Embedded and external Luau scripts must match');
assert.equal(scene.luauScript, script, 'Scene script and main.luau must stay in sync');
const byName = new Map(scene.objects.map(object => [object.name, object]));
assert.equal(byName.size, scene.objects.length, 'Scene object names must be unique');
const player = byName.get('Relay_Player');
assert.ok(player, 'FPS player must exist');
assert.equal(player.type, 'CAPSULE', 'FPS player must use a capsule');
assert.ok(player.components.includes('Rigidbody'), 'FPS player needs a Rigidbody');
assert.ok(player.components.includes('Capsule Collider'), 'FPS player needs a Capsule Collider');
for (let i = 1; i <= 9; i++) assert.ok(byName.has(`Relay_Core_${String(i).padStart(2, '0')}`), `Missing energy core ${i}`);
for (const api of ['Gorbus.controlCharacter', 'Gorbus.getMouseDelta', 'Gorbus.setCameraRotation', 'Gorbus.setGameHUD', 'Gorbus.setObjectVisible', 'Gorbus.getObjectPosition', 'Gorbus.isKeyJustPressed']) {
  assert.ok(script.includes(api), `Sample must exercise ${api}`);
}
for (const callback of ['function onStart()', 'function onUpdate(dt: number)', 'function onStop()']) {
  assert.ok(script.includes(callback), `Missing lifecycle callback: ${callback}`);
}
assert.ok(scene.objects.length >= 20, 'Arena should contain a meaningful set of test objects');
console.log(`NEON RELAY: PASS — ${scene.objects.length} objects, 9 cores, capsule FPS, lifecycle and runtime APIs verified.`);
