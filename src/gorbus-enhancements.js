import './gorbus-ai-attachments.js';
import './gorbus-enhancements.css';

const ACCOUNT_URL = 'https://puter.com/';
const MODEL_LABEL = 'DeepSeek V4.1 Flash';
let compilerPromise = null;
let accountButton = null;
let accountModal = null;
let usageRefreshPromise = null;

const SYSTEM_PROMPT = [
'GORBUS BUILD WORKFLOW — actúa como un socio de ingeniería de videojuegos:',
'- Tu trabajo es entregar un prototipo jugable, no solo explicar cómo se podría hacer.',
'- Comprende primero el género, objetivo, controles, cámara y estado actual del proyecto. Usa la escena y los scripts que recibes.',
'- Planifica brevemente, implementa el juego completo y devuelve una lista ordenada de pasos para probarlo.',
'- Prioriza un main.luau completo y autocontenido que cree sus objetos al iniciar y contenga el ciclo de juego. No entregues fragmentos, pseudocódigo, marcadores TODO ni comentarios de “continúa aquí”.',
'- Implementa, cuando la API lo permita, estado inicial, controles, reglas, colisiones, feedback, victoria/derrota y reinicio.',
'- Usa dt para todo movimiento dependiente del tiempo. Evita crear objetos en cada fotograma.',
'- Usa únicamente la API real de Gorbus descrita en el prompt principal. No inventes servicios Roblox, Vector3, CFrame, game, workspace, Instance, UI, audio ni componentes físicos no expuestos.',
'- Los objetos creados con createObject son visuales; no supongas que tienen colliders o Rigidbody. Para juegos arcade simples, implementa colisiones manuales con getPosition y dimensiones.',
'- Si el motor no tiene una capacidad, explica la limitación y usa una alternativa honesta. Nunca afirmes que una función está terminada si es un marcador.',
'- Antes de devolver JSON, revisa las llamadas a API, nombres de objetos, callbacks, sintaxis Luau, controles y el bucle de juego; corrige los errores que detectes.',
'- Devuelve archivos completos en el esquema JSON obligatorio. Incluye una explicación breve de lo que ya es jugable.',
'- Un juego pequeño que funciona es mejor que un juego enorme roto.'
].join('\n');

function icon(name) {
  const paths = {
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
    external: '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.sparkle) + '</svg>';
}

function formatResource(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'No disponible';
  return (number / 100000000).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 4, minimumFractionDigits: 2
  });
}

function safeText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : (fallback || '—');
}

function ensureAccountButton() {
  if (accountButton && accountButton.isConnected) return true;
  const aiButton = document.querySelector('#gorbusAiOpen');
  const menu = document.querySelector('.main-menu');
  const toolbar = document.querySelector('.toolbar');
  const target = (aiButton && aiButton.parentElement) || menu || toolbar;
  if (!target) return false;

  accountButton = document.createElement('button');
  accountButton.type = 'button';
  accountButton.className = 'gorbus-account-entry';
  accountButton.setAttribute('aria-haspopup', 'dialog');
  accountButton.setAttribute('aria-label', 'Cuenta y uso de Puter');
  accountButton.innerHTML = icon('user') + '<span>Cuenta</span><i class="gorbus-account-indicator" aria-hidden="true"></i>';
  accountButton.addEventListener('click', openAccount);
  if (aiButton && aiButton.parentElement) aiButton.insertAdjacentElement('afterend', accountButton);
  else target.appendChild(accountButton);
  return true;
}

