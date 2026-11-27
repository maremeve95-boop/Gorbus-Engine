import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const main = readFileSync('src/main.js', 'utf8');
const checks = [
  ['mouse button state is initialized', main.includes('const mouseButtonsDown = new Set()') && main.includes('const mouseButtonsJustPressed = new Set()')],
  ['mouse buttons are tracked on down and up', main.includes("window.addEventListener('mousedown'") && main.includes("window.addEventListener('mouseup'")],
  ['mouse input state clears on blur', main.includes('mouseButtonsDown.clear();mouseButtonsJustPressed.clear()')],
  ['Luau exposes down and just-pressed mouse APIs', main.includes('isMouseButtonDown:(button=0)') && main.includes('isMouseButtonJustPressed:(button=0)')],
  ['mouse just-pressed state clears after each Luau tick', main.includes('keysJustPressed.clear();\n            mouseButtonsJustPressed.clear();')],
  ['mouse button API is documented for Gorbus AI', main.includes('Gorbus.isMouseButtonDown(button=0)') && main.includes('Gorbus.isMouseButtonJustPressed(button=0)')]
];
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  assert.ok(passed, `GE 2.1 mouse input verification failed: ${label}`);
}
console.log(`\nGE 2.1 mouse input: ${checks.length}/${checks.length} structural checks passed.`);
