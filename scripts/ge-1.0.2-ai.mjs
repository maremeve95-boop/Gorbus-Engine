/**
 * GE 1.0.2 Gorbus AI streaming and attachment-context integration.
 */
function replaceOnce(source, before, after, description) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error('GE 1.0.2 AI patch could not find ' + description + '.');
  if (source.indexOf(before, first + before.length) >= 0) throw new Error('Duplicate GE 1.0.2 anchor: ' + description);
  return source.slice(0, first) + after + source.slice(first + before.length);
}
export function enhanceGorbusAISource(input) {
  let source = input;
  if (source.includes('function updateGorbusAILivePreview(raw)')) throw new Error('Live preview was already patched.');
  source = replaceOnce(
    source,
    'Responde en español, con instrucciones concisas y código correcto.\n\nCONTEXTO DEL MOTOR:',
    'Responde en español, con instrucciones concisas y código correcto.\n\nARCHIVOS ADJUNTOS: el mensaje puede incluir una lista "attachments" con archivos de texto y código proporcionados por el usuario. Lee su contenido, identifica su nombre y lenguaje, y úsalos como contexto real para revisar, explicar, integrar o modificar el proyecto. No supongas que un archivo está completo si aparece marcado como truncado. No ejecutes HTML, JavaScript ni otros adjuntos: léelos como texto. Si el usuario pide cambios en un archivo adjunto, devuelve el archivo actualizado completo o explica qué parte falta.\n\nCONTEXTO DEL MOTOR:',
    'attachment system prompt'
  );

  const liveHelpers = String.raw`const gorbusAILiveStreamFiles = new Map();
function decodeGorbusJSONString(raw, start) {
  let output = '';
  for (let index = start; index < raw.length; index++) {
    const character = raw[index];
    if (character === '"') break;
    if (character !== '\\') { output += character; continue; }
    if (index + 1 >= raw.length) break;
    const escaped = raw[++index];
    if (escaped === '"' || escaped === '\\' || escaped === '/') output += escaped;
    else if (escaped === 'b') output += '\b';
    else if (escaped === 'f') output += '\f';
    else if (escaped === 'n') output += '\n';
    else if (escaped === 'r') output += '\r';
    else if (escaped === 't') output += '\t';
    else if (escaped === 'u') {
      const hex = raw.slice(index + 1, index + 5);
      if (hex.length < 4 || !/^[0-9a-f]{4}$/i.test(hex)) break;
      output += String.fromCharCode(parseInt(hex, 16));
      index += 4;
    } else output += escaped;
  }
  return output;
}
function updateGorbusAILivePreview(raw) {
  const pathPattern = /"path"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match, newestPath = '', changed = false;
  while ((match = pathPattern.exec(raw)) !== null) {
    let path;
    try { path = JSON.parse('"' + match[1] + '"'); } catch { continue; }
    if (!safeAiFilePath(path)) continue;
    const contentKey = raw.indexOf('"content"', match.index + match[0].length);
    const nextPath = raw.indexOf('"path"', match.index + match[0].length);
    if (contentKey < 0 || (nextPath >= 0 && nextPath < contentKey)) continue;
    const colon = raw.indexOf(':', contentKey + 9);
    const quote = raw.indexOf('"', colon + 1);
    if (colon < 0 || quote < 0 || (nextPath >= 0 && quote > nextPath)) continue;
    const content = decodeGorbusJSONString(raw, quote + 1);
    if (gorbusAILiveStreamFiles.get(path) !== content) { gorbusAILiveStreamFiles.set(path, content); changed = true; }
    newestPath = path;
  }
  if (!changed || !gorbusAILiveStreamFiles.size) return;
  const previousPath = aiDraftFiles[aiActiveFileIndex]?.path;
  aiDraftFiles = [...gorbusAILiveStreamFiles.entries()].map(([path, content]) => ({path, content, summary:'Escrito en directo por Gorbus AI'}));
  const selectedPath = newestPath || previousPath || aiDraftFiles[0].path;
  const selectedIndex = aiDraftFiles.findIndex(file => file.path === selectedPath);
  aiActiveFileIndex = selectedIndex >= 0 ? selectedIndex : 0;
  aiDraftApplied = false;
  renderGorbusAiFiles();
  const editor = $('gorbusAiDraftEditor');
  editor.readOnly = true; editor.disabled = false; editor.classList.add('gorbus-ai-streaming');
  $('gorbusAiFileStatus').textContent = 'Escribiendo en directo · ' + selectedPath;
  $('gorbusAiCodeStatus').textContent = 'Gorbus AI está editando ' + selectedPath + '…';
  const badge = $('gorbusAiLiveStatus');
  if (badge) { badge.textContent = 'EN DIRECTO'; badge.classList.add('is-live'); }
  window.__gorbusAiLivePreviewActive = true;
}
window.GorbusAIStreamPreview = {update:updateGorbusAILivePreview,reset:()=>gorbusAILiveStreamFiles.clear()};
`;

  source = replaceOnce(source, 'async function requestGorbusAI(event){', liveHelpers + '\nasync function requestGorbusAI(event){', 'live preview function');
  source = replaceOnce(source,
    "  aiRequestBusy=true;$('gorbusAiSend').disabled=true;",
    "  window.__gorbusAiLivePreviewActive=false;window.GorbusAIStreamPreview?.reset();$('gorbusAiDraftEditor').classList.remove('gorbus-ai-streaming');$('gorbusAiDraftEditor').readOnly=false;const liveBadge=$('gorbusAiLiveStatus');if(liveBadge){liveBadge.textContent='';liveBadge.classList.remove('is-live');}\n  aiRequestBusy=true;$('gorbusAiSend').disabled=true;",
    'request preview reset'
  );
  source = replaceOnce(source,
    "    const userContent=JSON.stringify({request:prompt,project:sceneContext,files:filesContext});",
    "    const attachments=Array.isArray(window.GorbusAIAttachments)?window.GorbusAIAttachments.slice(0,5).map(({name,type,content})=>({name,type,content})):[];\n    const userContent=JSON.stringify({request:prompt,project:sceneContext,files:filesContext,attachments});",
    'attachment payload'
  );
  source = replaceOnce(source, "    let raw='';let lastStatus=0;", "    let raw='';let lastStatus=0;let lastLivePreview=0;", 'stream counters');
  const streamStart = source.indexOf("if(part?.type==='text'&&part.text){raw+=part.text;", source.indexOf("const stream=await puter.ai.chat(messages"));
  if (streamStart < 0) throw new Error('Could not find the Gorbus AI text streaming loop.');
  const streamEnd = source.indexOf('\n', streamStart);
  const newStreamLine = "if(part?.type==='text'&&part.text){raw+=part.text;if(raw.length-lastLivePreview>=32){lastLivePreview=raw.length;window.GorbusAIStreamPreview?.update(raw);}if(raw.length-lastStatus>1100){lastStatus=raw.length;if(!window.__gorbusAiLivePreviewActive)$('gorbusAiCodeStatus').textContent='Diseñando solución Luau… '+Math.round(raw.length/1000)+' KB recibidos';}}";
  source = source.slice(0, streamStart) + newStreamLine + source.slice(streamEnd);
  source = replaceOnce(source,
    "    if(!raw.trim())throw new Error('El modelo no devolvió contenido. Comprueba tu cuenta de Puter e inténtalo de nuevo.');",
    "    if(!raw.trim())throw new Error('El modelo no devolvió contenido. Comprueba tu cuenta de Puter e inténtalo de nuevo.');\n    window.GorbusAIStreamPreview?.update(raw);",
    'final stream flush'
  );
  source = replaceOnce(source,
    'let repairRaw="";\n      for await(const repairPart of repairStream){if(repairPart?.type==="error")throw new Error(repairPart.message||"Error al corregir Luau");if(repairPart?.type==="text"&&repairPart.text)repairRaw+=repairPart.text;}',
    'let repairRaw="";\n      gorbusAILiveStreamFiles.clear();window.__gorbusAiLivePreviewActive=false;\n      for await(const repairPart of repairStream){if(repairPart?.type==="error")throw new Error(repairPart.message||"Error al corregir Luau");if(repairPart?.type==="text"&&repairPart.text){repairRaw+=repairPart.text;window.GorbusAIStreamPreview?.update(repairRaw);}}',
    'syntax repair streaming'
  );
  const assignmentStart = source.indexOf("    aiDraftFiles=(Array.isArray(data.files)?");
  const assignmentEnd = source.indexOf("\n  }catch(error){", assignmentStart);
  if (assignmentStart < 0 || assignmentEnd < 0) throw new Error('Could not locate final Gorbus AI draft assignment.');
  const newAssignment = `    const usedLivePreview=Boolean(window.__gorbusAiLivePreviewActive);
    aiDraftFiles=(Array.isArray(data.files)?data.files:[]).filter(file=>safeAiFilePath(file.path)&&typeof file.content==='string'&&file.content.length<=24000).map(file=>({path:file.path,content:file.content,summary:file.summary||''}));
    aiActiveFileIndex=0;aiDraftApplied=false;
    if(aiDraftFiles.length){
      renderGorbusAiFiles();$('gorbusAiCodeStatus').textContent=aiDraftFiles.length+' archivo(s) listos para revisar';
      $('gorbusAiDraftEditor').readOnly=false;$('gorbusAiDraftEditor').classList.remove('gorbus-ai-streaming');
      const liveBadge=$('gorbusAiLiveStatus');if(liveBadge){liveBadge.textContent=usedLivePreview?'ESCRITURA COMPLETA':'LISTO';liveBadge.classList.remove('is-live');}
      $('gorbusAiFileStatus').textContent=usedLivePreview?'Edición en directo completada · revisa los cambios':'Código generado · revisa los cambios';
      addGorbusAiMessage('assistant','He preparado '+aiDraftFiles.length+' archivo(s). '+(usedLivePreview?'Has podido ver cómo se escribían en directo. ':'')+'Revisa las pestañas y pulsa «Aplicar al proyecto» cuando estés conforme.','Los cambios no se aplican hasta que tú los aceptes.');
      if(!usedLivePreview)animateAIGeneratedCode(0);
    }else{
      renderGorbusAiFiles();$('gorbusAiCodeStatus').textContent='No hay cambios de código propuestos';
      const liveBadge=$('gorbusAiLiveStatus');if(liveBadge){liveBadge.textContent='';liveBadge.classList.remove('is-live');}
    }
    window.__gorbusAiLivePreviewActive=false;`;
  source = source.slice(0, assignmentStart) + newAssignment + source.slice(assignmentEnd);
  return source;
}