function createAccountModal() {
  if (accountModal) return accountModal;
  accountModal = document.createElement('div');
  accountModal.className = 'gorbus-account-backdrop';
  accountModal.id = 'gorbusAccountManager';
  accountModal.hidden = true;
  accountModal.innerHTML =
    '<section class="gorbus-account-dialog" role="dialog" aria-modal="true" aria-labelledby="gorbusAccountTitle">' +
      '<header class="gorbus-account-header">' +
        '<div class="gorbus-account-heading"><div class="gorbus-account-mark">' + icon('user') + '</div>' +
          '<div><h2 id="gorbusAccountTitle">Cuenta y uso</h2><p>Tu sesión de Puter en Gorbus Engine</p></div></div>' +
        '<button class="gorbus-account-close" type="button" data-account-close aria-label="Cerrar">' + icon('close') + '</button>' +
      '</header>' +
      '<div class="gorbus-account-content">' +
        '<div class="gorbus-account-profile">' +
          '<div class="gorbus-account-avatar" data-account-avatar>' + icon('user') + '</div>' +
          '<div class="gorbus-account-identity"><strong data-account-name>Comprobando sesión…</strong><span data-account-state>Conectando con Puter</span></div>' +
          '<span class="gorbus-account-status" data-account-badge>●</span>' +
        '</div>' +
        '<section class="gorbus-usage-card" aria-label="Uso mensual de Puter">' +
          '<div class="gorbus-usage-heading"><div><span class="gorbus-eyebrow">RECURSOS DE PUTER</span><h3>Uso mensual</h3></div>' +
          '<button type="button" class="gorbus-icon-button" data-account-refresh aria-label="Actualizar uso" title="Actualizar">' + icon('refresh') + '</button></div>' +
          '<div class="gorbus-usage-numbers"><div><span>Disponible según Puter</span><strong data-account-remaining>—</strong></div>' +
          '<div><span>Consumido este mes</span><strong data-account-used>—</strong></div></div>' +
          '<div class="gorbus-usage-track"><span data-account-progress></span></div>' +
          '<div class="gorbus-usage-foot"><span data-account-percent>Esperando datos de Puter</span><span data-account-allowance>—</span></div>' +
          '<p class="gorbus-account-note">Puter entrega el límite y el consumo mensual de recursos, además del desglose por API de esta aplicación. Las cifras dependen de los datos que devuelva Puter y pueden tardar alrededor de un minuto en actualizarse.</p>' +
        '</section>' +
        '<section class="gorbus-account-details"><div class="gorbus-section-heading"><h3>Actividad de Gorbus</h3><span>ESTE PROYECTO</span></div>' +
          '<div class="gorbus-usage-list" data-account-apis><div class="gorbus-usage-empty">Inicia sesión para consultar la actividad.</div></div></section>' +
        '<section class="gorbus-account-model"><div class="gorbus-model-icon">' + icon('sparkle') + '</div>' +
          '<div><span>ASISTENTE ACTIVO</span><strong>' + MODEL_LABEL + '</strong><small>Modelo fijo · Sin selector</small></div><span class="gorbus-model-fixed">FIJO</span></section>' +
        '<p class="gorbus-account-feedback" data-account-feedback aria-live="polite"></p>' +
      '</div>' +
      '<footer class="gorbus-account-footer"><div class="gorbus-account-footer-links"><a href="' + ACCOUNT_URL + '" target="_blank" rel="noopener noreferrer">Abrir Puter ' + icon('external') + '</a></div>' +
        '<div class="gorbus-account-actions"><button type="button" class="gorbus-account-connect" data-account-connect>Conectar Puter</button><button type="button" class="gorbus-account-switch" data-account-switch>Cambiar cuenta</button>' +
        '<button type="button" class="gorbus-account-signout" data-account-signout>' + icon('logout') + ' Cerrar sesión</button></div></footer>' +
    '</section>';
  document.body.appendChild(accountModal);
  accountModal.addEventListener('click', function(event) {
    if (event.target === accountModal || event.target.closest('[data-account-close]')) closeAccount();
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && accountModal && !accountModal.hidden) closeAccount();
  });
  accountModal.querySelector('[data-account-refresh]').addEventListener('click', refreshAccount);
  accountModal.querySelector('[data-account-connect]').addEventListener('click', connectAccount);
  accountModal.querySelector('[data-account-switch]').addEventListener('click', switchAccount);
  accountModal.querySelector('[data-account-signout]').addEventListener('click', signOut);
  return accountModal;
}

function setAccountFeedback(message, isError) {
  const output = accountModal && accountModal.querySelector('[data-account-feedback]');
  if (!output) return;
  output.textContent = message || '';
  output.classList.toggle('is-error', Boolean(isError));
}

