import './gorbus-ai-attachments.css';

const SUPPORTED_TEXT_EXTENSIONS = new Set([
  'js','mjs','cjs','jsx','ts','tsx','html','htm','css','scss','less','json','jsonc',
  'md','mdx','txt','csv','xml','svg','yml','yaml','toml','ini','cfg','conf','env',
  'py','go','rs','java','kt','c','h','cpp','hpp','cs','php','rb','swift','sql',
  'sh','bash','zsh','ps1','lua','luau','glsl','vert','frag','shader','vue','svelte',
  'astro','gradle','properties','log','diff','patch'
]);
const MAX_FILES = 5;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_TOTAL_BYTES = 384 * 1024;

function extensionOf(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name === 'dockerfile' || name.endsWith('/dockerfile')) return 'dockerfile';
  if (name === 'makefile' || name.endsWith('/makefile')) return 'makefile';
  if (name === '.env' || name.endsWith('/.env')) return 'env';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1) : '';
}

function installAttachments() {
  const form = document.querySelector('#gorbusAiPromptForm');
  const prompt = document.querySelector('#gorbusAiPrompt');
  const footer = form?.querySelector('.gorbus-ai-prompt-footer');
  if (!form || !prompt || !footer || form.querySelector('#gorbusAiAttachments')) return false;

  const row = document.createElement('div');
  row.id = 'gorbusAiAttachments';
  row.className = 'gorbus-ai-attachments';
  row.innerHTML = `
    <div class="gorbus-ai-attachment-actions">
      <button type="button" class="gorbus-ai-attach-button" data-attach-open aria-label="Adjuntar archivos">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.4 11.05-8.49 8.49a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.65l-9.2 9.2a2 2 0 0 1-2.83-2.83l8.14-8.13"/></svg>
        <span>Adjuntar archivos</span>
      </button>
      <span class="gorbus-ai-attachment-hint">JS · HTML · CSS · JSON · Luau · texto · máx. 384 KB</span>
    </div>
    <div class="gorbus-ai-attachment-chips" data-attachment-chips></div>
    <p class="gorbus-ai-attachment-status" data-attachment-status aria-live="polite"></p>
    <input id="gorbusAiFilePicker" type="file" multiple hidden accept=".js,.mjs,.cjs,.jsx,.ts,.tsx,.html,.htm,.css,.scss,.less,.json,.jsonc,.md,.mdx,.txt,.csv,.xml,.svg,.yml,.yaml,.toml,.ini,.cfg,.conf,.env,.py,.go,.rs,.java,.kt,.c,.h,.cpp,.hpp,.cs,.php,.rb,.swift,.sql,.sh,.bash,.zsh,.ps1,.lua,.luau,.glsl,.vert,.frag,.shader,.vue,.svelte,.astro,.gradle,.properties,.log,.diff,.patch">
  `;
  prompt.insertAdjacentElement('afterend', row);
  const picker = row.querySelector('#gorbusAiFilePicker');
  const chips = row.querySelector('[data-attachment-chips]');
  const status = row.querySelector('[data-attachment-status]');
  const attachments = Array.isArray(window.GorbusAIAttachments) ? window.GorbusAIAttachments : [];
  window.GorbusAIAttachments = attachments;

  function setStatus(message, error = false) {
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(error));
  }
  function render() {
    chips.replaceChildren();
    attachments.forEach((file, index) => {
      const chip = document.createElement('span');
      chip.className = 'gorbus-ai-attachment-chip';
      const label = document.createElement('span');
      label.textContent = file.name;
      label.title = file.name + ' · ' + Math.ceil(file.size / 1024) + ' KB';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'gorbus-ai-attachment-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Quitar ' + file.name);
      remove.addEventListener('click', () => {
        attachments.splice(index, 1);
        render();
        setStatus('Adjunto eliminado.');
      });
      chip.append(label, remove);
      chips.appendChild(chip);
    });
    row.classList.toggle('has-files', attachments.length > 0);
  }
  async function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setStatus('Leyendo archivos…');
    let added = 0;
    const errors = [];
    for (const file of incoming) {
      if (attachments.length >= MAX_FILES) { errors.push('máximo ' + MAX_FILES + ' archivos'); break; }
      const extension = extensionOf(file);
      if (!SUPPORTED_TEXT_EXTENSIONS.has(extension)) { errors.push(file.name + ': formato no textual compatible'); continue; }
      if (file.size > MAX_FILE_BYTES) { errors.push(file.name + ': supera 128 KB'); continue; }
      const currentBytes = attachments.reduce((sum, item) => sum + item.size, 0);
      if (currentBytes + file.size > MAX_TOTAL_BYTES) { errors.push('límite total de adjuntos: 384 KB'); break; }
      if (attachments.some(item => item.name === file.name && item.size === file.size)) continue;
      try {
        const content = await file.text();
        attachments.push({ name: file.name, type: extension, size: file.size, content });
        added++;
      } catch (error) { errors.push(file.name + ': no se pudo leer'); }
    }
    render();
    if (errors.length) setStatus((added ? added + ' archivo(s) añadido(s). ' : '') + errors.join(' · '), true);
    else setStatus(added ? added + ' archivo(s) listo(s) para Gorbus AI.' : 'No había archivos nuevos.');
  }
  row.querySelector('[data-attach-open]').addEventListener('click', () => picker.click());
  picker.addEventListener('change', async () => { await addFiles(picker.files); picker.value = ''; });
  form.addEventListener('dragover', event => {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    row.classList.add('is-drop-target');
  });
  form.addEventListener('dragleave', event => {
    if (!form.contains(event.relatedTarget)) row.classList.remove('is-drop-target');
  });
  form.addEventListener('drop', event => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    row.classList.remove('is-drop-target');
    addFiles(event.dataTransfer.files);
  });
  render();
  return true;
}
function installLiveStatus() {
  const header = document.querySelector('.gorbus-ai-code-head');
  if (!header || header.querySelector('#gorbusAiLiveStatus')) return;
  const badge = document.createElement('span');
  badge.id = 'gorbusAiLiveStatus';
  badge.className = 'gorbus-ai-live-status';
  badge.setAttribute('aria-live', 'polite');
  const language = header.querySelector('.ai-code-language');
  if (language) language.insertAdjacentElement('beforebegin', badge);
  else header.appendChild(badge);
}
function start() {
  installAttachments();
  installLiveStatus();
}
start();
const observer = new MutationObserver(start);
observer.observe(document.documentElement, { childList: true, subtree: true });
