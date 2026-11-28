function replaceOnce(source, before, after, label) {
  const at = source.indexOf(before);
  if (at < 0 || source.indexOf(before, at + before.length) >= 0) throw new Error('GE 3.0 UI: missing or duplicate anchor: ' + label);
  return source.slice(0, at) + after + source.slice(at + before.length);
}
const uiHelpers = [
  'const gorbusRuntimeUIElements = new Map();',
  'const gorbusRuntimeUIEvents = new Set();',
  'function ensureGorbusRuntimeUIRoot() {',
  "  const viewport = document.getElementById('viewport');",
  '  if (!viewport) return null;',
  "  let root = document.getElementById('gorbusRuntimeUI');",
  '  if (root) return root;',
  "  if (!document.getElementById('gorbusRuntimeUIStyles')) {",
  "    const style = document.createElement('style'); style.id = 'gorbusRuntimeUIStyles';",
  "    style.textContent = '#gorbusRuntimeUI{position:absolute;inset:0;z-index:82;pointer-events:none;overflow:hidden;color:#f0f3f7;font-family:Orbitron,system-ui,sans-serif}' + '#gorbusRuntimeUI .gbui-panel{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;padding:12px;border:1px solid rgba(168,220,255,.22);border-left:2px solid #ff6a1a;border-radius:10px;background:linear-gradient(145deg,rgba(18,23,31,.94),rgba(7,10,15,.9));box-shadow:0 16px 42px rgba(0,0,0,.4);backdrop-filter:blur(10px);color:#e9edf2}' + '#gorbusRuntimeUI .gbui-text{display:flex;align-items:center;box-sizing:border-box;color:#e9edf2;font:600 14px/1.35 Share Tech Mono,ui-monospace,monospace;text-shadow:0 1px 5px #000;white-space:pre-wrap;overflow:hidden}' + '#gorbusRuntimeUI .gbui-button{display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(255,106,26,.75);border-radius:8px;background:linear-gradient(100deg,rgba(255,106,26,.22),rgba(13,17,23,.9));color:#f4f6fa;font:700 12px/1.25 Orbitron,system-ui,sans-serif;letter-spacing:.1em;text-align:center;cursor:pointer;pointer-events:auto;transition:background .16s,border-color .16s,transform .16s}' + '#gorbusRuntimeUI .gbui-button:hover{background:rgba(255,106,26,.32);border-color:#ff9a5c;transform:translateY(-1px)}' + '#gorbusRuntimeUI .gbui-button:focus-visible{outline:2px solid #a8dcff;outline-offset:3px}' + '@media(max-width:620px){#gorbusRuntimeUI .gbui-panel{padding:9px;border-radius:8px}#gorbusRuntimeUI .gbui-text{font-size:12px}#gorbusRuntimeUI .gbui-button{font-size:10px;padding:7px 8px;letter-spacing:.06em}}' + '@media(prefers-reduced-motion:reduce){#gorbusRuntimeUI *{transition:none!important}}';",
  '    document.head.appendChild(style);',
  '  }',
  "  root = document.createElement('div'); root.id = 'gorbusRuntimeUI'; viewport.appendChild(root); return root;",
  '}',
  "function validGorbusUIId(id) { return /^[A-Za-z0-9_-]{1,48}$/.test(String(id || '')); }",
  'function clampGorbusUI(v, fallback) { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback; }',
  'function createGorbusUIElement(id, kind, text, x, y, w, h) {',
  "  if (!validGorbusUIId(id) || !['panel','text','button'].includes(kind)) return false;",
  '  const root = ensureGorbusRuntimeUIRoot(); if (!root) return false;',
  '  const key = String(id); let el = gorbusRuntimeUIElements.get(key);',
  '  if (el && el.dataset.gbuiKind !== kind) { el.remove(); gorbusRuntimeUIElements.delete(key); el = null; }',
  '  if (!el) {',
  "    el = document.createElement(kind === 'button' ? 'button' : 'div'); el.id = 'gorbus-ui-' + key; el.dataset.gbuiKind = kind;",
  "    if (kind === 'button') { el.type = 'button'; el.className = 'gbui-button'; el.addEventListener('click', () => gorbusRuntimeUIEvents.add(key)); }",
  "    else if (kind === 'panel') { el.className = 'gbui-panel'; el.style.pointerEvents = 'none'; } else { el.className = 'gbui-text'; el.style.pointerEvents = 'none'; }",
  '    root.appendChild(el); gorbusRuntimeUIElements.set(key, el);',
  '  }',
  "  el.textContent = String(text == null ? '' : text).slice(0,500); el.style.position = 'absolute';",
  "  el.style.left = clampGorbusUI(x,0) + '%'; el.style.top = clampGorbusUI(y,0) + '%'; el.style.width = clampGorbusUI(w,20) + '%'; el.style.height = clampGorbusUI(h,8) + '%'; el.style.boxSizing = 'border-box';",
  "  el.setAttribute('aria-label', String(text == null ? kind : text).slice(0,120)); return true;",
  '}',
  "function setGorbusUIText(id,text) { if(!validGorbusUIId(id))return false; const el=gorbusRuntimeUIElements.get(String(id)); if(!el)return false; el.textContent=String(text==null?'':text).slice(0,500); return true; }",
  "function setGorbusUIVisible(id,visible) { if(!validGorbusUIId(id))return false; const el=gorbusRuntimeUIElements.get(String(id)); if(!el)return false; el.style.display=visible?'':'none'; return true; }",
  "function setGorbusUIRect(id,x,y,w,h) { if(!validGorbusUIId(id))return false; const el=gorbusRuntimeUIElements.get(String(id)); if(!el)return false; el.style.left=clampGorbusUI(x,0)+'%'; el.style.top=clampGorbusUI(y,0)+'%'; el.style.width=clampGorbusUI(w,20)+'%'; el.style.height=clampGorbusUI(h,8)+'%'; return true; }",
  "function setGorbusUIStyle(id,property,value) { if(!validGorbusUIId(id))return false; const el=gorbusRuntimeUIElements.get(String(id)); const allowed={color:'color',background:'background',backgroundColor:'backgroundColor',border:'border',borderColor:'borderColor',borderRadius:'borderRadius',fontSize:'fontSize',fontWeight:'fontWeight',textAlign:'textAlign',padding:'padding',opacity:'opacity',letterSpacing:'letterSpacing',lineHeight:'lineHeight',boxShadow:'boxShadow'}; if(!el||!Object.prototype.hasOwnProperty.call(allowed,String(property)))return false; const v=String(value==null?'':value).slice(0,120); if(/[<>\\\\u0000-\\\\u001f]|url\\\\s*\\\\(|expression\\\\s*\\\\(|javascript:/i.test(v))return false; el.style[allowed[String(property)]]=v; return true; }",
  "function wasGorbusUIClicked(id) { if(!validGorbusUIId(id))return false; const k=String(id); if(!gorbusRuntimeUIEvents.has(k))return false; gorbusRuntimeUIEvents.delete(k); return true; }",
  "function destroyGorbusUIElement(id) { if(!validGorbusUIId(id))return false; const k=String(id),el=gorbusRuntimeUIElements.get(k); if(!el)return false; el.remove(); gorbusRuntimeUIElements.delete(k); gorbusRuntimeUIEvents.delete(k); return true; }",
  "function clearGorbusRuntimeUI() { for(const el of gorbusRuntimeUIElements.values())el.remove(); gorbusRuntimeUIElements.clear(); gorbusRuntimeUIEvents.clear(); document.getElementById('gorbusRuntimeUI')?.remove(); return true; }"
].join('\n');
export function patchGE300UIRuntime(input) {
  let main = input;
  if (!main.includes('function ensureGorbusRuntimeUIRoot()')) main = replaceOnce(main,'function createLuauBridge(scriptObjectName=null){',uiHelpers+'\\nfunction createLuauBridge(scriptObjectName=null){','UI runtime helpers');
  if (!main.includes('uiCreatePanel:(id,x,y,width,height,text')) main = replaceOnce(main,'    clearGameHUD:()=>clearGorbusRuntimeHUD(),',[
    '    clearGameHUD:()=>clearGorbusRuntimeHUD(),',
    '    uiCreatePanel:(id,x,y,width,height,text="")=>createGorbusUIElement(id,"panel",text,x,y,width,height),',
    '    uiCreateText:(id,text,x,y,width,height)=>createGorbusUIElement(id,"text",text,x,y,width,height),',
    '    uiCreateButton:(id,text,x,y,width,height)=>createGorbusUIElement(id,"button",text,x,y,width,height),',
    '    uiSetText:(id,text)=>setGorbusUIText(id,text),',
    '    uiSetVisible:(id,visible)=>setGorbusUIVisible(id,Boolean(visible)),',
    '    uiSetRect:(id,x,y,width,height)=>setGorbusUIRect(id,x,y,width,height),',
    '    uiSetStyle:(id,property,value)=>setGorbusUIStyle(id,property,value),',
    '    uiWasClicked:(id)=>wasGorbusUIClicked(id),',
    '    uiDestroy:(id)=>destroyGorbusUIElement(id),',
    '    uiClear:()=>clearGorbusRuntimeUI(),'
  ].join('\\n'),'public UI bridge API');
  const doc='- Gorbus.clearGameHUD(): retira el HUD al terminar el juego.';
  if(!main.includes('Gorbus.uiCreatePanel')) main=replaceOnce(main,doc,doc+'\\n- Gorbus.uiCreatePanel / uiCreateText / uiCreateButton crean paneles, textos y botones 2D responsive en el viewport; posición y tamaño en porcentaje.\\n- uiSetText, uiSetVisible, uiSetRect, uiSetStyle, uiWasClicked, uiDestroy y uiClear permiten actualizarlos y recibir clics.\\n- El texto se asigna con textContent y los estilos están allowlisted. Es UI 2D en pantalla; todavía no crea UI interactiva en el espacio 3D.','UI API documentation');
  return main;
}
