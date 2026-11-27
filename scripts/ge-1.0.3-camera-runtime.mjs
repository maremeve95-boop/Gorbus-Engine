function replaceOnce(source, before, after, description) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error('GE 1.0.3: anchor not found: ' + description);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error('GE 1.0.3: duplicate anchor: ' + description);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

export function patchGorbusMain(input) {
  let main = input;
  const cameraApi = [
    'getObjectPosition:(name)=>{const obj=findObject(name);if(!obj)return null;const body=physicsBodies.get(obj.uuid);const position=body?body.translation():obj.position;return {x:position.x,y:position.y,z:position.z};},',
    'lockMouse:(enabled)=>Boolean(window.GorbusGE101?.lockMouse?.(Boolean(enabled))),',
    'getMouseDelta:()=>window.GorbusGE101?.consumeMouseDelta?.()||{x:0,y:0},',
    'setCameraPosition:(x,y,z)=>Boolean(window.GorbusGE101?.setGameCameraPosition?.(Number(x),Number(y),Number(z))),',
    'setCameraRotation:(x,y,z)=>Boolean(window.GorbusGE101?.setGameCameraRotation?.(Number(x),Number(y),Number(z))),',
    'getTime:()=>performance.now()/1000'
  ].join('\n    ');
  main = replaceOnce(main, 'getTime:()=>performance.now()/1000', cameraApi, 'Luau camera and mouse API');

  main = replaceOnce(main,
    "const chunk=luauState.loadstring(source,'main.luau',true);",
    "const mathProbe=luauState.loadstring('assert(type(math.sin)==\\\"function\\\",\\\"math.sin no está disponible\\\");assert(type(math.cos)==\\\"function\\\",\\\"math.cos no está disponible\\\");assert(type(math.rad)==\\\"function\\\",\\\"math.rad no está disponible\\\");assert(math.abs(math.rad(180)-math.pi)<0.00001,\\\"math.rad no es correcto\\\")','GorbusMathLibraryProbe',true);if(typeof mathProbe!=='function')throw new Error('La biblioteca matemática estándar de Luau no está disponible.');await mathProbe();\n  const chunk=luauState.loadstring(source,'main.luau',true);",
    'Luau standard math library smoke test'
  );

  main = replaceOnce(main,
    "const choices=[['Rigidbody','Cuerpo físico real · se simula al pulsar Play'],['Box Collider','Colisión de caja · Rapier 3D'],['Sphere Collider','Colisión esférica · Rapier 3D']];",
    "const choices=[['Camera','Cámara del juego · se activa automáticamente durante Play'],['Rigidbody','Cuerpo físico real · se simula al pulsar Play'],['Box Collider','Colisión de caja · Rapier 3D'],['Sphere Collider','Colisión esférica · Rapier 3D']];",
    'Camera component in component picker'
  );
  main = replaceOnce(main,
    '<p class="modal-note">Los componentes Rigidbody y Collider ahora participan en la simulación de física 3D durante Play. Los objetos sin Rigidbody que tengan Collider serán estáticos.</p>',
    '<p class="modal-note">Camera activa la vista del objeto al iniciar Play. Rigidbody y Collider participan en Rapier; un Collider sin Rigidbody será estático.</p>',
    'Camera component help'
  );

  main = replaceOnce(main,
    'orbit.enabled=true;luauBusy=false;keysJustPressed.clear();',
    'orbit.enabled=true;window.GorbusGE101?.beginPlay?.();luauBusy=false;keysJustPressed.clear();',
    'activate game camera before onStart'
  );
  main = replaceOnce(main,
    'clearPhysicsWorld();luauUpdateRunner=null;luauStopRunner=null;luauState=null;',
    'clearPhysicsWorld();window.GorbusGE101?.endPlay?.();luauUpdateRunner=null;luauStopRunner=null;luauState=null;',
    'restore editor camera after Stop'
  );

  main = replaceOnce(main,
    '- Gorbus.setCameraMode(mode, duration) admite orbit, third-person, top-down y first-person; Gorbus.cameraTo(...) interpola una cámara.\n',
    '- Gorbus.setCameraMode(mode, duration) admite orbit, third-person, top-down, first-person y game; Gorbus.cameraTo(...) interpola una cámara.\n- Gorbus.lockMouse(boolean) solicita o libera Pointer Lock durante Play; algunos navegadores pueden pedir un clic adicional del usuario.\n- Gorbus.getMouseDelta() devuelve una tabla {x, y} con el movimiento del ratón en píxeles desde la última lectura.\n- Gorbus.setCameraPosition(x, y, z) coloca la cámara del juego; Gorbus.setCameraRotation(x, y, z) establece su Euler en radianes (orden YXZ: pitch, yaw, roll).\n- Gorbus.getObjectPosition(name) devuelve {x, y, z} de la posición actual del objeto, usando la posición del cuerpo Rapier si tiene Rigidbody.\n- Un objeto con el componente Camera se activa automáticamente como cámara de juego al pulsar Play.\n- Luau incluye math.sin, math.cos y math.rad; no uses Vector3 ni APIs de Roblox.\n',
    'Gorbus AI API documentation for game camera and math'
  );
  main = main.replaceAll('Gorbus Engine 1.0.1', 'Gorbus Engine 1.0.3').replaceAll('GE 1.0.1 — FLUJO DE TRABAJO DE JUEGOS', 'GE 1.0.3 — FLUJO DE TRABAJO DE JUEGOS');
  return main;
}

