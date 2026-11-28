import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'gorbus-diagnose-'));
try{
 const file=join(dir,'fixture.gorbus');
 const scene={format:'GorbusScene',objects:[
  {name:'Duplicate',position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],physics:{type:'dynamic'},components:[]},
  {name:'Duplicate',position:[0,'bad',0],rotation:[0,0,0],scale:[1,1,1],type:'CAPSULE',components:[]}
 ],files:{'Scripts/empty.luau':' '}};
 writeFileSync(file,JSON.stringify(scene));
 const result=spawnSync(process.execPath,['scripts/diagnose-project.mjs',file],{encoding:'utf8'});
 assert.equal(result.status,1,'Structural errors should produce exit code 1');
 for(const code of ['DUPLICATE_NAME','INVALID_TRANSFORM','DYNAMIC_WITHOUT_RIGIDBODY','CAPSULE_WITHOUT_COLLIDER','EMPTY_SCRIPT']) assert.ok(result.stdout.includes(code),'Expected diagnostic '+code);
 const valid=join(dir,'valid.gorbus');
 writeFileSync(valid,JSON.stringify({format:'GorbusScene',objects:[{name:'Player',position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],components:['Rigidbody']}],files:{'main.luau':'print("ok")'}}));
 const pass=spawnSync(process.execPath,['scripts/diagnose-project.mjs',valid],{encoding:'utf8'});
 assert.equal(pass.status,0,'Valid project should pass');
 assert.ok(pass.stdout.includes('PASS: no se han detectado problemas estructurales.'));
 console.log('GE 3.0.0 diagnostics: PASS — 5 issue classes detected and valid scene accepted.');
}finally{rmSync(dir,{recursive:true,force:true});}
