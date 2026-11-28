function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) throw new Error("GE 3.0.0 profiler patch could not safely locate unique anchor: " + label);
  return source.slice(0, first) + after + source.slice(first + before.length);
}
const profilerHelpers = [
"let gorbusProfilerVisible=false, gorbusProfilerFrame=0, gorbusProfilerLast=0, gorbusProfilerFrames=[], gorbusProfilerLastPaint=0;",
"let gorbusProfilerStats={fps:0,frameMs:0,calls:0,triangles:0,geometries:0,textures:0,memoryMB:null};",
"function sampleGorbusProfiler(now){",
"  if(gorbusProfilerLast){const delta=Math.min(250,now-gorbusProfilerLast);if(delta>0)gorbusProfilerFrames.push(delta);if(gorbusProfilerFrames.length>45)gorbusProfilerFrames.shift();}",
"  gorbusProfilerLast=now;const total=gorbusProfilerFrames.reduce((sum,value)=>sum+value,0);",
"  const info=typeof renderer!=='undefined'&&renderer&&renderer.info?renderer.info:null;const memory=performance&&performance.memory?performance.memory.usedJSHeapSize:null;",
"  gorbusProfilerStats={fps:total>0?Math.round(gorbusProfilerFrames.length*1000/total):0,frameMs:gorbusProfilerFrames.length?Math.round(total/gorbusProfilerFrames.length*10)/10:0,calls:info&&info.render?info.render.calls:0,triangles:info&&info.render?info.render.triangles:0,geometries:info&&info.memory?info.memory.geometries:0,textures:info&&info.memory?info.memory.textures:0,memoryMB:Number.isFinite(memory)?Math.round(memory/104857.6)/10:null};",
"  if(gorbusProfilerVisible&&now-gorbusProfilerLastPaint>250){gorbusProfilerLastPaint=now;const root=document.getElementById('gorbusProfilerOverlay');if(root){for(const [key,value] of Object.entries(gorbusProfilerStats)){const node=root.querySelector('[data-gp='+String.fromCharCode(34)+key+String.fromCharCode(34)+']');if(node)node.textContent=value===null?'N/D':String(value);}}}",
"  gorbusProfilerFrame=requestAnimationFrame(sampleGorbusProfiler);",
"}",
"function setGorbusProfilerVisible(visible){",
"  gorbusProfilerVisible=Boolean(visible);let root=document.getElementById('gorbusProfilerOverlay');",
"  if(!root){const style=document.createElement('style');style.id='gorbusProfilerStyles';style.textContent='#gorbusProfilerOverlay{position:absolute;z-index:95;top:12px;right:12px;min-width:190px;padding:10px 12px;background:rgba(5,10,18,.88);border:1px solid rgba(0,225,255,.4);border-radius:8px;color:#e8faff;font:11px ui-monospace,monospace;pointer-events:none;backdrop-filter:blur(8px)}#gorbusProfilerOverlay header{font-weight:800;letter-spacing:.14em;color:#00e5ff;margin-bottom:7px}#gorbusProfilerOverlay .gp-row{display:flex;justify-content:space-between;gap:18px;padding:2px 0}#gorbusProfilerOverlay b{color:#fff;font-variant-numeric:tabular-nums}';document.head.appendChild(style);",
"    root=document.createElement('div');root.id='gorbusProfilerOverlay';root.innerHTML='<header>GORBUS · PROFILER</header>'+[['fps','FPS'],['frameMs','FRAME MS'],['calls','DRAW CALLS'],['triangles','TRIANGLES'],['geometries','GEOMETRIES'],['textures','TEXTURES'],['memoryMB','JS HEAP MB']].map(([key,label])=>'<div class=gp-row><span>'+label+'</span><b data-gp='+String.fromCharCode(34)+key+String.fromCharCode(34)+'>0</b></div>').join('');",
"    const viewport=document.getElementById('viewport');(viewport||document.body).appendChild(root);}",
"  root.style.display=gorbusProfilerVisible?'block':'none';return gorbusProfilerVisible;",
"}",
"if(!gorbusProfilerFrame)gorbusProfilerFrame=requestAnimationFrame(sampleGorbusProfiler);"
].join('\n');

export function patchGE300Main(original) {
 let main=original;
 if(!main.includes('function sampleGorbusProfiler(now)')) main=replaceOnce(main,'function createLuauBridge(scriptObjectName=null){',profilerHelpers+'\nfunction createLuauBridge(scriptObjectName=null){','profiler runtime helpers');
 if(!main.includes('getPerformanceStatsJSON:')) {
  const anchor='clearGameHUD:()=>clearGorbusRuntimeHUD(),';
  const index=main.indexOf(anchor);
  if(index<0||main.indexOf(anchor,index+anchor.length)>=0) throw new Error('GE 3.0.0 profiler could not uniquely locate runtime HUD API.');
  const insertion='clearGameHUD:()=>clearGorbusRuntimeHUD(),\n    getPerformanceStatsJSON:()=>JSON.stringify(gorbusProfilerStats),\n    setProfilerVisible:(visible)=>setGorbusProfilerVisible(visible),\n    getObjectScale:(name)=>{const obj=findObject(name);return obj?{x:obj.scale.x,y:obj.scale.y,z:obj.scale.z}:null;},\n    setObjectScale:(name,x,y,z)=>{const obj=findObject(name);if(!obj)return false;obj.scale.set(Number(x)||0,Number(y)||0,Number(z)||0);return true;},\n    getObjectRotation:(name)=>{const obj=findObject(name);return obj?{x:THREE.MathUtils.radToDeg(obj.rotation.x),y:THREE.MathUtils.radToDeg(obj.rotation.y),z:THREE.MathUtils.radToDeg(obj.rotation.z)}:null;},\n    setObjectRotation:(name,x,y,z)=>{const obj=findObject(name);if(!obj)return false;obj.rotation.set(THREE.MathUtils.degToRad(Number(x)||0),THREE.MathUtils.degToRad(Number(y)||0),THREE.MathUtils.degToRad(Number(z)||0));return true;},\n    getSceneObjectCount:()=>editable.length,';
  main=main.slice(0,index)+insertion+main.slice(index+anchor.length);
 }
 if(!main.includes('Gorbus.getPerformanceStatsJSON()')) main=replaceOnce(main,'- Gorbus.clearGameHUD(): retira el HUD al terminar el juego.',
 '- Gorbus.clearGameHUD(): retira el HUD al terminar el juego.\n- Gorbus.getPerformanceStatsJSON(): devuelve FPS, frame time, draw calls, triángulos, geometrías, texturas y memoria JS disponible en JSON.\n- Gorbus.setProfilerVisible(visible): muestra u oculta el profiler durante Play.\n- Gorbus.getObjectScale(name) / setObjectScale(name,x,y,z): lee o cambia la escala en runtime.\n- Gorbus.getObjectRotation(name) / setObjectRotation(name,x,y,z): lee o cambia la rotación en grados.\n- Gorbus.getSceneObjectCount(): devuelve el número de objetos editables.','document profiler and transform APIs');
 return main;
}
