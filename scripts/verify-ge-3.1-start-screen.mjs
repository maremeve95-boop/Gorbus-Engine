import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { patchGE310Main, patchGE310HTML, patchGE310CSS } from './ge-3.1-start-screen.mjs';
const main=readFileSync('src/main.js','utf8');
const html=readFileSync('index.html','utf8');
const css=readFileSync('styles.css','utf8');
const checks=[
 ['package output contains the GE 3.1 launcher version',html.includes('Gorbus Engine 3.1.0')&&!html.includes('2.1.0')],
 ['home screen includes the compact template filters',main.includes('ge31TemplateToolbar')&&main.includes('data-ge31-filter')],
 ['initial page opens the template gallery',main.includes("switchReleaseHomeTab('templates')")],
 ['new experience button opens the create-project modal',main.includes('ge31NewExperience')&&main.includes("showCreateProject('baseplate')")],
 ['opening a project file remains available',main.includes('ge31OpenProject')&&main.includes('sceneFileInput')],
 ['ten new templates have scene builders',[
  'classicBaseplate','flatTerrain','village','castle','suburban','pirateIsland','modernCity','startingPlace','classicObby','racing'
 ].every(name=>main.includes(name))],
 ['template filters include blank, gameplay and themed groups',[
  'data-ge31-filter',"'blank'","'gameplay'","'themed'"
 ].every(name=>main.includes(name))],
 ['new templates invoke real scene construction',main.includes('createGE310TemplateWorld(currentTemplate)')&&main.includes('function createGE310TemplateWorld(template)')],
 ['launcher layout uses a narrow left rail',css.includes('grid-template-columns:110px minmax(0,1fr)')&&css.includes('.ge31-new-experience')],
 ['template cards reflow for tablet and mobile',css.includes('@media(max-width:760px)')&&css.includes('@media(max-width:540px)')],
 ['page title and meta version are both 3.1.0',html.includes('<title>Gorbus Engine 3.1.0</title>')&&html.includes('name="gorbus-engine-version" content="3.1.0"')],
 ['HTML and CSS patchers are idempotent',patchGE310HTML(patchGE310HTML('<title>Gorbus Engine 2.1.0 Patched</title>'))===patchGE310HTML('<title>Gorbus Engine 2.1.0 Patched</title>')&&patchGE310CSS(patchGE310CSS(''))===patchGE310CSS('')]
];
for(const [label,ok] of checks){console.log((ok?'PASS ':'FAIL ')+label);assert.ok(ok,'GE 3.1 verification failed: '+label);}
assert.ok(patchGE310Main(main)===main,'Main patch should not modify a second time after prepare has run.');
console.log('\nGE 3.1.0 launcher: '+checks.length+'/'+checks.length+' checks passed.');
