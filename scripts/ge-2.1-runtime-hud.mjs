function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) {
    throw new Error("GE 2.1 runtime HUD patch could not safely locate unique anchor: " + label);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

const hudHelpers = [
"let gorbusRuntimeHUDToastTimer = null;",
"function ensureGorbusRuntimeHUD() {",
"  const viewport = document.getElementById('viewport');",
"  if (!viewport) return null;",
"  let root = document.getElementById('gorbusRuntimeGameHUD');",
"  if (root) return root;",
"  if (!document.getElementById('gorbusRuntimeGameHUDStyles')) {",
"    const style = document.createElement('style');",
"    style.id = 'gorbusRuntimeGameHUDStyles';",
"    style.textContent = [",
"      '#gorbusRuntimeGameHUD{position:absolute;inset:0;z-index:80;pointer-events:none;opacity:0;transition:opacity .2s;color:#f0f3f7;font-family:Orbitron,system-ui,sans-serif;overflow:hidden;text-shadow:0 2px 8px #000}',",
"      '#gorbusRuntimeGameHUD.visible{opacity:1}',",
"      '#gorbusRuntimeGameHUD .stryde-top{position:absolute;top:14px;left:16px;right:16px;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:12px}',",
"      '#gorbusRuntimeGameHUD .stryde-panel{padding:10px 13px;background:linear-gradient(135deg,rgba(8,12,18,.78),rgba(8,12,18,.38));border:1px solid rgba(255,255,255,.16);border-left:2px solid #ff6a1a;backdrop-filter:blur(8px);min-width:0}',",
"      '#gorbusRuntimeGameHUD .stryde-brand{font-size:clamp(13px,1.35vw,19px);font-weight:900;letter-spacing:.2em;color:#ff6a1a}',",
"      '#gorbusRuntimeGameHUD .stryde-brand span{display:block;color:#a8dcff;font:10px Share Tech Mono,monospace;letter-spacing:.22em;margin-top:4px}',",
"      '#gorbusRuntimeGameHUD .stryde-timer{text-align:center;border-left:0;border-bottom:2px solid #ff6a1a;min-width:112px}',",
"      '#gorbusRuntimeGameHUD .stryde-caption{display:block;color:#a8dcff;font:10px Share Tech Mono,monospace;letter-spacing:.18em;margin-bottom:4px}',",
"      '#gorbusRuntimeGameHUD .stryde-timer strong{font-size:clamp(22px,3vw,34px);font-variant-numeric:tabular-nums;letter-spacing:.08em}',",
"      '#gorbusRuntimeGameHUD .stryde-mode{text-align:right;border-left:0;border-right:2px solid #a8dcff}',",
"      '#gorbusRuntimeGameHUD .stryde-mode strong{font-size:clamp(12px,1.2vw,17px);letter-spacing:.09em;overflow-wrap:anywhere}',",
"      '#gorbusRuntimeGameHUD .stryde-stats{position:absolute;left:16px;bottom:18px;display:grid;grid-template-columns:repeat(3,minmax(76px,1fr));gap:7px;max-width:min(420px,65vw)}',",
"      '#gorbusRuntimeGameHUD .stryde-stat{padding:8px 11px;background:rgba(7,10,15,.72);border:1px solid rgba(255,255,255,.13);border-bottom:2px solid rgba(168,220,255,.55)}',",
"      '#gorbusRuntimeGameHUD .stryde-stat span{display:block;color:#a8dcff;font:10px Share Tech Mono,monospace;letter-spacing:.12em}',",
"      '#gorbusRuntimeGameHUD .stryde-stat strong{display:block;margin-top:3px;font-size:clamp(16px,1.8vw,22px);font-variant-numeric:tabular-nums}',",
"      '#gorbusRuntimeGameHUD .stryde-rank{position:absolute;right:16px;bottom:18px;text-align:right;padding:8px 14px;background:rgba(7,10,15,.72);border:1px solid rgba(255,255,255,.13);border-right:2px solid #ff6a1a}',",
"      '#gorbusRuntimeGameHUD .stryde-rank span{display:block;color:#a8dcff;font:10px Share Tech Mono,monospace;letter-spacing:.16em}',",
"      '#gorbusRuntimeGameHUD .stryde-rank strong{display:block;font-size:25px;color:#ff6a1a}',",
"      '#gorbusRuntimeGameHUD .stryde-crosshair{position:absolute;left:50%;top:50%;width:26px;height:26px;transform:translate(-50%,-50%);filter:drop-shadow(0 1px 3px #000)}',",
"      '#gorbusRuntimeGameHUD .stryde-crosshair:before,#gorbusRuntimeGameHUD .stryde-crosshair:after{content:\"\";position:absolute;background:rgba(245,248,255,.94);border-radius:2px}',",
"      '#gorbusRuntimeGameHUD .stryde-crosshair:before{width:2px;height:22px;left:12px;top:2px}',",
"      '#gorbusRuntimeGameHUD .stryde-crosshair:after{height:2px;width:22px;top:12px;left:2px}',",
"      '#gorbusRuntimeGameHUD .stryde-toast{position:absolute;left:50%;top:19%;transform:translate(-50%,-8px);padding:9px 16px;background:rgba(7,10,15,.8);border:1px solid rgba(255,106,26,.65);color:#ffb17c;font-size:12px;letter-spacing:.15em;opacity:0;transition:opacity .14s,transform .14s;white-space:nowrap;max-width:90%;overflow:hidden;text-overflow:ellipsis}',",
"      '#gorbusRuntimeGameHUD .stryde-toast.show{opacity:1;transform:translate(-50%,0)}',",
"      '#gorbusRuntimeGameHUD .stryde-help{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font:10px Share Tech Mono,monospace;color:rgba(230,237,245,.6);letter-spacing:.12em;text-align:center}',",
"      '@media(max-width:620px){#gorbusRuntimeGameHUD .stryde-top{top:8px;left:8px;right:8px;gap:5px}#gorbusRuntimeGameHUD .stryde-panel{padding:7px 8px}#gorbusRuntimeGameHUD .stryde-brand span{font-size:8px}#gorbusRuntimeGameHUD .stryde-timer{min-width:82px}#gorbusRuntimeGameHUD .stryde-caption{font-size:8px}#gorbusRuntimeGameHUD .stryde-stats{left:8px;bottom:8px;gap:4px;max-width:75vw}#gorbusRuntimeGameHUD .stryde-stat{padding:6px 7px}#gorbusRuntimeGameHUD .stryde-stat span{font-size:8px}#gorbusRuntimeGameHUD .stryde-rank{right:8px;bottom:8px;padding:6px 9px}#gorbusRuntimeGameHUD .stryde-help{display:none}}'",
"    ].join('');",
"    document.head.appendChild(style);",
"  }",
"  root = document.createElement('div');",
"  root.id = 'gorbusRuntimeGameHUD';",
"  root.innerHTML = \"<div class='stryde-top'><div class='stryde-panel'><div class='stryde-brand'>STRYDE<span>CAMPO ORIÓN · TRAINING</span></div></div><div class='stryde-panel stryde-timer'><span class='stryde-caption'>TIEMPO</span><strong data-stryde='time'>01:00</strong></div><div class='stryde-panel stryde-mode'><span class='stryde-caption'>MODO DE ESCANEO</span><strong data-stryde='mode'>S-9 PULSE</strong></div></div><div class='stryde-stats'><div class='stryde-stat'><span>PUNTOS</span><strong data-stryde='score'>0</strong></div><div class='stryde-stat'><span>PRECISIÓN</span><strong data-stryde='accuracy'>0%</strong></div><div class='stryde-stat'><span>BALIZAS ACTIVADAS</span><strong data-stryde='nodes'>0</strong></div></div><div class='stryde-rank'><span>RANGO</span><strong data-stryde='rank'>--</strong></div><div class='stryde-crosshair'></div><div class='stryde-toast' data-stryde='toast'></div><div class='stryde-help'>WASD MOVER · SHIFT CORRER · CLIC ESCANEAR · 1–4 ARMAS · T REINICIAR</div>\";",
"  viewport.appendChild(root);",
"  requestAnimationFrame(() => root?.classList.add('visible'));",
"  return root;",
"}",
"function setGorbusRuntimeHUD(seconds=60, score=0, accuracy=0, modeName='-', activatedNodes=0, rank='--') {",
"  const root = ensureGorbusRuntimeHUD();",
"  if (!root) return false;",
"  const whole = Math.ceil(Math.max(0, Number(seconds) || 0));",
"  const minutes = Math.floor(whole / 60);",
"  const secondsPart = whole % 60;",
"  root.querySelector('[data-stryde=\"time\"]').textContent = String(minutes).padStart(2,'0') + ':' + String(secondsPart).padStart(2,'0');",
"  root.querySelector('[data-stryde=\"score\"]').textContent = Math.max(0, Math.floor(Number(score) || 0)).toLocaleString('es-ES');",
"  root.querySelector('[data-stryde=\"accuracy\"]').textContent = Math.max(0, Math.min(100, Number(accuracy) || 0)) + '%';",
"  root.querySelector('[data-stryde=\"mode\"]').textContent = String(modeName || '-').slice(0,32);",
"  root.querySelector('[data-stryde=\"nodes\"]').textContent = Math.max(0, Math.floor(Number(activatedNodes) || 0));",
"  root.querySelector('[data-stryde=\"rank\"]').textContent = String(rank || '--').slice(0,2);",
"  return true;",
"}",
"function showGorbusRuntimeHUDMessage(message, duration=1050) {",
"  const root = ensureGorbusRuntimeHUD();",
"  if (!root) return false;",
"  const toast = root.querySelector('[data-stryde=\"toast\"]');",
"  toast.textContent = String(message || '').slice(0,90);",
"  toast.classList.add('show');",
"  clearTimeout(gorbusRuntimeHUDToastTimer);",
"  gorbusRuntimeHUDToastTimer = setTimeout(() => toast?.classList.remove('show'), Math.max(250, Math.min(4000, Number(duration) || 1050)));",
"  return true;",
"}",
"function clearGorbusRuntimeHUD() {",
"  clearTimeout(gorbusRuntimeHUDToastTimer);",
"  gorbusRuntimeHUDToastTimer = null;",
"  document.getElementById('gorbusRuntimeGameHUD')?.remove();",
"  return true;",
"}"
].join('\n');

export function patchGE21RuntimeHUD(original) {
  let main = original;
  if (!main.includes('function ensureGorbusRuntimeHUD()')) {
    main = replaceOnce(main, 'function createLuauBridge(scriptObjectName=null){', hudHelpers + '\nfunction createLuauBridge(scriptObjectName=null){', 'runtime HUD helpers');
  }
  if (!main.includes('setGameHUD:(seconds=60')) {
    main = replaceOnce(
      main,
      '    setObjectVisible:(name,visible)=>{const obj=findObject(name);if(!obj)return false;obj.visible=Boolean(visible);return true;},',
      '    setObjectVisible:(name,visible)=>{const obj=findObject(name);if(!obj)return false;obj.visible=Boolean(visible);return true;},\n    setGameHUD:(seconds=60,score=0,accuracy=0,modeName="-",activatedNodes=0,rank="--")=>setGorbusRuntimeHUD(seconds,score,accuracy,modeName,activatedNodes,rank),\n    showGameMessage:(message,duration=1050)=>showGorbusRuntimeHUDMessage(message,duration),\n    clearGameHUD:()=>clearGorbusRuntimeHUD(),',
      'public game HUD API'
    );
  }
  if (!main.includes('Gorbus.setGameHUD(seconds,score,accuracy,modeName,activatedNodes,rank)')) {
    const visibilityDoc = [
      '- Gorbus.setObjectVisible(name,visible): muestra u oculta la malla sin retirar el cuerpo físico que se creó al iniciar Play.',
      '- Gorbus.setObjectVisible(name,visible): muestra u oculta la malla sin retirar el cuerpo físico que ya se creó al iniciar Play.'
    ];
    const visibilityAnchor = visibilityDoc.find(line => main.includes(line));
    if (!visibilityAnchor) throw new Error('GE 2.1 runtime HUD patch could not find the documented setObjectVisible API.');
    main = replaceOnce(
      main,
      visibilityAnchor,
      visibilityAnchor + '\n- Gorbus.setGameHUD(seconds,score,accuracy,modeName,activatedNodes,rank): muestra el HUD arcade del viewport con el modo de escaneo y los datos de partida.\n- Gorbus.showGameMessage(message,duration): muestra un aviso breve en el HUD.\n- Gorbus.clearGameHUD(): retira el HUD al terminar el juego.',
      'document runtime game HUD API'
    );
  }
  return main;
}
