function replaceOnce(source, before, after, label) {
  const at=source.indexOf(before);
  if(at<0||source.indexOf(before,at+before.length)>=0) throw new Error('GE 3.1 patch could not safely locate unique anchor: '+label);
  return source.slice(0,at)+after+source.slice(at+before.length);
}
export function patchGE320Main(original) {
 let main=original;
 if(!main.includes('function installGE320StartScreen()')){
  const installer=[
"function installGE320StartScreen(){",
"  const sidebar=document.querySelector('.start-sidebar');",
"  if(sidebar&&!document.getElementById('ge32NewExperience')){const button=document.createElement('button');button.id='ge32NewExperience';button.type='button';button.className='ge32-new-experience';button.innerHTML='<span>＋</span><small>Nueva<br>experiencia</small>';button.addEventListener('click',()=>showCreateProject('baseplate'));sidebar.prepend(button);}",
"  if(sidebar){const order=['recent','home','projects','templates','archive'];const nodes=order.map(key=>sidebar.querySelector('.start-side-link[data-home-tab='+String.fromCharCode(34)+key+String.fromCharCode(34)+']')).filter(Boolean);const footer=sidebar.querySelector('.sidebar-bottom');nodes.forEach(node=>footer?sidebar.insertBefore(node,footer):sidebar.appendChild(node));const labels={recent:'Recientes',home:'Inicio',projects:'Experiencias',templates:'Plantillas',archive:'Archivo'};for(const [key,label] of Object.entries(labels)){const node=sidebar.querySelector('.start-side-link[data-home-tab='+String.fromCharCode(34)+key+String.fromCharCode(34)+']');if(node){const icon=node.querySelector('span')?.textContent||'•';node.innerHTML='<span>'+icon+'</span><small>'+label+'</small>';}}const version=sidebar.querySelector('.start-version');if(version)version.textContent='3.2.0';}",
"  const section=document.getElementById('homeViewTemplates');const grid=section?.querySelector('.templates-page-grid');",
"  if(section&&grid&&!document.getElementById('ge32TemplateToolbar')){",
"    const toolbar=document.createElement('div');toolbar.id='ge32TemplateToolbar';toolbar.className='ge32-template-toolbar';",
"    toolbar.innerHTML='<div class=\"ge32-filter-group\" role=\"group\" aria-label=\"Filtrar plantillas\"><button class=\"ge32-filter active\" type=\"button\" data-ge32-filter=\"all\" aria-pressed=\"true\">Todo</button><button class=\"ge32-filter\" type=\"button\" data-ge32-filter=\"3d\" aria-pressed=\"false\">3D</button><button class=\"ge32-filter\" type=\"button\" data-ge32-filter=\"2d\" aria-pressed=\"false\">2D</button></div><label class=\"ge32-template-search\"><span>⌕</span><input id=\"ge32TemplateSearch\" type=\"search\" maxlength=\"64\" placeholder=\"Buscar plantillas…\" aria-label=\"Buscar plantillas\"></label><div class=\"ge32-toolbar-right\"><span>GORBUS ENGINE</span><b>3.2.0</b><button type=\"button\" id=\"ge32OpenProject\" title=\"Abrir archivo .gorbus\">↥ Abrir</button></div>';",
"    section.insertBefore(toolbar,grid);toolbar.querySelector('#ge32OpenProject')?.addEventListener('click',()=>document.getElementById('sceneFileInput')?.click());",
"  }",
"  const categories={baseplate:'3d',physics:'3d',fps:'3d',platformer:'3d',empty:'3d','2d-platformer':'2d','2d-empty':'2d'};",
"  const gridCards=[...grid.querySelectorAll('.template-card[data-template]')];gridCards.forEach(card=>{card.dataset.ge32Category=categories[card.dataset.template]||'3d';});",
"  const filters=[...section.querySelectorAll('[data-ge32-filter]')];",
"  const search=document.getElementById('ge32TemplateSearch');",
"  const applyTemplateFilters=()=>{const category=filters.find(button=>button.classList.contains('active'))?.dataset.ge32Filter||'all';const query=(search?.value||'').trim().toLocaleLowerCase();for(const card of grid.querySelectorAll('.template-card[data-template]')){const matchesCategory=category==='all'||card.dataset.ge32Category===category;const matchesText=!query||(card.textContent||'').toLocaleLowerCase().includes(query);card.hidden=!(matchesCategory&&matchesText);}};",
"  filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',active?'true':'false');});applyTemplateFilters();}));",
"  search?.addEventListener('input',applyTemplateFilters);",
"  if(typeof switchReleaseHomeTab==='function')switchReleaseHomeTab('templates');",
"}"
  ].join('\n');
  main=replaceOnce(main,'\nrequestAnimationFrame(animate);\n','\n'+installer+'\ninstallGE320StartScreen();\nrequestAnimationFrame(animate);\n','launcher installer');
 }
 main=main.replaceAll('Gorbus Engine 0.6 listo.','Gorbus Engine 3.2.0 listo.');
 main=main.replaceAll('-- Gorbus Engine 2.1.0 · First Person Controller','-- Gorbus Engine 3.2.0 · First Person Explorer');
 return main;
}
export function patchGE320HTML(original) {
 let html=original;
 html=html.replaceAll('2.1.0','3.2.0');
 html=html.replace('<title>Gorbus Engine 3.2.0 Patched</title>','<title>Gorbus Engine 3.2.0</title>');
 html=html.replace('<title>Gorbus Engine 2.1.0 Patched</title>','<title>Gorbus Engine 3.2.0</title>');
 html=html.replace('<meta name="theme-color" content="#101217" />','<meta name="theme-color" content="#202124" />\n  <meta name="gorbus-engine-version" content="3.2.0" />');
 html=html.replace('Gorbus Engine — editor 3D con física Rapier y scripting Luau.','Gorbus Engine 3.2.0 — editor 2D/3D con física Rapier, Luau, biblioteca de experiencias y plantillas.');
 return html;
}
export function patchGE320CSS(original) {
 const marker='/* GE 3.2.0 — compact experience browser inspired by the supplied template gallery */';
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
".ge32-new-experience{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;min-height:52px;margin:0 0 7px;padding:5px 3px;border:1px solid #3b3c42;border-radius:7px;background:#27282d;color:#eef0f4;font-size:9px;font-weight:650;cursor:pointer}",
".ge32-new-experience>span{font-size:18px;line-height:1;color:#c6baff}",
".ge32-new-experience small{font-size:8px;line-height:1.15}",
".sidebar-bottom{margin-top:auto!important;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:10px;border-top:1px solid #303136;color:#8f929a;font-size:7px;text-align:center}",
".sidebar-bottom .status-dot{display:none}",
".sidebar-bottom .start-version{display:block;color:#a8aab1;font:8px ui-monospace,monospace}",
".start-main{min-width:0;min-height:0;padding:0 27px 28px!important;background:#202124!important;overflow:auto}",
".home-view{max-width:none!important;margin:0!important}",
"#homeViewTemplates .home-welcome-row{display:none!important}",
".ge32-template-toolbar{height:51px;min-height:51px;display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 9px;border-bottom:1px solid #303136}",
".ge32-filter-group{display:flex;align-items:center;gap:5px}",
".ge32-filter{height:27px;padding:0 13px;border:1px solid transparent;border-radius:5px;background:transparent;color:#a8abb2;font-size:9px;font-weight:600;cursor:pointer}",
".ge32-filter:hover{background:#2b2c31;color:#f5f5f7}",
".ge32-filter.active{border-color:#5b5c63;background:#36373d;color:#fff}",
".ge32-toolbar-right{display:flex;align-items:center;gap:8px;color:#a8abb2;font-size:8px;letter-spacing:.08em}",
".ge32-toolbar-right b{color:#d8d1ff;font:700 9px ui-monospace,monospace}",
".ge32-toolbar-right button{height:26px;padding:0 10px;border:1px solid #44464d;border-radius:5px;background:#292a2f;color:#e5e6e9;font-size:8px;cursor:pointer}",
".template-grid.templates-page-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px 13px!important;align-content:start}",
".templates-page-grid .template-card{min-width:0;padding:0!important;overflow:hidden;border:1px solid #34363c!important;border-radius:5px!important;background:#28292e!important;box-shadow:none!important;text-align:left;transition:border-color .15s,transform .15s}",
".templates-page-grid .template-card:hover{transform:translateY(-2px);border-color:#8e83dc!important;background:#2c2d33!important}",
".templates-page-grid .template-card[hidden]{display:none!important}",
".templates-page-grid .template-art{height:auto!important;aspect-ratio:16/9;border:0!important;border-radius:0!important}",
".templates-page-grid .template-card-info{min-height:47px;padding:7px 9px!important;display:flex;align-items:center;justify-content:space-between;gap:5px}",
".templates-page-grid .template-card-info strong{display:block;overflow:hidden;color:#e6e7ea;font-size:10px;font-weight:650;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}",
".templates-page-grid .template-card-info small{display:block!important;max-width:100%;margin-top:3px;overflow:hidden;color:#a6a9b2;font-size:8px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}",
".templates-page-grid .template-type{flex:0 0 auto;color:#92959d;font-size:7px}",
"#homeViewTemplates{padding-bottom:30px}",
"#homeViewProjects .home-welcome-row,#homeViewRecent .home-welcome-row,#homeViewArchive .home-welcome-row{margin-top:20px}",
"@media(max-width:1100px){.start-layout{grid-template-columns:96px minmax(0,1fr)!important}.start-sidebar{width:96px;min-width:96px}.start-main{padding-left:18px!important;padding-right:18px!important}.template-grid.templates-page-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}",
"@media(max-width:760px){.template-grid.templates-page-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.ge32-template-toolbar{height:46px}.ge32-filter{padding:0 8px;font-size:8px}.ge32-toolbar-right>span{display:none}}",
"@media(max-width:540px){.start-layout{grid-template-columns:68px minmax(0,1fr)!important}.start-sidebar{width:68px;min-width:68px;padding:8px 4px!important}.start-sidebar .start-side-link{height:45px;min-height:45px}.start-main{padding-left:10px!important;padding-right:10px!important}.template-grid.templates-page-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.ge32-filter{padding:0 6px}.ge32-toolbar-right b{display:none}}"

,".ge32-template-search{min-width:150px;max-width:260px;flex:1;display:flex;align-items:center;gap:8px;height:29px;padding:0 10px;border:1px solid #3c3e45;border-radius:6px;background:#27282d;color:#aeb1b9}",
".ge32-template-search>span{font-size:15px;line-height:1}",
".ge32-template-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#f1f2f4;font:inherit;font-size:9px}",
".ge32-template-search input::placeholder{color:#858891}",
".ge32-template-search:focus-within{border-color:#8e83dc;box-shadow:0 0 0 2px #8e83dc22}",
"@media(max-width:760px){.ge32-template-search{max-width:180px}.ge32-toolbar-right>span{display:none}}",].join('\n');
 return original+'\n'+marker+'\n'+css+'\n';
}