function setAccountSignedIn(signedIn) {
  if (accountButton) {
    accountButton.classList.toggle('is-connected', signedIn);
    const indicator = accountButton.querySelector('i');
    if (indicator) indicator.classList.toggle('is-connected', signedIn);
    accountButton.setAttribute('aria-label', signedIn ? 'Cuenta Puter conectada' : 'Conectar cuenta Puter');
  }
  const badge = accountModal && accountModal.querySelector('[data-account-badge]');
  if (badge) {
    badge.textContent = signedIn ? 'CONECTADA' : 'SIN CONECTAR';
    badge.classList.toggle('is-connected', signedIn);
  }
  const connectButton = accountModal && accountModal.querySelector('[data-account-connect]');
  const switchButton = accountModal && accountModal.querySelector('[data-account-switch]');
  const signoutButton = accountModal && accountModal.querySelector('[data-account-signout]');
  if (connectButton) connectButton.hidden = signedIn;
  if (switchButton) switchButton.disabled = !signedIn;
  if (signoutButton) signoutButton.disabled = !signedIn;
}

function showAccountSignedOut() {
  accountModal.querySelector('[data-account-name]').textContent = 'Sin sesión iniciada';
  accountModal.querySelector('[data-account-state]').textContent = 'Conecta Puter para activar Gorbus AI';
  accountModal.querySelector('[data-account-avatar]').innerHTML = icon('user');
  accountModal.querySelector('[data-account-remaining]').textContent = '—';
  accountModal.querySelector('[data-account-used]').textContent = '—';
  accountModal.querySelector('[data-account-progress]').style.width = '0%';
  accountModal.querySelector('[data-account-percent]').textContent = 'Sin datos';
  accountModal.querySelector('[data-account-allowance]').textContent = '—';
  accountModal.querySelector('[data-account-apis]').innerHTML = '<div class="gorbus-usage-empty">Inicia sesión para ver el consumo de Gorbus.</div>';
  setAccountSignedIn(false);
}

async function refreshAccount() {
  if (usageRefreshPromise) return usageRefreshPromise;
  usageRefreshPromise = (async function() {
    setAccountFeedback('Actualizando información de la cuenta…');
    const puter = window.puter;
    if (!puter || !puter.auth) {
      showAccountSignedOut();
      setAccountFeedback('Puter todavía no está cargado. Abre Gorbus AI y pulsa «Conectar Puter».', true);
      return;
    }
    let signedIn = false;
    try { signedIn = Boolean(puter.auth.isSignedIn()); } catch (error) { signedIn = false; }
    setAccountSignedIn(signedIn);
    if (!signedIn) {
      showAccountSignedOut();
      setAccountFeedback('No hay una cuenta Puter conectada.');
      return;
    }

    const nameEl = accountModal.querySelector('[data-account-name]');
    const stateEl = accountModal.querySelector('[data-account-state]');
    nameEl.textContent = 'Cargando cuenta…';
    stateEl.textContent = 'Leyendo perfil de Puter';

    const results = await Promise.allSettled([
      puter.auth.getUser(),
      typeof puter.auth.getProfile === 'function' ? puter.auth.getProfile() : Promise.resolve(null),
      puter.auth.getMonthlyUsage()
    ]);
    const userResult = results[0];
    const profileResult = results[1];
    const usageResult = results[2];

    if (userResult.status === 'fulfilled') {
      const user = userResult.value || {};
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
      nameEl.textContent = safeText(profile && profile.name, safeText(user.username, 'Usuario Puter'));
      const flags = [];
      flags.push(user.is_temp ? 'Cuenta temporal' : 'Cuenta Puter');
      if (user.email_confirmed === false) flags.push('Correo sin confirmar');
      stateEl.textContent = flags.join(' · ');
      const avatar = accountModal.querySelector('[data-account-avatar]');
      if (profile && profile.picture) {
        avatar.innerHTML = '';
        const img = document.createElement('img');
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        img.src = profile.picture;
        avatar.appendChild(img);
      } else {
        avatar.innerHTML = icon('user');
      }
    } else {
      nameEl.textContent = 'Cuenta conectada';
      stateEl.textContent = 'Puter no devolvió los datos del perfil';
    }

    if (usageResult.status === 'fulfilled') {
      renderUsage(usageResult.value || {});
      setAccountFeedback('Información actualizada desde Puter.');
    } else {
      renderUsageUnavailable();
      setAccountFeedback('Puter no pudo obtener el uso mensual. Vuelve a intentarlo más tarde.', true);
    }
    setAccountSignedIn(true);
  })().catch(function(error) {
    setAccountFeedback((error && error.message) || 'No se pudo actualizar la cuenta.', true);
  }).finally(function() {
    usageRefreshPromise = null;
  });
  return usageRefreshPromise;
}

