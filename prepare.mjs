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


// Account manager and syntax-checked game-building workflow.
const systemMarker = 'const GORBUS_AI_SYSTEM = `';
if (main.includes(systemMarker) && !main.includes('GORBUS BUILD WORKFLOW — actúa como un socio de ingeniería')) {
  const systemStart = main.indexOf(systemMarker);
  const systemEnd = main.indexOf('`;', systemStart + systemMarker.length);
  if (systemEnd < 0) throw new Error('Could not locate the end of GORBUS_AI_SYSTEM.');
  const buildPrompt = [
    'GORBUS BUILD WORKFLOW — actúa como un socio de ingeniería de videojuegos:',
    '- Entrega un prototipo jugable, no solo una explicación.',
    '- Comprende género, objetivo, controles, cámara y estado actual del proyecto antes de implementar.',
    '- Planifica brevemente; después implementa el juego completo. Devuelve pasos ordenados para probarlo.',
    '- Prioriza un main.luau completo y autocontenido que cree los objetos necesarios al iniciar y contenga el ciclo de juego.',
    '- No devuelvas fragmentos, pseudocódigo, marcadores TODO ni funciones inventadas.',
    '- Incluye controles, reglas, colisiones coherentes, feedback visual, victoria/derrota y reinicio cuando la API lo permita.',
    '- Usa dt para el movimiento temporal y evita crear objetos en cada fotograma.',
    '- Revisa nombres, callbacks, APIs disponibles, sintaxis Luau y el bucle de juego antes de entregar.',
    '- Los objetos creados con createObject son visuales; no inventes colliders ni Rigidbody. Usa colisiones manuales si corresponde.',
    '- Si falta una capacidad, explica la limitación y ofrece una alternativa honesta.',
    '- Un juego pequeño y funcional es mejor que uno enorme e incompleto.'
  ].join('\n');
  main = main.slice(0, systemEnd) + '\n\n' + buildPrompt + main.slice(systemEnd);
}

// Compile the generated main.luau before showing it. If Luau rejects it, ask the same fixed model for one repair.
if (!main.includes('gorbusPreflightNotice') && main.includes('const data=parseGorbusAIResponse(raw);')) {
  const preflightBlock = [
    'let data=parseGorbusAIResponse(raw);',
    'let gorbusPreflightNotice="";',
    'const proposedMain=Array.isArray(data.files)?data.files.find(file=>file.path==="main.luau"&&typeof file.content==="string"):null;',
    'if(proposedMain&&window.GorbusUpgradeAI&&typeof window.GorbusUpgradeAI.compileLuau==="function"){',
    '  const firstCheck=await window.GorbusUpgradeAI.compileLuau(proposedMain.content);',
    '  if(firstCheck.ok){gorbusPreflightNotice="Comprobación automática: el compilador Luau acepta main.luau.";}',
    '  else{',
    '    status.querySelector("p").textContent="He detectado un error de sintaxis Luau. Estoy intentando corregirlo…";',
    '    try{',
    '      const repairMessages=messages.concat([{role:"assistant",content:raw},{role:"user",content:"El compilador Luau real de luau-web ha rechazado main.luau. Error: "+firstCheck.message+". Corrige el código completo, conserva la jugabilidad solicitada, usa solo la API real de Gorbus y devuelve exclusivamente el JSON válido exigido por el sistema. No expliques el error fuera del JSON."}]);',
    '      const repairStream=await puter.ai.chat(repairMessages,{model:GORBUS_AI_MODEL,stream:true,temperature:0.1,max_tokens:10000});',
    '      let repairRaw="";',
    '      for await(const repairPart of repairStream){if(repairPart?.type==="error")throw new Error(repairPart.message||"Error al corregir Luau");if(repairPart?.type==="text"&&repairPart.text)repairRaw+=repairPart.text;}',
    '      const repairedData=parseGorbusAIResponse(repairRaw);',
    '      const repairedMain=Array.isArray(repairedData.files)?repairedData.files.find(file=>file.path==="main.luau"&&typeof file.content==="string"):null;',
    '      if(repairedMain){',
    '        const secondCheck=await window.GorbusUpgradeAI.compileLuau(repairedMain.content);',
    '        if(secondCheck.ok){data=repairedData;gorbusPreflightNotice="He corregido un error detectado en el primer borrador. El segundo borrador supera la compilación Luau.";}',
    '        else{gorbusPreflightNotice="La IA intentó corregir el script, pero el compilador todavía detecta un error: "+secondCheck.message+". Revisa el borrador y usa Comprobar Luau.";}',
    '      }else{gorbusPreflightNotice="No llegó una versión corregida de main.luau. El borrador sigue pendiente de revisión.";}',
    '    }catch(repairError){gorbusPreflightNotice="No se pudo completar la autocorrección Luau: "+(repairError?.message||String(repairError));}',
    '  }',
    '  data.message=(data.message||"He preparado una propuesta.")+"\\n\\n"+gorbusPreflightNotice;',
    '}'
  ].join('\n');
  main=main.replace('const data=parseGorbusAIResponse(raw);',preflightBlock);
}

