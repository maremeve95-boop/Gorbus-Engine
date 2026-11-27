function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`GE 2.1 patch could not safely locate unique anchor: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

export function patchGE21Main(original) {
  if (original.includes('async function autoSettleObjects') && original.includes('let selectedObjects = new Set()')) return original;
  let main = original;
  main = replaceOnce(
    main,
    "let editable = [];\nlet selected = null;\nlet currentTool = 'select';",
    "let editable = [];\nlet selected = null;\nlet selectedObjects = new Set();\nlet hierarchySelectionAnchor = null;\nlet currentTool = 'select';",
    'multi-select state'
  );

  const oldSelection = `function selectObject(obj) {
  selected = obj || null;
  if (obj && obj.isObject3D && obj.parent === scene && obj !== sun && obj !== grid && obj !== axes && currentTool !== 'select' && !isPlaying) {
    if (obj.isGroup || obj.isMesh || obj.isLight) transform.attach(obj);
    else transform.detach();
  } else transform.detach();
  transform.enabled = !!selected && currentTool !== 'select' && !isPlaying;
  $('inspectorEmpty').classList.toggle('hidden', !!selected);
  $('inspectorContent').classList.toggle('hidden', !selected);
  $('selectedLabel').textContent = selected ? labelOf(selected) : 'Sin selección';
  refreshHierarchy();
  if (selected) populateInspector();
  else $('coordinateReadout').textContent = 'X 0.00   Y 0.00   Z 0.00';
  window.dispatchEvent(new CustomEvent('gorbus-selection-changed', { detail: { object: selected } }));
}`;
  const newSelection = `function setObjectSelection(objects, primary = null) {
  const next = [...new Set((objects || []).filter(obj => editable.includes(obj)))];
  selectedObjects = new Set(next);
  selected = next.includes(primary) ? primary : (next[next.length - 1] || null);
  if (next.length === 1 && selected && selected.isObject3D && selected.parent === scene && selected !== sun && selected !== grid && selected !== axes && currentTool !== 'select' && !isPlaying) {
    if (selected.isGroup || selected.isMesh || selected.isLight) transform.attach(selected);
    else transform.detach();
  } else transform.detach();
  transform.enabled = next.length === 1 && !!selected && currentTool !== 'select' && !isPlaying;
  $('inspectorEmpty').classList.toggle('hidden', !!selected);
  $('inspectorContent').classList.toggle('hidden', !selected);
  $('selectedLabel').textContent = next.length > 1 ? next.length + ' objetos seleccionados' : (selected ? labelOf(selected) : 'Sin selección');
  refreshHierarchy();
  if (selected) populateInspector();
  else $('coordinateReadout').textContent = 'X 0.00   Y 0.00   Z 0.00';
  window.dispatchEvent(new CustomEvent('gorbus-selection-changed', { detail: { object: selected, objects: [...selectedObjects] } }));
}
function selectObject(obj) {
  hierarchySelectionAnchor = obj || null;
  setObjectSelection(obj ? [obj] : [], obj);
}`;
  main = replaceOnce(main, oldSelection, newSelection, 'selection controller');

  const oldHierarchy = `function refreshHierarchy() {
  const list = $('hierarchyList'); list.innerHTML='';
  const query = $('hierarchySearch').value.trim().toLowerCase();
  editable.forEach(obj => {
    const name=labelOf(obj); if(query && !name.toLowerCase().includes(query)) return;
    const row=document.createElement('div'); row.className='object-row'+(obj===selected?' selected':'');
    const glyph = kindOf(obj)==='LIGHT'?'☼':kindOf(obj)==='EMPTY'?'◇':obj.userData.gorbusType==='SPHERE'?'●':obj.userData.gorbusType==='PLANE'?'▱':'◈';
    row.innerHTML=\`<span class="tree-caret">›</span><span class="object-glyph">\${glyph}</span><span class="row-name"></span><span class="row-kind">\${kindOf(obj)}</span>\`;
    row.querySelector('.row-name').textContent=name;
    row.addEventListener('click',()=>selectObject(obj));
    row.addEventListener('dblclick',()=>renameObject(obj));
    row.addEventListener('contextmenu',e=>{e.preventDefault();selectObject(obj);showContext(e.clientX,e.clientY,obj);});
    list.appendChild(row);
  });
  $('objectCount').textContent=\`\${editable.length} objeto\${editable.length===1?'':'s'}\`;
  $('sceneCount').textContent=editable.length;
}`;
  const newHierarchy = `function refreshHierarchy() {
  const list = $('hierarchyList'); list.innerHTML='';
  const query = $('hierarchySearch').value.trim().toLowerCase();
  const visibleObjects = editable.filter(obj => !query || labelOf(obj).toLowerCase().includes(query));
  visibleObjects.forEach(obj => {
    const name=labelOf(obj);
    const row=document.createElement('div'); row.className='object-row'+(selectedObjects.has(obj)?' selected':'');
    const glyph = kindOf(obj)==='LIGHT'?'☼':kindOf(obj)==='EMPTY'?'◇':obj.userData.gorbusType==='SPHERE'?'●':obj.userData.gorbusType==='PLANE'?'▱':'◈';
    row.innerHTML=\`<span class="tree-caret">›</span><span class="object-glyph">\${glyph}</span><span class="row-name"></span><span class="row-kind">\${kindOf(obj)}</span>\`;
    row.querySelector('.row-name').textContent=name;
    row.title='Clic: seleccionar · Ctrl/Cmd: añadir/quitar · Shift: seleccionar rango';
    row.addEventListener('click',event=>{
      if(event.shiftKey){
        let anchorIndex=visibleObjects.indexOf(hierarchySelectionAnchor);
        if(anchorIndex<0)anchorIndex=visibleObjects.indexOf(selected||obj);
        const targetIndex=visibleObjects.indexOf(obj);
        if(anchorIndex<0)anchorIndex=targetIndex;
        const range=visibleObjects.slice(Math.min(anchorIndex,targetIndex),Math.max(anchorIndex,targetIndex)+1);
        setObjectSelection(range,obj);
      }else if(event.ctrlKey||event.metaKey){
        const next=new Set(selectedObjects);
        if(next.has(obj))next.delete(obj);else next.add(obj);
        hierarchySelectionAnchor=obj;
        setObjectSelection([...next],next.has(obj)?obj:[...next].at(-1)||null);
      }else{hierarchySelectionAnchor=obj;selectObject(obj);}
    });
    row.addEventListener('dblclick',()=>renameObject(obj));
    row.addEventListener('contextmenu',e=>{e.preventDefault();selectObject(obj);showContext(e.clientX,e.clientY,obj);});
    list.appendChild(row);
  });
  $('objectCount').textContent=\`\${editable.length} objeto\${editable.length===1?'':'s'}\`;
  $('sceneCount').textContent=editable.length;
}`;
  main = replaceOnce(main, oldHierarchy, newHierarchy, 'hierarchy multi-select');

  const pointerAnchor = `if(hits.length){let obj=hits[0].object;while(obj.parent&&obj.parent!==scene)obj=obj.parent;selectObject(editable.includes(obj)?obj:null);}else if(currentTool==='select')selectObject(null);`;
  const pointerReplacement = `if(hits.length){let obj=hits[0].object;while(obj.parent&&obj.parent!==scene)obj=obj.parent;if(editable.includes(obj)&&(e.ctrlKey||e.metaKey)){const next=new Set(selectedObjects);if(next.has(obj))next.delete(obj);else next.add(obj);hierarchySelectionAnchor=obj;setObjectSelection([...next],next.has(obj)?obj:[...next].at(-1)||null);}else selectObject(editable.includes(obj)?obj:null);}else if(currentTool==='select')selectObject(null);`;
  main = replaceOnce(main, pointerAnchor, pointerReplacement, 'viewport modifier selection');

  const marker = 'window.GorbusEngine={';
  const helper = `async function autoSettleObjects(objects = [...selectedObjects], options = {}) {
  if(isPlaying)throw new Error('Detén Play antes de colocar objetos.');
  const targets=[...new Set((objects||[]).filter(obj=>editable.includes(obj)&&kindOf(obj)!=='LIGHT'&&(obj.isMesh||obj.children?.some(child=>child.isMesh))))];
  if(!targets.length)throw new Error('Selecciona al menos un objeto con geometría.');
  if(targets.length>300)throw new Error('La colocación por lotes admite hasta 300 objetos por operación. Divide la selección en grupos.');
  await ensureRapier();
  const is2d=currentProjectMode==='2d';
  const world=new RAPIER.World({x:0,y:-9.81,z:0});
  world.timestep=1/60;
  if(world.integrationParameters)world.integrationParameters.numSolverIterations=10;
  const bodies=[];
  const makeShape=(obj)=>{
    const shape=objectPhysicsShape(obj);
    let desc;
    if(shape.type==='sphere')desc=RAPIER.ColliderDesc.ball(Math.max(shape.size.x,shape.size.y,shape.size.z));
    else if(shape.type==='capsule'){
      const radius=Math.max(.05,Math.min(shape.size.x,shape.size.z));
      desc=RAPIER.ColliderDesc.capsule(Math.max(.02,shape.size.y-radius),radius);
    }else desc=RAPIER.ColliderDesc.cuboid(shape.size.x,shape.size.y,is2d?Math.max(.05,shape.size.z):shape.size.z);
    return desc.setFriction(.82).setRestitution(.025);
  };
  try{
    const floor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.12,0));
    world.createCollider((is2d?RAPIER.ColliderDesc.cuboid(100,.12,.1):RAPIER.ColliderDesc.cuboid(100,.12,100)).setFriction(.9),floor);
    const targetSet=new Set(targets);
    for(const obj of editable){
      if(targetSet.has(obj)||kindOf(obj)==='LIGHT')continue;
      const hasCollider=componentHas(obj,'Box Collider')||componentHas(obj,'Sphere Collider')||componentHas(obj,'Capsule Collider')||obj.userData.prefabType==='terrain';
      if(!hasCollider)continue;
      obj.updateWorldMatrix(true,false);
      const pos=obj.getWorldPosition(new THREE.Vector3());
      const rot=obj.getWorldQuaternion(new THREE.Quaternion());
      const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x,pos.y,is2d?0:pos.z).setRotation({x:rot.x,y:rot.y,z:rot.z,w:rot.w}));
      world.createCollider(makeShape(obj),body);
    }
    for(const obj of targets){
      obj.updateWorldMatrix(true,false);
      const pos=obj.getWorldPosition(new THREE.Vector3());
      const rot=obj.getWorldQuaternion(new THREE.Quaternion());
      let desc=RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,is2d?0:pos.z).setRotation({x:rot.x,y:rot.y,z:rot.z,w:rot.w}).setCanSleep(true);
      desc.setLinearDamping?.(.16);desc.setAngularDamping?.(.28);desc.setCcdEnabled?.(true);
      if(is2d){desc.setEnabledTranslations?.(true,true,false);desc.setEnabledRotations?.(false,false,true);}
      const body=world.createRigidBody(desc);
      world.createCollider(makeShape(obj).setDensity(1),body);
      bodies.push({obj,body});
    }
    const steps=Math.max(60,Math.min(360,Math.round(Number(options.steps)||240)));
    for(let i=0;i<steps;i++){world.step();if(i%30===0)await new Promise(resolve=>requestAnimationFrame(resolve));}
    window.GorbusEngine?.recordHistory?.('Colocar grupo con física');
    for(const {obj,body} of bodies){
      const pos=body.translation();const rot=body.rotation();
      obj.position.set(pos.x,pos.y,is2d?0:pos.z);
      obj.quaternion.set(rot.x,rot.y,rot.z,rot.w);
      if(is2d){obj.rotation.x=0;obj.rotation.y=0;}
      obj.updateMatrixWorld(true);
    }
  }finally{world.free?.();}
  if(selected)updateInspectorValues();
  updateReadout();markDirty();refreshHierarchy();
  log('Colocación con física completada: '+targets.length+' objetos · '+Math.max(60,Math.min(360,Math.round(Number(options.steps)||240)))+' pasos de simulación.','success');
  return targets.length;
}`;
  main = replaceOnce(main, marker, helper + marker, 'batch physics settlement function');

  main = replaceOnce(
    main,
    "  get editable(){return editable;},get selected(){return selected;},get isPlaying(){return isPlaying;}",
    "  get editable(){return editable;},get selected(){return selected;},get selectedObjects(){return [...selectedObjects];},get isPlaying(){return isPlaying;}",
    'public selection collection'
  );
  main = replaceOnce(
    main,
    '  addEditable,createPrimitive,createLight,uniqueName,selectObject,deleteObject,duplicateObject,focusSelection,markDirty,markSaved,log,toast,serializeScene,loadSceneData,updateBodyTransform,updateInspectorValues,updateReadout,resize,setProjectMode,attachToolToObject,',
    '  addEditable,createPrimitive,createLight,uniqueName,selectObject,setObjectSelection,selectAll:()=>setObjectSelection(editable,selected),clearSelection:()=>selectObject(null),autoSettleObjects,deleteObject,duplicateObject,focusSelection,markDirty,markSaved,log,toast,serializeScene,loadSceneData,updateBodyTransform,updateInspectorValues,updateReadout,resize,setProjectMode,attachToolToObject,',
    'public multi-select and batch physics api'
  );
  return main;
}

export function patchGE21Studio(original) {
  if (original.includes('id="geV21WorldSection"') && original.includes('geV21Settle')) return original;
  let studio = original;
  studio = replaceOnce(
    studio,
    '.ge-v2-divider{height:1px;background:var(--border,#303648);margin:2px 0}',
    '.ge-v2-divider{height:1px;background:var(--border,#303648);margin:2px 0}.ge-v21-world-status{font-size:10px;line-height:1.45;color:#8fe0ce}.ge-v21-world-status.warn{color:#f3d28b}.ge-v21-world-status.error{color:#ff9a9a}.ge-v21-world-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.ge-v21-world-actions .wide{grid-column:1/-1}.ge-v21-world-count{font-size:10px;color:var(--text-muted,#aab2c5);font-variant-numeric:tabular-nums}',
    'GE 2.1 world tools styles'
  );

  const testSection = `    <section class="ge-v2-section" id="geV2TestSection">`;
  const worldSection = `    <section class="ge-v2-section" id="geV21WorldSection">
      <div class="ge-v2-head"><span>DISEÑO DE MUNDOS</span><span class="ge-v21-world-count" id="geV21SelectionCount">0 seleccionados</span></div>
      <div class="ge-v2-body">
        <p class="ge-v2-note">Selecciona varios objetos desde Hierarchy con Ctrl/Cmd o Shift. Después puedes seleccionar toda la escena o dejar que Rapier los coloque y estabilice en un cálculo previo, sin iniciar Play.</p>
        <div class="ge-v21-world-actions">
          <button class="ge-v2-btn" id="geV21SelectAll">Seleccionar todo</button>
          <button class="ge-v2-btn" id="geV21ClearSelection">Limpiar selección</button>
          <button class="ge-v2-btn primary wide" id="geV21Settle">✦ Colocar con física</button>
        </div>
        <div class="ge-v21-world-status" id="geV21WorldStatus">Selecciona objetos para preparar su colocación.</div>
      </div>
    </section>
` + testSection;
  studio = replaceOnce(studio, testSection, worldSection, 'world design section insertion');

  const runTestsListener = `  $('geV2RunTests').addEventListener('click', async () => {`;
  const worldListeners = `  const updateWorldTools = () => {
    const count = engine.selectedObjects?.length || 0;
    $('geV21SelectionCount').textContent = count + ' seleccionado' + (count === 1 ? '' : 's');
    $('geV21Settle').disabled = count === 0 || !!engine.isPlaying;
    $('geV21ClearSelection').disabled = count === 0;
  };
  $('geV21SelectAll').addEventListener('click', () => { engine.selectAll?.(); updateWorldTools(); });
  $('geV21ClearSelection').addEventListener('click', () => { engine.clearSelection?.(); updateWorldTools(); });
  $('geV21Settle').addEventListener('click', async () => {
    const button = $('geV21Settle');
    const status = $('geV21WorldStatus');
    const count = engine.selectedObjects?.length || 0;
    if (!count) { status.textContent = 'Selecciona al menos un objeto.'; status.className = 'ge-v21-world-status warn'; return; }
    button.disabled = true; button.textContent = 'Simulando física…';
    status.textContent = 'Preparando cuerpos y simulando el asentamiento…'; status.className = 'ge-v21-world-status';
    try {
      const placed = await engine.autoSettleObjects?.(engine.selectedObjects, { steps: 240 });
      status.textContent = placed + ' objetos colocados. Revisa el resultado y usa Deshacer si quieres volver atrás.';
      status.className = 'ge-v21-world-status';
      engine.toast?.('Colocación por física completada.');
    } catch (error) {
      status.textContent = error?.message || 'No se pudo completar la colocación.';
      status.className = 'ge-v21-world-status error';
      engine.log?.('Colocación con física: ' + status.textContent, 'error');
    } finally { button.textContent = '✦ Colocar con física'; updateWorldTools(); }
  });
  updateWorldTools();
` + runTestsListener;
  studio = replaceOnce(studio, runTestsListener, worldListeners, 'world tools event listeners');

  studio = replaceOnce(
    studio,
    '  function refreshSelection() {\n    const root = getRoot();',
    '  function refreshSelection() {\n    const root = getRoot();\n    const worldCount = $(\'geV21SelectionCount\');\n    if (worldCount) worldCount.textContent = (engine.selectedObjects?.length || 0) + \' seleccionados\';\n    const settleButton = $(\'geV21Settle\');\n    if (settleButton) settleButton.disabled = !(engine.selectedObjects?.length) || !!engine.isPlaying;',
    'selection-driven world tools state'
  );
  return studio;
}