function renderUsage(usage) {
  const info = usage.allowanceInfo || {};
  const allowance = Number(info.monthUsageAllowance);
  const remaining = Number(info.remaining);
  const valid = Number.isFinite(allowance) && allowance > 0 && Number.isFinite(remaining);
  const used = valid ? Math.max(0, allowance - remaining) : NaN;
  const percent = valid ? Math.min(100, Math.max(0, used / allowance * 100)) : 0;
  accountModal.querySelector('[data-account-remaining]').textContent = valid ? formatResource(remaining) : 'No disponible';
  accountModal.querySelector('[data-account-used]').textContent = valid ? formatResource(used) : 'No disponible';
  accountModal.querySelector('[data-account-progress]').style.width = percent.toFixed(1) + '%';
  accountModal.querySelector('[data-account-percent]').textContent = valid ? percent.toFixed(1) + '% utilizado' : 'Sin datos de cuota';
  accountModal.querySelector('[data-account-allowance]').textContent = valid ? 'Límite mensual: ' + formatResource(allowance) : 'Límite no disponible';

  const apiList = usage.usage && typeof usage.usage === 'object' ? Object.entries(usage.usage) : [];
  const container = accountModal.querySelector('[data-account-apis]');
  container.innerHTML = '';
  if (!apiList.length) {
    container.innerHTML = '<div class="gorbus-usage-empty">Todavía no hay actividad registrada para esta aplicación.</div>';
    return;
  }
  apiList.sort(function(a, b) { return Number(b[1] && b[1].cost || 0) - Number(a[1] && a[1].cost || 0); });
  apiList.slice(0, 6).forEach(function(entry) {
    const name = entry[0];
    const item = entry[1] || {};
    const row = document.createElement('div');
    row.className = 'gorbus-usage-row';
    const label = document.createElement('span');
    label.textContent = name.replaceAll('_', ' ');
    const count = document.createElement('small');
    count.textContent = Number(item.count || 0).toLocaleString() + ' llamadas';
    const cost = document.createElement('strong');
    cost.textContent = formatResource(item.cost);
    row.append(label, count, cost);
    container.appendChild(row);
  });
}

function renderUsageUnavailable() {
  accountModal.querySelector('[data-account-remaining]').textContent = '—';
  accountModal.querySelector('[data-account-used]').textContent = '—';
  accountModal.querySelector('[data-account-progress]').style.width = '0%';
  accountModal.querySelector('[data-account-percent]').textContent = 'Sin datos';
  accountModal.querySelector('[data-account-allowance]').textContent = '—';
  accountModal.querySelector('[data-account-apis]').innerHTML = '<div class="gorbus-usage-empty">El desglose de uso no está disponible en este momento.</div>';
}

function openAccount() {
  createAccountModal();
  accountModal.hidden = false;
  accountModal.classList.add('is-open');
  document.body.classList.add('gorbus-account-open');
  refreshAccount();
  accountModal.querySelector('[data-account-close]').focus({ preventScroll: true });
}

function closeAccount() {
  if (!accountModal) return;
  accountModal.classList.remove('is-open');
  accountModal.hidden = true;
  document.body.classList.remove('gorbus-account-open');
  if (accountButton) accountButton.focus({ preventScroll: true });
}

