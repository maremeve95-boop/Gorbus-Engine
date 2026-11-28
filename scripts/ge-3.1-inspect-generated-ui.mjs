import { readFileSync, existsSync } from 'node:fs';

const files = [
  'index.html',
  'styles.css',
  'src/main.js',
  'src/gorbus-v2-studio.js',
  'src/gorbus-enhancements.js'
];
const patterns = /template|home|welcome|start|new project|new experience|recent|archive|experience|project library|abrir proyecto|nuevo proyecto|plantilla|inicio/i;
for (const path of files) {
  if (!existsSync(path)) continue;
  const lines=readFileSync(path,'utf8').split(/\r?\n/);
  console.log('\n===== '+path+' ('+lines.length+' lines) =====');
  let printed=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(patterns.test(line)){
      console.log(String(i+1).padStart(4,'0')+': '+line.slice(0,320));
      if(++printed>=70){console.log('... match limit reached');break;}
    }
  }
  if(path==='index.html'){
    console.log('\n--- BODY FIRST 16000 CHARS ---\n'+readFileSync(path,'utf8').slice(readFileSync(path,'utf8').indexOf('<body'),readFileSync(path,'utf8').indexOf('<body')+16000));
  }
}
