import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LuauState } from 'luau-web';

const main = readFileSync('src/main.js', 'utf8');
const camera = readFileSync('src/ge101.js', 'utf8');
const css = readFileSync('src/ge101.css', 'utf8');
const sample = readFileSync('examples/first-person-camera.luau', 'utf8');

for (const api of [
  'getObjectPosition:', 'lockMouse:', 'getMouseDelta:',
  'setCameraPosition:', 'setCameraRotation:'
]) {
  assert.ok(main.includes(api), 'Missing Gorbus Luau API: ' + api);
}
assert.ok(main.includes("['Camera','Cámara del juego"));
assert.ok(main.includes('GorbusMathLibraryProbe'));
assert.ok(main.includes('window.GorbusGE101?.beginPlay?.()'));
assert.ok(main.includes('window.GorbusGE101?.endPlay?.()'));
assert.ok(camera.includes("state.cameraMode = 'game'"));
assert.ok(camera.includes('function consumeMouseDelta()'));
assert.ok(camera.includes('function beginPlay()'));
assert.ok(camera.includes('function endPlay()'));
assert.ok(css.includes('.ge101-pointer-lock-prompt'));
for (const api of ['Gorbus.lockMouse(true)', 'Gorbus.getMouseDelta()', 'Gorbus.setCameraPosition(', 'Gorbus.setCameraRotation(', 'Gorbus.getObjectPosition(']) assert.ok(sample.includes(api), 'First-person example missing ' + api);

const state = await LuauState.createAsync({});
const mathProbe = state.loadstring(
  'assert(type(math.sin) == "function"); assert(type(math.cos) == "function"); assert(type(math.rad) == "function"); assert(math.abs(math.rad(180) - math.pi) < 0.00001); assert(math.abs(math.sin(math.rad(90)) - 1) < 0.00001); assert(math.abs(math.cos(0) - 1) < 0.00001)',
  'GE_1_0_3_MathSmokeTest',
  true
);
assert.equal(typeof mathProbe, 'function', 'Luau math smoke test did not compile');
await mathProbe();

console.log('GE 1.0.3 verification passed: camera API, game camera lifecycle, pointer lock UI, and Luau math.sin/cos/rad.');
