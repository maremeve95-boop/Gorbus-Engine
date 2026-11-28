import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { patchGE320Main, patchGE320HTML, patchGE320CSS } from './ge-3.2-launcher.mjs';

const main=readFileSync('src/main.js','utf8');
const html=readFileSync('index.html','utf8');
const css=readFileSync('styles.css','utf8');
const removedKeys=['classicBaseplate','flatTerrain','village','castle','suburban','pirateIsland','modernCity','startingPlace','classicObby','racing'];
const checks=[
 ['page title and metadata identify Gorbus Engine 3.2.0',html.includes('<title>Gorbus Engine 3.2.0</title>')&&html.includes('name="gorbus-engine-version" content="3.2.0"')],
 ['the ten 3.1 starter-template keys are absent from generated editor code',removedKeys.every(key=>!main.includes(key))],
 ['legacy template scene constructors are absent',!main.includes('createGE310TemplateWorld')&&!main.includes('addGE310House')&&!main.includes('addGE310Tree')],
 ['launcher still creates a new project from the base template',main.includes('ge32NewExperience')&&main.includes("showCreateProject('baseplate')")],
 ['the gallery preserves opening a .gorbus project',main.includes('ge32OpenProject')&&main.includes('sceneFileInput')],
 ['the gallery adds a searchable template field',main.includes('ge32TemplateSearch')&&main.includes("addEventListener('input',applyTemplateFilters)")],
 ['the gallery has Todo, 3D and 2D filters',main.includes('data-ge32-filter="all"')&&main.includes('data-ge32-filter="3d"')&&main.includes('data-ge32-filter="2d"')],
 ['the seven original template types are still categorised',[
  "baseplate:'3d'","physics:'3d'","fps:'3d'","platformer:'3d'","empty:'3d'","'2d-platformer':'2d'","'2d-empty':'2d'"
 ].every(item=>main.includes(item))],
 ['filters and search combine instead of overriding each other',main.includes('matchesCategory=')&&main.includes('matchesText=')&&main.includes('applyTemplateFilters();')],
 ['the sidebar places the version footer after navigation',main.includes('sidebar.insertBefore(node,footer)')],
 ['template cards use wide previews and readable descriptions',css.includes('aspect-ratio:16/9')&&css.includes('font-size:10px;font-weight:650')&&css.includes('.templates-page-grid .template-card-info small{display:block')],
 ['template search has visible focus feedback and a responsive width',css.includes('.ge32-template-search:focus-within')&&css.includes('@media(max-width:760px)')],
 ['old ten-template decorative artwork is not emitted',!['.art-classic','.art-terrain','.art-village','.art-castle','.art-suburban','.art-pirate','.art-city','.art-starting','.art-obby','.art-racing'].some(key=>css.includes(key))],
 ['the start screen uses the compact responsive sidebar',css.includes('grid-template-columns:110px minmax(0,1fr)')&&css.includes('@media(max-width:540px)')],
 ['the launcher patch remains idempotent',patchGE320Main(main)===main&&patchGE320HTML(html)===html&&patchGE320CSS(css)===css]
];
for(const [label,ok] of checks){console.log((ok?'PASS ':'FAIL ')+label);assert.ok(ok,'GE 3.2.0 check failed: '+label);}
console.log('\nGE 3.2.0 launcher: '+checks.length+'/'+checks.length+' checks passed.');