function connectAccount() {
  const auth = window.puter && window.puter.auth;
  if (auth && typeof auth.signIn === 'function') {
    setAccountFeedback('Abriendo el inicio de sesión de Puter…');
    // Start the popup synchronously from this button press.
    const result = auth.signIn();
    Promise.resolve(result).then(refreshAccount).catch(function(error) {
      setAccountFeedback((error && (error.msg || error.message)) || 'No se pudo conectar Puter.', true);
    });
    return;
  }
  closeAccount();
  const openAI = document.querySelector('#gorbusAiOpen');
  if (openAI) openAI.click();
  setTimeout(function() {
    const connect = document.querySelector('#gorbusAiConnect');
    if (connect) connect.click();
  }, 80);
}
function switchAccount() {
  const auth = window.puter && window.puter.auth;
  if (!auth || typeof auth.signIn !== 'function') {
    setAccountFeedback('Puter no está disponible. Conecta primero Gorbus AI.', true);
    return;
  }
  setAccountFeedback('Abriendo la selección de cuenta…');
  // Call signIn inside the click handler so the browser allows its popup.
  const result = auth.signIn({ request_auth: true });
  Promise.resolve(result).then(refreshAccount).catch(function(error) {
    setAccountFeedback((error && (error.msg || error.message)) || 'No se pudo cambiar de cuenta.', true);
  });
}

async function signOut() {
  const auth = window.puter && window.puter.auth;
  if (!auth || typeof auth.signOut !== 'function') {
    setAccountFeedback('Puter no está disponible.', true);
    return;
  }
  if (!window.confirm('¿Cerrar la sesión de Puter en Gorbus Engine?')) return;
  try {
    await auth.signOut();
    showAccountSignedOut();
    setAccountFeedback('Sesión cerrada.');
  } catch (error) {
    setAccountFeedback((error && (error.msg || error.message)) || 'No se pudo cerrar la sesión.', true);
  }
}

async function compileLuau(source) {
  try {
    if (!compilerPromise) {
      compilerPromise = import('luau-web').then(async function(module) {
        if (!module || !module.LuauState) throw new Error('No se encontró LuauState en luau-web.');
        return module.LuauState.createAsync({});
      }).catch(function(error) {
        compilerPromise = null;
        throw error;
      });
    }
    const state = await compilerPromise;
    // loadstring compiles only; it does not execute the game's code.
    state.loadstring(String(source || ''), 'GorbusAI_Preflight.main.luau', true);
    return { ok: true, message: 'El código supera la comprobación de sintaxis Luau.' };
  } catch (error) {
    return { ok: false, message: (error && error.message) || String(error) };
  }
}

