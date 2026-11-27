function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`GE 2.1 mouse input patch could not safely locate unique anchor: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

export function patchGE21MouseInput(original) {
  let main = original;
  if (!main.includes('const mouseButtonsDown = new Set()')) {
    main = replaceOnce(
      main,
      'const keysDown = new Set();\nconst keysJustPressed = new Set();',
      'const keysDown = new Set();\nconst keysJustPressed = new Set();\nconst mouseButtonsDown = new Set();\nconst mouseButtonsJustPressed = new Set();',
      'mouse button state'
    );
    main = replaceOnce(
      main,
      '    isKeyJustPressed:(key)=>keysJustPressed.has(normaliseInputKey(key)),',
      '    isKeyJustPressed:(key)=>keysJustPressed.has(normaliseInputKey(key)),\n    isMouseButtonDown:(button=0)=>mouseButtonsDown.has(Number(button)||0),\n    isMouseButtonJustPressed:(button=0)=>mouseButtonsJustPressed.has(Number(button)||0),',
      'public mouse button api'
    );
    main = replaceOnce(
      main,
      "window.addEventListener('blur',()=>{keysDown.clear();keysJustPressed.clear();});",
      "window.addEventListener('mousedown',event=>{const button=Number(event.button)||0;if(!mouseButtonsDown.has(button))mouseButtonsJustPressed.add(button);mouseButtonsDown.add(button);});\nwindow.addEventListener('mouseup',event=>mouseButtonsDown.delete(Number(event.button)||0));\nwindow.addEventListener('blur',()=>{keysDown.clear();keysJustPressed.clear();mouseButtonsDown.clear();mouseButtonsJustPressed.clear();});",
      'mouse button lifecycle listeners'
    );
    main = replaceOnce(
      main,
      'luauBusy=false;keysJustPressed.clear();renderer.domElement.focus({preventScroll:true});',
      'luauBusy=false;keysJustPressed.clear();mouseButtonsDown.clear();mouseButtonsJustPressed.clear();renderer.domElement.focus({preventScroll:true});',
      'clear mouse state at Play start'
    );
    main = replaceOnce(
      main,
      '            keysJustPressed.clear();\n            if(!isPlaying||paused||!physicsWorld)break;',
      '            keysJustPressed.clear();\n            mouseButtonsJustPressed.clear();\n            if(!isPlaying||paused||!physicsWorld)break;',
      'clear mouse just pressed after Luau tick'
    );
    main = replaceOnce(
      main,
      '- Gorbus.isKeyJustPressed(key): detecta una pulsación nueva.',
      '- Gorbus.isKeyJustPressed(key): detecta una pulsación nueva.\n- Gorbus.isMouseButtonDown(button=0): comprueba un botón del ratón (0 izquierdo, 1 central, 2 derecho).\n- Gorbus.isMouseButtonJustPressed(button=0): detecta una pulsación nueva del botón del ratón.',
      'document mouse API for Gorbus AI'
    );
  }
  if (!main.includes('setObjectVisible:(name,visible)')) {
    main = replaceOnce(
      main,
      '    isMouseButtonJustPressed:(button=0)=>mouseButtonsJustPressed.has(Number(button)||0),',
      '    isMouseButtonJustPressed:(button=0)=>mouseButtonsJustPressed.has(Number(button)||0),\n    setObjectVisible:(name,visible)=>{const obj=findObject(name);if(!obj)return false;obj.visible=Boolean(visible);return true;},',
      'runtime object visibility api'
    );
  }
  if (!main.includes('Gorbus.setObjectVisible(name,visible)')) {
    main = replaceOnce(
      main,
      '- Gorbus.isMouseButtonJustPressed(button=0): detecta una pulsación nueva del botón del ratón.',
      '- Gorbus.isMouseButtonJustPressed(button=0): detecta una pulsación nueva del botón del ratón.\n- Gorbus.setObjectVisible(name,visible): muestra u oculta la malla sin retirar el cuerpo físico que ya se creó al iniciar Play.',
      'document object visibility api'
    );
  }
  return main;
}
