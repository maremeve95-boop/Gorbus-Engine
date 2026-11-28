function replaceOnce(source, before, after, label) {
  const at=source.indexOf(before);
  if(at<0||source.indexOf(before,at+before.length)>=0) throw new Error('GE 3.1 patch could not safely locate unique anchor: '+label);
  return source.slice(0,at)+after+source.slice(at+before.length);
}
const templateCatalogAdditions=[
"  classicBaseplate:{name:'Classic Baseplate',description:'Una base clásica con punto de inicio.',art:'art-classic',category:'blank'},",
"  flatTerrain:{name:'Flat Terrain',description:'Paisaje procedural suave para construir.',art:'art-terrain',category:'themed'},",
"  village:{name:'Village',description:'Pequeño pueblo con casas y caminos.',art:'art-village',category:'themed'},",
"  castle:{name:'Castle',description:'Murallas, torres y patio central.',art:'art-castle',category:'themed'},",
"  suburban:{name:'Suburban',description:'Barrio residencial y carretera.',art:'art-suburban',category:'themed'},",
"  pirateIsland:{name:'Pirate Island',description:'Isla, embarcadero y barco decorativo.',art:'art-pirate',category:'themed'},",
"  modernCity:{name:'Modern City',description:'Bloques urbanos y avenidas.',art:'art-city',category:'themed'},",
"  startingPlace:{name:'Starting Place',description:'Escena inicial con punto de aparición.',art:'art-starting',category:'blank'},",
"  classicObby:{name:'Classic Obby',description:'Ruta de plataformas y saltos.',art:'art-obby',category:'gameplay'},",
"  racing:{name:'Racing',description:'Circuito de pruebas con vehículo de muestra.',art:'art-racing',category:'gameplay'}"
].join('\n');