export function patchGorbusGE101(input) {
  let ge = input;
  ge = replaceOnce(ge,
    '    cameraPitch: -0.12,\n    userOrbiting: false,\n    pointerLocked: false,',
    '    cameraPitch: -0.12,\n    userOrbiting: false,\n    pointerLocked: false,\n    mouseDeltaX: 0,\n    mouseDeltaY: 0,\n    mouseLockRequested: false,\n    pointerLockPrompt: null,\n    prePlayCamera: null,\n    gameCameraObject: null,',
    'game camera input state'
  );

  ge = replaceOnce(ge,
    "    if (!['orbit', 'third-person', 'top-down', 'first-person'].includes(mode)) return false;\n    state.cameraMode = mode;",
    "    if (!['orbit', 'third-person', 'top-down', 'first-person', 'game'].includes(mode)) return false;\n    if (mode === 'game') {\n      state.cameraMode = 'game'; state.followTarget = null; state.transition = null; state.userOrbiting = false;\n      engine.orbit.enabled = false; engine.camera.up.set(0, 1, 0);\n      document.querySelectorAll('[data-ge101-camera]').forEach(button => button.classList.remove('active'));\n      return true;\n    }\n    state.cameraMode = mode;",
    'Game camera mode'
  );

  ge = replaceOnce(ge,
    "    if (state.cameraMode === 'orbit' || state.cameraMode === 'cinematic') return;",
    "    if (state.cameraMode === 'orbit' || state.cameraMode === 'cinematic' || state.cameraMode === 'game') return;",
    'Luau owns the camera while game mode is active'
  );

  const inputAndCameraFunctions = [
    '  function ensurePointerLockPrompt() {',
    '    if (state.pointerLockPrompt && state.pointerLockPrompt.isConnected) return state.pointerLockPrompt;',
    "    const overlay = document.createElement('div'); overlay.className = 'ge101-pointer-lock-prompt'; overlay.hidden = true;",
    "    const panel = document.createElement('div'); panel.className = 'ge101-pointer-lock-panel';",
    "    const title = document.createElement('strong'); title.textContent = 'Capturar el ratón';",
    "    const description = document.createElement('span'); description.textContent = 'Haz clic para permitir que la cámara del juego controle la mirada. Pulsa Esc para liberar el cursor.';",
    "    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Capturar ratón';",
    '    panel.append(title, description, button); overlay.appendChild(panel); document.body.appendChild(overlay); state.pointerLockPrompt = overlay;',
    "    button.addEventListener('click', () => {",
    "      try { const request = engine.renderer.domElement.requestPointerLock?.(); if (request && typeof request.catch === 'function') request.catch(() => { overlay.hidden = false; }); }",
    "      catch (error) { overlay.hidden = false; engine.log('El navegador no ha permitido bloquear el ratón.', 'error'); }",
    '    });',
    '    return overlay;',
    '  }',
    '  function showPointerLockPrompt() { if (state.mouseLockRequested && engine.isPlaying) ensurePointerLockPrompt().hidden = false; }',
    '  function hidePointerLockPrompt() { if (state.pointerLockPrompt) state.pointerLockPrompt.hidden = true; }',
    '  function lockMouse(enabled) {',
    '    state.mouseLockRequested = Boolean(enabled);',
    '    if (!state.mouseLockRequested) {',
    '      state.mouseDeltaX = 0; state.mouseDeltaY = 0; hidePointerLockPrompt();',
    '      if (document.pointerLockElement === engine.renderer.domElement) document.exitPointerLock?.();',
    '      return true;',
    '    }',
    "    if (!engine.isPlaying) { engine.toast('Activa Play antes de bloquear el ratón.'); return false; }",
    "    if (state.cameraMode === 'orbit') { state.cameraMode = 'game'; engine.orbit.enabled = false; }",
    '    if (state.pointerLocked) { hidePointerLockPrompt(); return true; }',
    '    try {',
    '      const request = engine.renderer.domElement.requestPointerLock?.();',
    "      if (request && typeof request.catch === 'function') request.catch(() => showPointerLockPrompt());",
    '      setTimeout(() => { if (!state.pointerLocked && state.mouseLockRequested) showPointerLockPrompt(); }, 350);',
    '      return true;',
    '    } catch (error) { showPointerLockPrompt(); return false; }',
    '  }',
    '  function consumeMouseDelta() {',
    '    const delta = { x: state.mouseDeltaX, y: state.mouseDeltaY };',
    '    state.mouseDeltaX = 0; state.mouseDeltaY = 0; return delta;',
    '  }',
    '  function setGameCameraPosition(x, y, z) {',
    '    if (![x, y, z].every(Number.isFinite)) return false;',
    "    state.cameraMode = 'game'; state.followTarget = null; state.transition = null; engine.orbit.enabled = false;",
    '    engine.camera.position.set(x, y, z); engine.camera.updateMatrixWorld(); return true;',
    '  }',
    '  function setGameCameraRotation(x, y, z) {',
    '    if (![x, y, z].every(Number.isFinite)) return false;',
    "    state.cameraMode = 'game'; state.followTarget = null; state.transition = null; engine.orbit.enabled = false;",
    "    engine.camera.rotation.order = 'YXZ'; engine.camera.rotation.set(x, y, z, 'YXZ'); engine.camera.updateMatrixWorld();",
    '    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion); engine.orbit.target.copy(engine.camera.position).add(forward); return true;',
    '  }',
    '  function beginPlay() {',
    '    if (!state.prePlayCamera) state.prePlayCamera = { position: engine.camera.position.clone(), quaternion: engine.camera.quaternion.clone(), target: engine.orbit.target.clone(), up: engine.camera.up.clone(), orbitEnabled: engine.orbit.enabled, mode: state.cameraMode };',
    "    state.mouseDeltaX = 0; state.mouseDeltaY = 0; state.gameCameraObject = engine.editable.find(obj => (obj.userData.components || []).includes('Camera')) || null;",
    '    if (state.gameCameraObject) {',
    '      state.gameCameraObject.updateWorldMatrix(true, false);',
    '      state.gameCameraObject.getWorldPosition(engine.camera.position); state.gameCameraObject.getWorldQuaternion(engine.camera.quaternion);',
    "      state.cameraMode = 'game'; state.followTarget = null; state.transition = null; engine.orbit.enabled = false; engine.camera.updateMatrixWorld();",
    "    } else { engine.orbit.enabled = state.cameraMode === 'orbit' || state.cameraMode === 'third-person'; }",
    '    return true;',
    '  }',
    '  function endPlay() {',
    '    lockMouse(false); state.gameCameraObject = null; state.mouseDeltaX = 0; state.mouseDeltaY = 0;',
    '    const snapshot = state.prePlayCamera; state.prePlayCamera = null;',
    '    if (snapshot) { engine.camera.position.copy(snapshot.position); engine.camera.quaternion.copy(snapshot.quaternion); engine.camera.up.copy(snapshot.up); engine.camera.updateMatrixWorld(); engine.orbit.target.copy(snapshot.target); engine.orbit.enabled = snapshot.orbitEnabled; state.cameraMode = snapshot.mode; }',
    '    state.transition = null; state.followTarget = null; state.userOrbiting = false; return true;',
    '  }',
    ''
  ].join('\n');
  ge = replaceOnce(ge, '  function installKeybinds() {', inputAndCameraFunctions + '  function installKeybinds() {', 'game camera helper functions');

  ge = replaceOnce(ge,
    "      if (state.cameraMode === 'first-person') engine.renderer.domElement.requestPointerLock?.();",
    "      if (state.cameraMode === 'first-person' && engine.isPlaying) lockMouse(true);",
    'first-person pointer lock integration'
  );
  ge = replaceOnce(ge,
    "    document.addEventListener('pointerlockchange', () => { state.pointerLocked = document.pointerLockElement === engine.renderer.domElement; });\n    document.addEventListener('mousemove', event => {\n      if (!state.pointerLocked || state.cameraMode !== 'first-person') return;\n      state.cameraYaw -= event.movementX * .0022;\n      state.cameraPitch = THREE.MathUtils.clamp(state.cameraPitch - event.movementY * .002, -1.25, 1.25);\n    });",
    "    document.addEventListener('pointerlockchange', () => {\n      state.pointerLocked = document.pointerLockElement === engine.renderer.domElement;\n      if (state.pointerLocked) { state.mouseDeltaX = 0; state.mouseDeltaY = 0; hidePointerLockPrompt(); }\n      else if (state.mouseLockRequested && engine.isPlaying) showPointerLockPrompt();\n    });\n    document.addEventListener('pointerlockerror', () => { if (state.mouseLockRequested) showPointerLockPrompt(); });\n    document.addEventListener('mousemove', event => {\n      if (!state.pointerLocked) return;\n      state.mouseDeltaX += Number(event.movementX) || 0; state.mouseDeltaY += Number(event.movementY) || 0;\n      if (state.cameraMode !== 'first-person') return;\n      state.cameraYaw -= event.movementX * .0022;\n      state.cameraPitch = THREE.MathUtils.clamp(state.cameraPitch - event.movementY * .002, -1.25, 1.25);\n    });",
    'pointer lock change and mouse delta accumulation'
  );

  ge = replaceOnce(ge,
    'window.GorbusGE101 = { state, setCameraMode, createPrefab, undo, redo, createTerrain, enableBloom };',
    'window.GorbusGE101 = { state, setCameraMode, createPrefab, undo, redo, createTerrain, enableBloom, lockMouse, consumeMouseDelta, setGameCameraPosition, setGameCameraRotation, beginPlay, endPlay };',
    'export camera and input methods'
  );
  ge = ge.replaceAll('GE 1.0.1', 'GE 1.0.3');
  return ge;
}

