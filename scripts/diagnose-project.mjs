import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
const target=process.argv[2];
if(!target){console.error('Uso: npm run diagnose -- ruta/al/proyecto.gorbus');process.exit(2);}
const file=resolve(target);const report=[];const add=(level,code,message)=>report.push({level,code,message});let scene;
try{scene=JSON.parse(readFileSync(file,'utf8'));}catch(error){console.error('DIAGNOSE: no se pudo leer el proyecto: '+error.message);process.exit(1);}
if(extname(file).toLowerCase()!=='.gorbus')add('warning','FILE_EXTENSION','El archivo no termina en .gorbus.');
if(scene.format!=='GorbusScene')add('error','SCENE_FORMAT','Formato de escena inesperado.');
if(!Array.isArray(scene.objects))add('error','OBJECTS_ARRAY','Falta el array objects.');
const objects=Array.isArray(scene.objects)?scene.objects:[];const names=new Set();
for(let index=0;index<objects.length;index++){const object=objects[index]||{};const name=String(object.name||'').trim();
 if(!name)add('error','EMPTY_NAME','Objeto #'+(index+1)+' sin nombre.');else if(names.has(name))add('error','DUPLICATE_NAME','Nombre duplicado: '+name+'.');names.add(name);
 for(const key of ['position','rotation','scale']){const value=object[key];if(value!==undefined&&(!Array.isArray(value)||value.length!==3||value.some(n=>!Number.isFinite(Number(n)))))add('error','INVALID_TRANSFORM',(name||('#'+(index+1)))+' tiene '+key+' inválido.');}
 const components=Array.isArray(object.components)?object.components:[];
 if(object.physics&&object.physics.type==='dynamic'&&!components.some(c=>/rigidbody/i.test(c)))add('warning','DYNAMIC_WITHOUT_RIGIDBODY',(name||('#'+(index+1)))+' declara física dinámica sin Rigidbody.');
 if(/CAPSULE/i.test(object.type||'')&&!components.some(c=>/capsule collider/i.test(c)))add('warning','CAPSULE_WITHOUT_COLLIDER',(name||('#'+(index+1)))+' es cápsula sin Capsule Collider.');
}
if(!objects.length)add('warning','EMPTY_SCENE','La escena no contiene objetos.');
const scripts=scene.files&&typeof scene.files==='object'?scene.files:{};
for(const [path,content] of Object.entries(scripts)){if(typeof content!=='string')add('error','INVALID_SCRIPT_FILE','El archivo '+path+' no contiene texto.');else if(!content.trim())add('warning','EMPTY_SCRIPT','El script '+path+' está vacío.');}
const errors=report.filter(x=>x.level==='error').length;const warnings=report.filter(x=>x.level==='warning').length;
console.log('GORBUS PROJECT DIAGNOSTICS — '+file);console.log('Objetos: '+objects.length+' · Errores: '+errors+' · Avisos: '+warnings);
for(const item of report)console.log('['+item.level.toUpperCase()+'] '+item.code+': '+item.message);
if(!report.length)console.log('PASS: no se han detectado problemas estructurales.');process.exitCode=errors?1:0;