const templateWorldHelpers=[
"const GE310_TEMPLATE_KEYS=new Set(['classicBaseplate','flatTerrain','village','castle','suburban','pirateIsland','modernCity','startingPlace','classicObby','racing']);",
"function addGE310Terrain(name,positionY=-.65){const geometry=createGETerrainGeometry();const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.94,metalness:0});const terrain=new THREE.Mesh(geometry,material);terrain.position.set(0,positionY,0);terrain.scale.set(1.35,1,1.35);terrain.receiveShadow=true;terrain.userData.gorbusType='TERRAIN';terrain.userData.prefabType='terrain';terrain.userData.components=['Mesh Filter','Mesh Renderer'];terrain.userData.physics={type:'fixed'};return addEditable(terrain,name,'MESH',{components:terrain.userData.components});}",
"function addGE310House(prefix,x,z,wallColor='#b9a17c',roofColor='#6b4650'){addTemplateBlock(prefix+' House',[x,1,z],wallColor,[2.8,2,2.5],false);const roof=new THREE.Mesh(new THREE.ConeGeometry(2.12,1.28,4),makeMaterial(roofColor));roof.position.set(x,2.62,z);roof.rotation.y=Math.PI/4;roof.userData.gorbusType='MESH';roof.userData.components=['Mesh Filter','Mesh Renderer'];addEditable(roof,prefix+' Roof','MESH',{components:roof.userData.components});addTemplateBlock(prefix+' Door',[x,.62,z+1.27],'#49382e',[.62,1.2,.12],false);addTemplateBlock(prefix+' Window L',[x-.82,1.24,z+1.28],'#8bc2d2',[.46,.42,.1],false);addTemplateBlock(prefix+' Window R',[x+.82,1.24,z+1.28],'#8bc2d2',[.46,.42,.1],false);}",
"function addGE310Tree(prefix,x,z){addTemplateBlock(prefix+' Trunk',[x,.85,z],'#79563a',[.32,1.7,.32],false);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.98,1),makeMaterial('#4d8c65'));crown.position.set(x,2.05,z);crown.userData.gorbusType='MESH';crown.userData.components=['Mesh Filter','Mesh Renderer'];addEditable(crown,prefix+' Crown','MESH',{components:crown.userData.components});}",
"function addGE310Spawn(x,y,z){const pad=new THREE.Mesh(new THREE.CylinderGeometry(.76,.76,.12,32),makeMaterial('#65b7a2'));pad.position.set(x,y,z);pad.userData.gorbusType='CYLINDER';pad.userData.components=['Mesh Filter','Mesh Renderer','Cylinder Collider'];pad.userData.physics={type:'fixed'};return addEditable(pad,'Spawn Point','MESH',{components:pad.userData.components});}",
"function createGE310TemplateWorld(template){const ground=(name='Ground',size=30)=>{const floor=addTemplateFloor(name);floor.scale.set(size/20,1,size/20);return floor;};const block=(name,x,y,z,color,sx,sy,sz,dynamic=false)=>addTemplateBlock(name,[x,y,z],color,[sx,sy,sz],dynamic);",
"if(template==='classicBaseplate'){ground('Classic Baseplate',32);block('Spawn Platform',0,.08,0,'#5d7b6f',2.4,.16,2.4,false);addGE310Spawn(0,.22,0);createLight();return;}",
"if(template==='flatTerrain'){ground('Terrain Collision Base',34);addGE310Terrain('Procedural Flat Terrain',-.35);addGE310Tree('Tree A',-7,.5);addGE310Tree('Tree B',6,-5);addGE310Tree('Tree C',8,7);createLight();return;}",
"if(template==='village'){ground('Village Ground',34);block('Village Road',0,.015,0,'#4e5056',3,.05,30,false);addGE310House('North House',-5,-5);addGE310House('East House',5,-3,'#c8b58c','#765445');addGE310House('South House',-5,6,'#a8b8a0','#665548');addGE310Tree('Village Tree A',1,-7);addGE310Tree('Village Tree B',8,6);createLight();return;}",
"if(template==='castle'){ground('Castle Courtyard',26);block('North Wall',0,2,-10,'#777e8a',20,4,.65,false);block('South Wall',0,2,10,'#777e8a',20,4,.65,false);block('West Wall',-10,2,0,'#777e8a',.65,4,20,false);block('East Wall',10,2,0,'#777e8a',.65,4,20,false);for(const [x,z] of [[-9,-9],[9,-9],[-9,9],[9,9]]){block('Castle Tower '+x+' '+z,x,3,z,'#9aa0aa',2.2,6,2.2,false);const cap=new THREE.Mesh(new THREE.ConeGeometry(1.55,2,4),makeMaterial('#59647b'));cap.position.set(x,7,z);cap.rotation.y=Math.PI/4;cap.userData.components=['Mesh Filter','Mesh Renderer'];addEditable(cap,'Tower Roof','MESH',{components:cap.userData.components});}block('Keep',0,1.5,-3,'#b5a58b',5,3,5,false);block('Gate',0,1.5,9,'#514238',3,3,.5,false);createLight();return;}",
"if(template==='suburban'){ground('Residential Ground',34);block('Main Road',0,.02,0,'#42464d',5,.06,34,false);block('Sidewalk L',-3,.07,0,'#a5a7a4',1,.12,34,false);block('Sidewalk R',3,.07,0,'#a5a7a4',1,.12,34,false);addGE310House('Blue Home',-8,-7,'#8fa8b6','#4c5369');addGE310House('Sand Home',8,-7,'#c7b38f','#7c5146');addGE310House('Green Home',-8,7,'#9eb39a','#5a654f');addGE310House('Gray Home',8,7,'#b7b9bf','#4e596c');addGE310Tree('Street Tree A',-4,-10);addGE310Tree('Street Tree B',4,10);createLight();return;}",
"if(template==='pirateIsland'){ground('Island Sea Floor',36);addGE310Terrain('Island Terrain',-.6);block('Dock',0,.15,9,'#8d6743',7,.28,2.2,false);block('Boat Hull',0,.65,6,'#65432e',4.8,.85,1.8,false);block('Boat Deck',0,1.1,6,'#a27a4d',3.9,.12,1.3,false);block('Mast',0,3.2,6,'#725137',.18,4,.18,false);block('Sail',.95,3.1,6,'#e8e2ce',1.8,2.2,.12,false);addGE310Tree('Palm A',-7,1);addGE310Tree('Palm B',7,-4);createLight();return;}",
"if(template==='modernCity'){ground('City Ground',40);block('Avenue',0,.04,0,'#42464f',5,.08,40,false);block('Cross Street',0,.05,0,'#4c505a',40,.09,4,false);const buildings=[[-10,4,-10,5,8,5],[-10,6,1,5,12,5],[10,5,-11,5,10,5],[10,8,3,5,16,5],[-5,3,12,4,6,4],[7,4,13,4,8,4]];buildings.forEach((v,i)=>{block('City Building '+(i+1),v[0],v[1],v[2],['#74869a','#8e8d9f','#647b84'][i%3],v[3],v[4],v[5],false);});createLight();return;}",
"if(template==='startingPlace'){ground('Starting Ground',24);block('Welcome Platform',0,.18,0,'#6d87a8',5,.35,5,false);addGE310Spawn(0,.42,0);block('Welcome Pillar L',-5,1.6,-4,'#8997b0',.7,3,.7,false);block('Welcome Pillar R',5,1.6,-4,'#8997b0',.7,3,.7,false);createLight();return;}",
"if(template==='classicObby'){ground('Obby Start Ground',30);for(let i=0;i<8;i++){const x=-9+i*2.5,y=.5+i*.62,z=(i%2===0)?-2:2;block('Obby Step '+(i+1),x,y,z,i%2===0?'#8a79dc':'#4aa993',2,.35,2,false);}block('Obby Finish',11,5.6,0,'#e1bd68',3,.4,3,false);addGE310Spawn(-11,.4,0);createLight();return;}",
"if(template==='racing'){ground('Racing Test Ground',40);block('Road North',0,.03,-10,'#41464f',28,.1,4,false);block('Road South',0,.03,10,'#41464f',28,.1,4,false);block('Road West',-12,.03,0,'#41464f',4,.1,20,false);block('Road East',12,.03,0,'#41464f',4,.1,20,false);for(let i=0;i<6;i++)block('Track Marker '+(i+1),-10+i*4,.14,-10,'#e3cf7a',.25,.12,.25,false);block('Vehicle Chassis',0,.65,0,'#4f8bc6',2.2,.55,3.5,true);block('Vehicle Cabin',0,1.25,-.2,'#9bc7d7',1.5,.7,1.6,false);createLight();return;}",
"}"
].join('\n');