export function patchGorbusGE101CSS(input) {
  if (input.includes('.ge101-pointer-lock-prompt')) return input;
  return input + '\n' + [
    '.ge101-pointer-lock-prompt{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:20px;background:rgba(5,8,14,.42);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}',
    '.ge101-pointer-lock-prompt[hidden]{display:none}',
    '.ge101-pointer-lock-panel{display:grid;gap:9px;width:min(340px,calc(100vw - 40px));padding:20px;border:1px solid rgba(155,142,244,.32);border-radius:13px;background:linear-gradient(155deg,#23283a,#151a26);color:#e9e9f4;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 28px rgba(126,108,231,.16);text-align:center}',
    '.ge101-pointer-lock-panel strong{font-size:14px}',
    '.ge101-pointer-lock-panel span{color:#a4aec0;font-size:11px;line-height:1.5}',
    '.ge101-pointer-lock-panel button{min-height:36px;border:1px solid rgba(159,145,255,.45);border-radius:7px;background:linear-gradient(135deg,#6555bd,#453b88);color:#fff;font-weight:650;cursor:pointer}',
    '.ge101-pointer-lock-panel button:hover{filter:brightness(1.13)}',
    '@media(prefers-reduced-motion:reduce){.ge101-pointer-lock-panel{scroll-behavior:auto}}'
  ].join('\n');
}