// Attach the enhancement module after the restored editor sources have been prepared.
if (!html.includes('/src/gorbus-enhancements.js')) {
  const bodyEnd=html.lastIndexOf('</body>');
  if(bodyEnd<0) throw new Error('Could not find </body> while attaching Gorbus enhancements.');
  html=html.slice(0,bodyEnd)+'\n<script type="module" src="/src/gorbus-enhancements.js"></script>\n'+html.slice(bodyEnd);
}
writeFileSync(mainPath,main);
writeFileSync(htmlPath,html);

// Restore the compact GE 1.0.1 extension bundle before importing its patch module.
const gePatchParts = Array.from({ length: 4 }, (_, index) =>
  readFileSync(resolve('build-assets', `ge101-patch-${String(index + 1).padStart(2, '0')}.b64`), 'utf8').trim()
);
const gePatchBundle = JSON.parse(brotliDecompressSync(Buffer.from(gePatchParts.join(''), 'base64')).toString('utf8'));
for (const [relativePath, content] of Object.entries(gePatchBundle)) {
  if (!['ge101-prepare.mjs', 'src/ge101.js', 'src/ge101.css'].includes(relativePath)) {
    throw new Error('Unexpected file in GE patch bundle: ' + relativePath);
  }
  const target = resolve(relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}
await import('./ge101-prepare.mjs');
main = readFileSync(mainPath, 'utf8');
html = readFileSync(htmlPath, 'utf8');

// Final correctness fixes for GE 1.0.1 (applied after source restoration on every build).
function replaceBuildOnce(source, oldText, newText, description) {
  const first = source.indexOf(oldText);
  if (first < 0) throw new Error('GE 1.0.1 build patch could not find: ' + description);
  if (source.indexOf(oldText, first + oldText.length) >= 0) throw new Error('GE 1.0.1 build patch found duplicate anchor: ' + description);
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

// A Collider by itself must remain static. Only adding a Rigidbody makes it dynamic.
main = replaceBuildOnce(main,
  "if(['Rigidbody','Box Collider','Sphere Collider'].includes(name))selected.userData.physics=selected.userData.physics||{type:'dynamic',friction:0.7,restitution:0.15};",
  "if(name==='Rigidbody'){const current=selected.userData.physics||{};selected.userData.physics={...current,type:'dynamic',friction:current.friction??0.7,restitution:current.restitution??0.15};}else if(['Box Collider','Sphere Collider'].includes(name)){const current=selected.userData.physics||{};selected.userData.physics={...current,type:current.type||'fixed',friction:current.friction??0.7,restitution:current.restitution??0.15};}",
  'Collider-only bodies stay fixed'
);

// Preserve UUIDs in scene files so Button + Door links survive save/reopen and Undo/Redo.
main = replaceBuildOnce(main,
  "return {name:labelOf(obj),kind:kindOf(obj),type:obj.userData.gorbusType||'OBJECT',position:obj.position.toArray()",
  "return {uuid:obj.uuid,name:labelOf(obj),kind:kindOf(obj),type:obj.userData.gorbusType||'OBJECT',position:obj.position.toArray()",
  'scene serialization UUID'
);
main = replaceBuildOnce(main,
  "obj.position.fromArray(item.position||[0,.6,0]);obj.rotation.set(",
  "if(typeof item.uuid==='string'&&item.uuid.length<=64&&!editable.some(existing=>existing.uuid===item.uuid))obj.uuid=item.uuid;obj.position.fromArray(item.position||[0,.6,0]);obj.rotation.set(",
  'scene restoration UUID'
);

// Use exact zero direction components in raycasts instead of treating zero as a missing value.
main = replaceBuildOnce(main,
  "const direction=new THREE.Vector3(Number(dx)||0,Number(dy)||0,Number(dz)||-1);\n      if(direction.lengthSq()<1e-8)return null;direction.normalize();\n      const hit=physicsWorld.castRay(new RAPIER.Ray(origin,direction),Math.max(.01,Number(maxDistance)||100),true);",
  "const rawDirection=[Number(dx),Number(dy),Number(dz)];const direction=new THREE.Vector3(...rawDirection.map((value,index)=>Number.isFinite(value)?value:(index===2?-1:0)));\n      if(direction.lengthSq()<1e-8)return null;direction.normalize();\n      const requestedDistance=Number(maxDistance);const hit=physicsWorld.castRay(new RAPIER.Ray(origin,direction),Number.isFinite(requestedDistance)&&requestedDistance>0?requestedDistance:100,true);",
  'raycast zero-vector handling'
);

// Expose the active-pair map so a collected sensor can release its overlap state immediately.
main = replaceBuildOnce(main,
  "get physicsColliderObjects(){return physicsColliderObjects;},get RAPIER(){return RAPIER;}",
  "get physicsColliderObjects(){return physicsColliderObjects;},get activePhysicsPairs(){return activePhysicsPairs;},get RAPIER(){return RAPIER;}",
  'active physics pairs bridge'
);
writeFileSync(mainPath, main);

// A Falling Platform should fall when a dynamic object steps on it, not when it merely touches static scenery.
const gePath = resolve('src/ge101.js');
let geSource = readFileSync(gePath, 'utf8');
geSource = replaceBuildOnce(geSource,
  "    if (started) {\n      for (const candidate of [a, b]) {\n        if (candidate?.userData.prefabType === 'falling-platform') {\n          const body = engine.physicsBodies.get(candidate.uuid);\n          if (body && engine.RAPIER?.RigidBodyType?.Dynamic !== undefined) {\n            body.setBodyType(engine.RAPIER.RigidBodyType.Dynamic, true);\n            candidate.userData.physics = { ...(candidate.userData.physics || {}), type: 'dynamic' };\n          }\n        }\n      }\n    }",
  "    if (started) {\n      for (const candidate of [a, b]) {\n        if (candidate?.userData.prefabType === 'falling-platform') {\n          const other = candidate === a ? b : a;\n          const otherBody = engine.physicsBodies.get(other?.uuid);\n          const otherIsDynamic = Boolean(otherBody && (typeof otherBody.isDynamic === 'function' ? otherBody.isDynamic() : other.userData.physics?.type === 'dynamic'));\n          const body = engine.physicsBodies.get(candidate.uuid);\n          if (otherIsDynamic && body && engine.RAPIER?.RigidBodyType?.Dynamic !== undefined) {\n            body.setBodyType(engine.RAPIER.RigidBodyType.Dynamic, true);\n            body.wakeUp?.();\n            candidate.userData.physics = { ...(candidate.userData.physics || {}), type: 'dynamic' };\n          }\n        }\n      }\n    }",
  'Falling Platform activation filter'
);

// Remove a collected coin from the active overlap set as well as the collider maps.
geSource = replaceBuildOnce(geSource,
  "for (const [handle, owner] of engine.physicsColliderObjects || []) { if (owner === trigger) engine.physicsColliderObjects.delete(handle); }\n        engine.physicsBodies.delete(trigger.uuid);",
  "for (const [handle, owner] of engine.physicsColliderObjects || []) { if (owner === trigger) engine.physicsColliderObjects.delete(handle); }\n        for (const [key, pair] of engine.activePhysicsPairs || []) { if (pair.a === trigger || pair.b === trigger) engine.activePhysicsPairs.delete(key); }\n        engine.physicsBodies.delete(trigger.uuid);",
  'collected coin pair cleanup'
);
writeFileSync(gePath, geSource);

console.log('Gorbus Engine GE 1.0.1 sources restored; physics, cameras, prefabs, history and persistence fixes applied.');

// GE 1.0.2: apply Gorbus AI live script streaming and attachment context after source restoration.
const { enhanceGorbusAISource } = await import('./scripts/ge-1.0.2-ai.mjs');
main = enhanceGorbusAISource(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
console.log('Gorbus Engine GE 1.0.2: Gorbus AI live script editing and text/code attachments enabled.');

// GE 1.0.3: game-camera ownership, mouse capture/deltas and native Luau math checks.
const { patchGorbusMain, patchGorbusGE101, patchGorbusGE101CSS } = await import('./scripts/ge-1.0.3-camera-runtime.mjs');
main = patchGorbusMain(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
const ge103SourcePath = resolve('src/ge101.js');
const ge103Source = patchGorbusGE101(readFileSync(ge103SourcePath, 'utf8'));
writeFileSync(ge103SourcePath, ge103Source);
const ge103CssPath = resolve('src/ge101.css');
const ge103Css = patchGorbusGE101CSS(readFileSync(ge103CssPath, 'utf8'));
writeFileSync(ge103CssPath, ge103Css);
let ge103Html = readFileSync('index.html', 'utf8');
ge103Html = ge103Html.replaceAll('Gorbus Engine 1.0.1', 'Gorbus Engine 1.0.3').replaceAll('GE 1.0.1', 'GE 1.0.3');
writeFileSync('index.html', ge103Html);
console.log('Gorbus Engine GE 1.0.3: Luau game camera, mouse capture/deltas and camera component enabled.');

// GE 1.0.4: restore compressed gameplay/editor modules and apply the patch after earlier GE layers.
const ge104PatchRaw = brotliDecompressSync(Buffer.from(readFileSync(resolve('build-assets', 'ge104-source-patch.br64'), 'utf8').trim(), 'base64'));
const ge104PatchFiles = JSON.parse(ge104PatchRaw.toString('utf8'));
for (const [relativePath, fileContent] of Object.entries(ge104PatchFiles)) {
  if (!['scripts/ge-1.0.4-engine.mjs', 'scripts/verify-ge-1.0.4.mjs', 'examples/first-person-camera.luau'].includes(relativePath) || typeof fileContent !== 'string') {
    throw new Error('Unexpected GE 1.0.4 patch entry: ' + relativePath);
  }
  const target = resolve(relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fileContent);
}
const { patchGE104Main, patchGE104Editor, patchGE104CSS } = await import('./scripts/ge-1.0.4-engine.mjs');
main = patchGE104Main(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
const ge104EditorPath = resolve('src/ge101.js');
writeFileSync(ge104EditorPath, patchGE104Editor(readFileSync(ge104EditorPath, 'utf8')));
const ge104CssPath = resolve('src/ge101.css');
writeFileSync(ge104CssPath, patchGE104CSS(readFileSync(ge104CssPath, 'utf8')));
const ge104HtmlPath = resolve('index.html');
writeFileSync(ge104HtmlPath, readFileSync(ge104HtmlPath, 'utf8').replaceAll('Gorbus Engine 1.0.3', 'Gorbus Engine 1.0.4').replaceAll('GE 1.0.3', 'GE 1.0.4'));
console.log('Gorbus Engine GE 1.0.4: camera-relative WASD, native capsule colliders, sensors, character controller, AI scene context, snapping and interactive console diagnostics enabled.');


// GE 2.0.0 Patched: restore the source overlay in a deterministic, allow-listed way.
const ge200OverlayFiles = [
  'ge200-overlay-01.br64',
  'ge200-overlay-02.br64',
  'ge200-overlay-03.br64',
  'ge200-overlay-04.br64',
  'ge200-overlay-05a.br64',
  'ge200-overlay-05b.br64',
  'ge200-overlay-05c.br64',
  'ge200-overlay-06a.br64',
  'ge200-overlay-06b.br64',
  'ge200-overlay-06c.br64'
].map((file) => readFileSync(resolve('build-assets', file), 'utf8').trim());
const ge200OverlayCompressed = Buffer.from(ge200OverlayFiles.join(''), 'base64');
const ge200OverlayDigest = createHash('sha256').update(ge200OverlayCompressed).digest('hex');
if (ge200OverlayDigest !== '2b3c1243c828de1bd1d2a3d61a2da9fc5433cae02a4cc8a861412e3be18c06ce') {
  throw new Error('Gorbus Engine GE 2.0.0 overlay failed SHA-256 integrity verification.');
}
const ge200Overlay = JSON.parse(
  brotliDecompressSync(ge200OverlayCompressed).toString('utf8')
);
const ge200AllowedFiles = new Set([
  'scripts/ge-2.0.0-engine.mjs',
  'scripts/verify-ge-2.0.0.mjs',
  'src/gorbus-v2-studio.js',
  'build-assets/gorbus-enhancements.base.js',
  'build-assets/gorbus-enhancements.base.css',
  'RELEASE_NOTES_2.0.0_PATCHED.md',
  'docs/GE_2.1_ROADMAP.md'
]);
for (const [relativePath, fileContent] of Object.entries(ge200Overlay)) {
  if (!ge200AllowedFiles.has(relativePath) || typeof fileContent !== 'string') {
    throw new Error('Unexpected GE 2.0.0 overlay entry: ' + relativePath);
  }
  const target = resolve(relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fileContent);
}

// Apply GE 2.0.0 after the existing 1.0.1–1.0.4 layers have been restored.
const { patchGE200Main, patchGE200HTML, patchGE200CSS, patchGE200Enhancements } =
  await import('./scripts/ge-2.0.0-engine.mjs');
main = patchGE200Main(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
const ge200HtmlPath = resolve('index.html');
writeFileSync(ge200HtmlPath, patchGE200HTML(readFileSync(ge200HtmlPath, 'utf8')));

// Restore pristine entrypoints on each run before applying the patch, so repeated
// dev/build/check executions do not duplicate listeners or styles.
const ge200CssPath = resolve('src/gorbus-enhancements.css');
const ge200AccountPath = resolve('src/gorbus-enhancements.js');
writeFileSync(ge200CssPath, readFileSync(resolve('build-assets', 'gorbus-enhancements.base.css'), 'utf8'));
writeFileSync(ge200AccountPath, readFileSync(resolve('build-assets', 'gorbus-enhancements.base.js'), 'utf8'));
writeFileSync(ge200CssPath, patchGE200CSS(readFileSync(ge200CssPath, 'utf8')));
writeFileSync(ge200AccountPath, patchGE200Enhancements(readFileSync(ge200AccountPath, 'utf8')));

// GE 2.1 Preview: multi-selection and Rapier batch placement.
const { patchGE21Main, patchGE21Studio } = await import('./scripts/ge-2.1-world-tools.mjs');
writeFileSync(mainPath, patchGE21Main(readFileSync(mainPath, 'utf8')));
const ge21StudioPath = resolve('src/gorbus-v2-studio.js');
writeFileSync(ge21StudioPath, patchGE21Studio(readFileSync(ge21StudioPath, 'utf8')));
const { patchGE21MouseInput } = await import('./scripts/ge-2.1-mouse-input.mjs');
writeFileSync(mainPath, patchGE21MouseInput(readFileSync(mainPath, 'utf8')));
const { patchGE21RuntimeHUD } = await import('./scripts/ge-2.1-runtime-hud.mjs');
writeFileSync(mainPath, patchGE21RuntimeHUD(readFileSync(mainPath, 'utf8')));
console.log('Gorbus Engine GE 2.1 Preview: multi-selection, physics placement, mouse input and native runtime HUD enabled.');
 
// Gorbus Engine 2.1.0: deterministic release overlay (allow-listed + SHA-256 verified).
const ge210Parts = Array.from({ length: 12 }, (_, index) =>
  readFileSync(resolve('build-assets', `ge210-release-${String(index + 1).padStart(2, '0')}.br64`), 'utf8').trim()
);
const ge210ExpectedDigest = '515dafaa3f94d798da4365f041398ee652d9e7a215b12603dd3770b9e0e18387';
let ge210Compressed = Buffer.from(ge210Parts.join(''), 'base64');
let ge210Digest = createHash('sha256').update(ge210Compressed).digest('hex');

// A text overlay chunk can pick up one extra character when copied between
// systems. Only attempt a one-character correction in chunks whose lengths
// are not base64-aligned, and accept a candidate solely when SHA-256 matches.
if (ge210Digest !== ge210ExpectedDigest) {
  const misaligned = ge210Parts.map((part, index) => ({ part, index })).filter(item => item.part.length % 4 !== 0);
  let repaired = null;
  for (const { part, index } of misaligned) {
    for (let offset = 0; offset < part.length; offset++) {
      const candidateParts = [...ge210Parts];
      candidateParts[index] = part.slice(0, offset) + part.slice(offset + 1);
      const candidateBytes = Buffer.from(candidateParts.join(''), 'base64');
      if (createHash('sha256').update(candidateBytes).digest('hex') === ge210ExpectedDigest) {
        if (repaired) throw new Error('Multiple release archive repairs matched the SHA-256 digest.');
        repaired = candidateBytes;
      }
    }
  }
  if (!repaired) throw new Error('Gorbus Engine 2.1.0 release archive failed SHA-256 integrity verification.');
  ge210Compressed = repaired;
  ge210Digest = ge210ExpectedDigest;
}
const ge210Files = JSON.parse(brotliDecompressSync(ge210Compressed).toString('utf8'));
const ge210AllowedFiles = new Set([
  'scripts/ge-2.1.0-release.mjs',
  'scripts/verify-ge-2.1.0.mjs',
  'docs/GE_2.1.0_RELEASE.md'
]);
for (const [relativePath, fileContent] of Object.entries(ge210Files)) {
  if (!ge210AllowedFiles.has(relativePath) || typeof fileContent !== 'string') {
    throw new Error('Unexpected Gorbus Engine 2.1.0 release overlay entry: ' + relativePath);
  }
  const target = resolve(relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fileContent);
}
const { patchGE210Main, patchGE210HTML, patchGE210CSS } = await import('./scripts/ge-2.1.0-release.mjs');
main = patchGE210Main(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
html = patchGE210HTML(readFileSync(htmlPath, 'utf8'));
writeFileSync(htmlPath, html);
const ge210CssPath = resolve('styles.css');
writeFileSync(ge210CssPath, patchGE210CSS(readFileSync(ge210CssPath, 'utf8')));
console.log('Gorbus Engine 2.1.0 Release Preview: script tabs, HTML migration, FPS capsule, project library, procedural assets, ECS-lite, Crowd Bake, keyframes and UI scaffolds enabled.');

// Gorbus Engine 3.0.0: runtime profiler, transform inspection and project diagnostics.
const { patchGE300Main } = await import('./scripts/ge-3.0.0-profiler.mjs');
main = patchGE300Main(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
console.log('Gorbus Engine 3.0.0: runtime profiler, scene metrics and runtime transform APIs enabled.');

// GE 3.0.0: responsive screen-space UI API for Luau game scripts.
const { patchGE300UIRuntime } = await import('./scripts/ge-3.0.0-ui-runtime.mjs');
main = patchGE300UIRuntime(readFileSync(mainPath, 'utf8'));
writeFileSync(mainPath, main);
console.log('Gorbus Engine 3.0.0: responsive 2D runtime UI API enabled.');