function addPreflightButton() {
  const apply = document.querySelector('#gorbusAiApply');
  if (!apply || !apply.parentElement || apply.parentElement.querySelector('[data-gorbus-preflight]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gorbus-ai-preflight';
  button.dataset.gorbusPreflight = 'true';
  button.textContent = 'Comprobar Luau';
  button.title = 'Compila el borrador sin ejecutarlo';
  button.addEventListener('click', async function() {
    const editor = document.querySelector('#gorbusAiDraftEditor');
    const status = document.querySelector('#gorbusAiFileStatus');
    if (!editor || !editor.value.trim()) {
      if (status) status.textContent = 'No hay código para comprobar.';
      return;
    }
    button.disabled = true;
    button.textContent = 'Comprobando…';
    const result = await compileLuau(editor.value);
    button.disabled = false;
    button.textContent = 'Comprobar Luau';
    button.classList.toggle('is-success', result.ok);
    button.classList.toggle('is-error', !result.ok);
    if (status) status.textContent = result.ok
      ? '✓ Sintaxis Luau correcta. Aplica el archivo y pulsa Play para probar el juego.'
      : 'Error de Luau: ' + result.message;
  });
  apply.insertAdjacentElement('beforebegin', button);
}

function installWorkflow() {
  const form = document.querySelector('#gorbusAiPromptForm');
  const send = document.querySelector('#gorbusAiSend');
  const messages = document.querySelector('#gorbusAiMessages');
  if (!form || !send || !messages) return false;

  let workflow = document.querySelector('#gorbusAiWorkflow');
  if (!workflow) {
    workflow = document.createElement('div');
    workflow.id = 'gorbusAiWorkflow';
    workflow.className = 'gorbus-ai-workflow';
    workflow.innerHTML =
      '<div class="gorbus-ai-workflow-head"><span class="gorbus-ai-workflow-orb">' + icon('sparkle') + '</span>' +
        '<div><strong>Flujo de construcción</strong><small data-workflow-caption>Prepara una idea y conviértela en un prototipo jugable</small></div>' +
        '<span class="gorbus-ai-workflow-state" data-workflow-state>LISTO</span></div>' +
      '<div class="gorbus-ai-workflow-steps">' +
        '<span data-step="plan"><i>1</i> Plan</span><span data-step="build"><i>2</i> Construcción</span>' +
        '<span data-step="check"><i>3</i> Revisión</span><span data-step="ready"><i>4</i> Entrega</span></div>';
    messages.insertAdjacentElement('beforebegin', workflow);
  }
  const state = workflow.querySelector('[data-workflow-state]');
  const caption = workflow.querySelector('[data-workflow-caption]');
  const stages = ['plan', 'build', 'check', 'ready'];
  function setStage(active, text, label) {
    stages.forEach(function(stage, index) {
      const element = workflow.querySelector('[data-step="' + stage + '"]');
      element.classList.toggle('is-done', index < active);
      element.classList.toggle('is-active', index === active);
    });
    state.textContent = label;
    caption.textContent = text;
    workflow.classList.toggle('is-working', label === 'TRABAJANDO');
  }

  let progressTimers = [];
  if (!form.dataset.gorbusWorkflow) {
    form.dataset.gorbusWorkflow = '1';
    form.addEventListener('submit', function() {
      progressTimers.forEach(clearTimeout);
      progressTimers = [];
      setStage(0, 'Analizando el objetivo y el estado del proyecto…', 'PLANIFICANDO');
      progressTimers.push(setTimeout(function() {
        setStage(1, 'Diseñando el juego y escribiendo Luau…', 'TRABAJANDO');
      }, 900));
      progressTimers.push(setTimeout(function() {
        setStage(2, 'Revisando sintaxis y APIs reales de Gorbus…', 'REVISANDO');
      }, 2300));
    }, true);
  }

  function updateBusy() {
    if (send.disabled) {
      workflow.classList.add('is-working');
    } else if (workflow.classList.contains('is-working')) {
      progressTimers.forEach(clearTimeout);
      setStage(3, 'La propuesta está lista para revisar. Comprueba el script antes de aplicarlo.', 'LISTO PARA REVISAR');
    }
  }
  if (!send.dataset.gorbusBusyObserver) {
    send.dataset.gorbusBusyObserver = '1';
    new MutationObserver(updateBusy).observe(send, { attributes: true, attributeFilter: ['disabled'] });
  }
  addPreflightButton();
  return true;
}

function installPromptSuggestions() {
  const suggestions = document.querySelector('#gorbusAiSuggestions');
  if (!suggestions || suggestions.querySelector('[data-gorbus-complete-game]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.gorbusCompleteGame = 'true';
  button.textContent = '✦ Juego completo';
  button.title = 'Pide un prototipo jugable con inicio, controles, reglas y reinicio';
  button.addEventListener('click', function() {
    const prompt = document.querySelector('#gorbusAiPrompt');
    if (!prompt) return;
    prompt.value = 'Crea un videojuego completo y jugable dentro de Gorbus Engine. Primero revisa el proyecto y la escena actuales. Implementa un objetivo claro, controles, reglas, colisiones coherentes, feedback visual, condición de victoria o derrota y una forma de reiniciar. Crea todos los objetos necesarios desde main.luau usando solo la API real de Gorbus. Entrega el archivo completo, sin pseudocódigo ni funciones inventadas. Revisa la sintaxis Luau antes de entregarlo y explica exactamente cómo probarlo con Play.';
    prompt.focus({ preventScroll: true });
  });
  suggestions.appendChild(button);
}

function install() {
  ensureAccountButton();
  installWorkflow();
  installPromptSuggestions();
  document.documentElement.classList.add('gorbus-polished-ui');
}

install();
const observer = new MutationObserver(install);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', install, { once: true });

window.GorbusUpgradeAI = {
  systemPrompt: SYSTEM_PROMPT,
  compileLuau: compileLuau,
  refreshAccount: refreshAccount,
  openAccount: openAccount
};