export function patchGE310Main(original) {
 let main=original;
 if(!main.includes('classicBaseplate:{name:')){
  const anchor="  empty:{name:'Escena vacía',description:'Sin objetos de juego, solo el editor.',art:'art-empty'}\n};";
  main=replaceOnce(main,anchor,"  empty:{name:'Escena vacía',description:'Sin objetos de juego, solo el editor.',art:'art-empty',category:'blank'},\n"+templateCatalogAdditions+"\n};",'template catalog');
 }
 if(!main.includes('function createGE310TemplateWorld(template)')) main=replaceOnce(main,'function createProjectFromTemplate(name,template){',templateWorldHelpers+'\nfunction createProjectFromTemplate(name,template){','template scene builders');
 if(!main.includes('createGE310TemplateWorld(currentTemplate)')){
  const anchor="  }\n  selectObject(editable[0]||null);markSaved();persistProjectRecord();openEditor();";
  main=replaceOnce(main,anchor,"  }else if(GE310_TEMPLATE_KEYS.has(currentTemplate)){\n    createGE310TemplateWorld(currentTemplate);\n  }\n  selectObject(editable[0]||null);markSaved();persistProjectRecord();openEditor();",'template builder dispatch');
 }
 if(!main.includes('function installGE310StartScreen()')){
  const installer=[
"function installGE310StartScreen(){",
"  const sidebar=document.querySelector('.start-sidebar');",
"  if(sidebar&&!document.getElementById('ge31NewExperience')){const button=document.createElement('button');button.id='ge31NewExperience';button.type='button';button.className='ge31-new-experience';button.innerHTML='<span>＋</span><small>Nueva<br>experiencia</small>';button.addEventListener('click',()=>showCreateProject('baseplate'));sidebar.prepend(button);}",
"  if(sidebar){const order=['recent','home','projects','templates','archive'];const nodes=order.map(key=>sidebar.querySelector('.start-side-link[data-home-tab='+String.fromCharCode(34)+key+String.fromCharCode(34)+']')).filter(Boolean);const footer=sidebar.querySelector('.sidebar-bottom');nodes.forEach(node=>footer?sidebar.insertBefore(node,footer):sidebar.appendChild(node));const labels={recent:'Recientes',home:'Inicio',projects:'Experiencias',templates:'Plantillas',archive:'Archivo'};for(const [key,label] of Object.entries(labels)){const node=sidebar.querySelector('.start-side-link[data-home-tab='+String.fromCharCode(34)+key+String.fromCharCode(34)+']');if(node){const icon=node.querySelector('span')?.textContent||'•';node.innerHTML='<span>'+icon+'</span><small>'+label+'</small>';}}const version=sidebar.querySelector('.start-version');if(version)version.textContent='3.1.0';}",
"  const section=document.getElementById('homeViewTemplates');const grid=section?.querySelector('.templates-page-grid');",
"  if(section&&grid&&!document.getElementById('ge31TemplateToolbar')){const toolbar=document.createElement('div');toolbar.id='ge31TemplateToolbar';toolbar.className='ge31-template-toolbar';toolbar.innerHTML='<div class=\"ge31-filter-group\" role=\"group\" aria-label=\"Filtrar plantillas\"><button class=\"ge31-filter active\" type=\"button\" data-ge31-filter=\"all\" aria-pressed=\"true\">Todo</button><button class=\"ge31-filter\" type=\"button\" data-ge31-filter=\"blank\" aria-pressed=\"false\">Vacío</button><button class=\"ge31-filter\" type=\"button\" data-ge31-filter=\"gameplay\" aria-pressed=\"false\">Jugabilidad</button><button class=\"ge31-filter\" type=\"button\" data-ge31-filter=\"themed\" aria-pressed=\"false\">Temáticos</button></div><div class=\"ge31-toolbar-right\"><span>GORBUS ENGINE</span><b>3.1.0</b><button type=\"button\" id=\"ge31OpenProject\" title=\"Abrir archivo .gorbus\">↥ Abrir</button></div>';section.insertBefore(toolbar,grid);toolbar.querySelector('#ge31OpenProject')?.addEventListener('click',()=>document.getElementById('sceneFileInput')?.click());}",
"  const definitions=[['classicBaseplate','Baseplate clásico','Una base limpia para empezar.','art-classic','blank'],['flatTerrain','Flat Terrain','Paisaje procedural de colinas.','art-terrain','themed'],['village','Village','Casas, árboles y calles.','art-village','themed'],['castle','Castle','Murallas, torres y patio.','art-castle','themed'],['suburban','Suburban','Barrio residencial.','art-suburban','themed'],['pirateIsland','Pirate Island','Isla y embarcadero.','art-pirate','themed'],['modernCity','Modern City','Avenidas y edificios.','art-city','themed'],['startingPlace','Starting Place','Punto de inicio y plataforma.','art-starting','blank'],['classicObby','Classic Obby','Ruta de plataformas.','art-obby','gameplay'],['racing','Racing','Circuito de pruebas.','art-racing','gameplay']];",
"  const categories={baseplate:'blank',empty:'blank','2d-empty':'blank',startingPlace:'blank',classicBaseplate:'blank',physics:'gameplay',fps:'gameplay',platformer:'gameplay','2d-platformer':'gameplay',classicObby:'gameplay',racing:'gameplay',flatTerrain:'themed',village:'themed',castle:'themed',suburban:'themed',pirateIsland:'themed',modernCity:'themed'};",
"  const gridCards=[...grid.querySelectorAll('.template-card[data-template]')];gridCards.forEach(card=>{card.dataset.ge31Category=categories[card.dataset.template]||'gameplay';});",
"  for(const [key,title,description,art,category] of definitions){if(grid.querySelector('.template-card[data-template='+String.fromCharCode(34)+key+String.fromCharCode(34)+']'))continue;const card=document.createElement('button');card.type='button';card.className='template-card ge31-template-card';card.dataset.template=key;card.dataset.ge31Category=category;card.innerHTML='<div class=\"template-art '+art+'\" aria-hidden=\"true\"></div><div class=\"template-card-info\"><div><strong>'+title+'</strong><small>'+description+'</small></div><span class=\"template-type\">3D</span></div>';card.addEventListener('click',()=>showCreateProject(key));grid.appendChild(card);}",
"  const filters=[...section.querySelectorAll('[data-ge31-filter]')];filters.forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.ge31Filter||'all';filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',active?'true':'false');});for(const card of grid.querySelectorAll('.template-card[data-template]'))card.hidden=value!=='all'&&card.dataset.ge31Category!==value;}));",
"  if(typeof switchReleaseHomeTab==='function')switchReleaseHomeTab('templates');",
"}"
  ].join('\n');
  main=replaceOnce(main,'\nrequestAnimationFrame(animate);\n','\n'+installer+'\ninstallGE310StartScreen();\nrequestAnimationFrame(animate);\n','launcher installer');
 }
 main=main.replaceAll('Gorbus Engine 0.6 listo.','Gorbus Engine 3.1.0 listo.');
 main=main.replaceAll('-- Gorbus Engine 2.1.0 · First Person Controller','-- Gorbus Engine 3.1.0 · First Person Explorer');
 return main;
}
export function patchGE310HTML(original) {
 let html=original;
 html=html.replaceAll('2.1.0','3.1.0');
 html=html.replace('<title>Gorbus Engine 3.1.0 Patched</title>','<title>Gorbus Engine 3.1.0</title>');
 html=html.replace('<title>Gorbus Engine 2.1.0 Patched</title>','<title>Gorbus Engine 3.1.0</title>');
 html=html.replace('<meta name="theme-color" content="#101217" />','<meta name="theme-color" content="#202124" />\n  <meta name="gorbus-engine-version" content="3.1.0" />');
 html=html.replace('Gorbus Engine — editor 3D con física Rapier y scripting Luau.','Gorbus Engine 3.1.0 — editor 2D/3D con física Rapier, Luau, biblioteca de experiencias y plantillas.');
 return html;
}
export function patchGE310CSS(original) {
 const marker='/* GE 3.1.0 — compact experience browser inspired by the supplied template gallery */';
 if(original.includes(marker))return original;
 const css=[
".start-screen{background:#202124!important;color:#e4e6eb!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif}",
".start-topbar,.start-right-rail{display:none!important}",
".start-layout{grid-template-columns:110px minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important}",
".start-sidebar{width:110px;min-width:110px;padding:12px 7px 10px!important;gap:5px;background:#1b1c1f!important;border-right:1px solid #303136!important}",
".start-sidebar>.sidebar-label,.start-sidebar>.sidebar-divider,.start-sidebar>.start-resource{display:none!important}",
".start-sidebar .start-side-link{width:100%!important;height:48px;min-height:48px;margin:0!important;padding:5px 2px!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0!important;border-radius:6px;color:#b8bbc2;font-size:9px;text-align:center;line-height:1.15}",
".start-sidebar .start-side-link>span{width:auto;margin:0;color:#d0d2d7;font-size:16px;line-height:1}",
".start-sidebar .start-side-link small{font-size:8px;font-weight:500;white-space:nowrap}",
".start-sidebar .start-side-link:hover{background:#2b2c31!important;color:#fff}",
".start-sidebar .start-side-link.active{background:#303137!important;color:#fff!important;border-left:0!important}",
".start-sidebar .start-side-link.active>span{color:#fff!important}",
".ge31-new-experience{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;min-height:52px;margin:0 0 7px;padding:5px 3px;border:1px solid #3b3c42;border-radius:7px;background:#27282d;color:#eef0f4;font-size:9px;font-weight:650;cursor:pointer}",
".ge31-new-experience>span{font-size:18px;line-height:1;color:#c6baff}",
".ge31-new-experience small{font-size:8px;line-height:1.15}",
".sidebar-bottom{margin-top:auto!important;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:10px;border-top:1px solid #303136;color:#8f929a;font-size:7px;text-align:center}",
".sidebar-bottom .status-dot{display:none}",
".sidebar-bottom .start-version{display:block;color:#a8aab1;font:8px ui-monospace,monospace}",
".start-main{min-width:0;min-height:0;padding:0 27px 28px!important;background:#202124!important;overflow:auto}",
".home-view{max-width:none!important;margin:0!important}",
"#homeViewTemplates .home-welcome-row{display:none!important}",
".ge31-template-toolbar{height:51px;min-height:51px;display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 9px;border-bottom:1px solid #303136}",
".ge31-filter-group{display:flex;align-items:center;gap:5px}",
".ge31-filter{height:27px;padding:0 13px;border:1px solid transparent;border-radius:5px;background:transparent;color:#a8abb2;font-size:9px;font-weight:600;cursor:pointer}",
".ge31-filter:hover{background:#2b2c31;color:#f5f5f7}",
".ge31-filter.active{border-color:#5b5c63;background:#36373d;color:#fff}",
".ge31-toolbar-right{display:flex;align-items:center;gap:8px;color:#a8abb2;font-size:8px;letter-spacing:.08em}",
".ge31-toolbar-right b{color:#d8d1ff;font:700 9px ui-monospace,monospace}",
".ge31-toolbar-right button{height:26px;padding:0 10px;border:1px solid #44464d;border-radius:5px;background:#292a2f;color:#e5e6e9;font-size:8px;cursor:pointer}",
".template-grid.templates-page-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px 13px!important;align-content:start}",
".templates-page-grid .template-card{min-width:0;padding:0!important;overflow:hidden;border:1px solid #34363c!important;border-radius:5px!important;background:#28292e!important;box-shadow:none!important;text-align:left;transition:border-color .15s,transform .15s}",
".templates-page-grid .template-card:hover{transform:translateY(-2px);border-color:#8e83dc!important;background:#2c2d33!important}",
".templates-page-grid .template-card[hidden]{display:none!important}",
".templates-page-grid .template-art{height:auto!important;aspect-ratio:1.42/1;border:0!important;border-radius:0!important}",
".templates-page-grid .template-card-info{min-height:28px;padding:5px 7px!important;display:flex;align-items:center;justify-content:space-between;gap:5px}",
".templates-page-grid .template-card-info strong{display:block;overflow:hidden;color:#e6e7ea;font-size:8px;font-weight:600;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}",
".templates-page-grid .template-card-info small{display:none!important}",
".templates-page-grid .template-type{flex:0 0 auto;color:#92959d;font-size:7px}",
"#homeViewTemplates{padding-bottom:30px}",
"#homeViewProjects .home-welcome-row,#homeViewRecent .home-welcome-row,#homeViewArchive .home-welcome-row{margin-top:20px}",
".art-classic{background:linear-gradient(180deg,#73b8db 0%,#8bc7df 52%,#6a7685 53%,#4b5560 100%)}",
".art-classic:after{content:'';position:absolute;left:15%;right:15%;bottom:18%;height:17%;background:repeating-linear-gradient(90deg,#66717d 0 24px,#8e9ba8 25px 27px);transform:perspective(100px) rotateX(28deg)}",
".art-terrain{background:linear-gradient(180deg,#80c4e6 0%,#bbd8df 55%,#6f9a59 56%,#477044 100%);overflow:hidden}",
".art-terrain:after{content:'';position:absolute;left:-10%;right:-10%;bottom:-22%;height:62%;border-radius:50% 50% 0 0;background:linear-gradient(160deg,#7ba66b,#456f4c);transform:rotate(-7deg);box-shadow:0 -16px 0 #91b77c}",
".art-village{background:linear-gradient(180deg,#82c5e8 0%,#c2e0e8 58%,#66845a 59%,#435b43 100%)}",
".art-village:before,.art-suburban:before{content:'';position:absolute;left:14%;bottom:17%;width:26%;height:36%;background:#c9b394;clip-path:polygon(0 25%,50% 0,100% 25%,100% 100%,0 100%);box-shadow:80px 0 0 #b8a180}",
".art-village:after,.art-suburban:after{content:'';position:absolute;left:21%;bottom:18%;width:12%;height:16%;background:#6e4a36;box-shadow:77px 0 0 #6e4a36}",
".art-castle{background:linear-gradient(180deg,#83b8dc 0%,#b5d3df 57%,#526d54 58%,#35483d 100%)}",
".art-castle:before{content:'';position:absolute;left:23%;bottom:16%;width:54%;height:43%;background:#858a93;clip-path:polygon(0 24%,15% 24%,15% 0,30% 0,30% 24%,70% 24%,70% 0,85% 0,85% 24%,100% 24%,100% 100%,0 100%)}",
".art-castle:after{content:'';position:absolute;left:47%;bottom:16%;width:14%;height:22%;background:#4f4240}",
".art-suburban{background:linear-gradient(180deg,#83c3df 0%,#c4dbe2 56%,#697b60 57%,#485b45 100%)}",
".art-pirate{background:linear-gradient(180deg,#69afd5 0%,#a7d3e2 52%,#287d9d 53%,#15516e 100%)}",
".art-pirate:before{content:'';position:absolute;left:18%;right:18%;bottom:14%;height:39%;background:#bda16e;clip-path:polygon(0 45%,18% 18%,45% 0,72% 18%,100% 52%,82% 100%,18% 100%)}",
".art-pirate:after{content:'';position:absolute;left:47%;bottom:31%;width:5%;height:34%;background:#624a32;box-shadow:0 0 0 18px #f0e9d8}",
".art-city{background:linear-gradient(180deg,#86c6e8 0%,#b6d6e5 56%,#65717c 57%,#3f4852 100%)}",
".art-city:before{content:'';position:absolute;left:8%;bottom:14%;width:14%;height:54%;background:#6d8499;box-shadow:36px 12px 0 #8395a4,74px -8px 0 #687b91,110px 16px 0 #8e9ca8,146px -3px 0 #63798d}",
".art-city:after{content:'';position:absolute;left:12%;right:12%;bottom:14%;height:5%;background:#d2d7da;opacity:.65}",
".art-starting{background:linear-gradient(180deg,#70b6db 0%,#a6d6e7 56%,#6c7d80 57%,#414e55 100%)}",
".art-starting:after{content:'';position:absolute;left:30%;right:30%;bottom:18%;height:18%;background:#b1bac1;border:2px solid #e8edf1;transform:perspective(90px) rotateX(30deg);box-shadow:0 0 20px #fff5}",
".art-obby{background:linear-gradient(180deg,#82c3e2,#9cc8d8 55%,#465467 56%,#2d3747 100%)}",
".art-obby:before{content:'';position:absolute;left:12%;bottom:18%;width:22%;height:15%;background:#879db0;box-shadow:45px -23px 0 #9c8bce,90px -44px 0 #5fbcaa,135px -65px 0 #e7c879}",
".art-racing{background:linear-gradient(180deg,#74b7dc 0%,#acd6e0 55%,#46614f 56%,#34463b 100%)}",
".art-racing:after{content:'';position:absolute;left:17%;right:17%;bottom:16%;height:38%;border:10px solid #4b5057;border-radius:50%;transform:rotate(-16deg);box-shadow:inset 0 0 0 2px #e5dfc2}",
"@media(max-width:1100px){.start-layout{grid-template-columns:96px minmax(0,1fr)!important}.start-sidebar{width:96px;min-width:96px}.start-main{padding-left:18px!important;padding-right:18px!important}.template-grid.templates-page-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}",
"@media(max-width:760px){.template-grid.templates-page-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.ge31-template-toolbar{height:46px}.ge31-filter{padding:0 8px;font-size:8px}.ge31-toolbar-right>span{display:none}}",
"@media(max-width:540px){.start-layout{grid-template-columns:68px minmax(0,1fr)!important}.start-sidebar{width:68px;min-width:68px;padding:8px 4px!important}.start-sidebar .start-side-link{height:45px;min-height:45px}.start-main{padding-left:10px!important;padding-right:10px!important}.template-grid.templates-page-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.ge31-filter{padding:0 6px}.ge31-toolbar-right b{display:none}}"
].join('\n');
 return original+'\n'+marker+'\n'+css+'\n';
}
