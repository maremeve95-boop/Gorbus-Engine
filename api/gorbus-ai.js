const API = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-v4-pro'; // Fixed model; reasoning is always enabled.
const buckets = new Map();

const RULES = `Eres Gorbus AI, un asistente especializado en crear videojuegos dentro de Gorbus Engine. Responde en español y devuelve SOLO JSON válido con esta forma: {"message":"explicación","files":[{"path":"main.luau","content":"código completo","summary":"descripción"}],"steps":["cómo probarlo"]}. Sin Markdown fences.

ENTORNO REAL: Luau auténtico en WebAssembly; Three.js y Rapier 3D. El script que se ejecuta automáticamente es main.luau y tiene callbacks onStart(), onUpdate(dt: number), onStop(). API disponible: Gorbus.log(message), find(name), createObject(name,type,x,y,z,color,sx,sy,sz), destroyObject(name), move(name,dx,dy,dz), setPosition(name,x,y,z), getPosition(name) (tabla indexada [1]=x,[2]=y,[3]=z o nil), setScale(name,sx,sy,sz), setColor(name,#RRGGBB), setVelocity(name,x,y,z), setHorizontalVelocity(name,x,z), applyImpulse(name,x,y,z), hasRigidbody(name), isKeyDown(key), isKeyJustPressed(key), getTime(). createObject acepta cube, sphere o plane. Los objetos que crea son visuales; no reciben Rigidbody/collider automáticamente. Los cuerpos físicos activos sí pueden moverse con setVelocity/applyImpulse.

NO inventes funciones ni APIs de Roblox. No existen game, workspace, Instance, require/module loader, sprites 2D, audio, networking ni un motor 2D separado. Puedes hacer prototipos arcade 2.5D con primitivas visuales y movimiento/detección manual por coordenadas. Si falta una función, dilo claramente y ofrece la aproximación más útil.

REGLAS: prioriza un main.luau completo, ejecutable y mantenible; usa --!strict cuando sea práctico; usa dt para movimiento por fotograma; evita trabajo innecesario en onUpdate. No uses APIs de navegador, DOM, Node, os, io, debug, package ni loadstring. Solo puedes proponer main.luau o Scripts/*.luau. Los archivos auxiliares se guardan, pero esta preview no los carga automáticamente: no dependas de ellos para que main.luau funcione. Conserva el código previo salvo que el cambio lo necesite. Si no hacen falta cambios de código, files puede ser [].`;

function reply(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(data);
}

function pathOK(path) {
  return typeof path === 'string'
    && path.length <= 100
    && !path.includes('..')
    && !path.includes('\\')
    && /^(main\.luau|Scripts\/[A-Za-z0-9_-][A-Za-z0-9._/-]*\.luau)$/i.test(path);
}

function limited(ip) {
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((time) => now - time < 60000);
  if (recent.length >= 8) return false;
  recent.push(now);
  buckets.set(ip, recent);
  if (buckets.size > 500) {
    for (const [key, values] of buckets) {
      if (!values.some((time) => now - time < 60000)) buckets.delete(key);
    }
  }
  return true;
}

function parseJson(text) {
  if (typeof text !== 'string') throw new Error('DeepSeek devolvió una respuesta vacía.');
  const clean = text.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
  return JSON.parse(clean);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'Método no permitido.' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim().slice(0, 100);
  if (!limited(ip)) {
    return reply(res, 429, { error: 'Has enviado muchas peticiones seguidas. Espera un minuto y vuelve a intentarlo.' });
  }

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || key === 'replace_me') {
    return reply(res, 503, {
      error: 'Falta configurar DEEPSEEK_API_KEY en Vercel → Project Settings → Environment Variables.',
      code: 'AI_NOT_CONFIGURED'
    });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 5000) {
    return reply(res, 400, { error: 'Escribe una petición de entre 1 y 5000 caracteres.' });
  }

  const entries = Object.entries(
    body.files && typeof body.files === 'object' && !Array.isArray(body.files) ? body.files : {}
  );
  const files = [];
  let contextSize = 0;
  for (const [path, content] of entries.slice(0, 5)) {
    if (!pathOK(path) || typeof content !== 'string') continue;
    const code = content.slice(0, 9000);
    contextSize += code.length;
    if (contextSize > 26000) break;
    files.push({ path, content: code });
  }

  const objects = Array.isArray(body.scene?.objects)
    ? body.scene.objects.slice(0, 70).map((object) => ({
        name: String(object?.name || 'Object').slice(0, 50),
        type: String(object?.type || 'OBJECT').slice(0, 25),
        position: Array.isArray(object?.position)
          ? object.position.slice(0, 3).map((number) => Number(number) || 0)
          : [0, 0, 0],
        components: Array.isArray(object?.components)
          ? object.components.slice(0, 6).map((value) => String(value).slice(0, 35))
          : []
      }))
    : [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

  try {
    const upstream = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        thinking: { type: 'enabled' },
        max_tokens: 8192,
        response_format: { type: 'json_object' },
        stream: false,
        messages: [
          { role: 'system', content: RULES },
          {
            role: 'user',
            content: JSON.stringify({
              request: prompt,
              project: String(body.projectName || 'Proyecto Gorbus').slice(0, 100),
              scene: objects,
              files
            })
          }
        ]
      }),
      signal: controller.signal
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return reply(res, 502, {
        error: result?.error?.message || `DeepSeek API respondió HTTP ${upstream.status}.`,
        code: 'DEEPSEEK_UPSTREAM'
      });
    }

    const data = parseJson(result?.choices?.[0]?.message?.content);
    const proposed = Array.isArray(data.files) ? data.files.slice(0, 5) : [];
    let total = 0;
    const safeFiles = proposed
      .filter((file) => pathOK(file?.path) && typeof file.content === 'string' && file.content.length <= 24000)
      .filter((file) => {
        total += file.content.length;
        return total <= 60000;
      })
      .map((file) => ({
        path: file.path,
        content: file.content,
        summary: String(file.summary || '').slice(0, 240)
      }));

    return reply(res, 200, {
      model: MODEL,
      message: String(data.message || 'He preparado una propuesta.').slice(0, 1800),
      files: safeFiles,
      steps: Array.isArray(data.steps)
        ? data.steps.slice(0, 6).map((value) => String(value).slice(0, 200))
        : [],
      usage: result.usage
        ? {
            prompt_tokens: result.usage.prompt_tokens,
            completion_tokens: result.usage.completion_tokens,
            total_tokens: result.usage.total_tokens
          }
        : null
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return reply(res, 504, {
        error: 'DeepSeek tardó demasiado. Prueba con una petición más pequeña.',
        code: 'AI_TIMEOUT'
      });
    }
    return reply(res, 502, {
      error: error?.message || 'No se pudo completar la petición a DeepSeek.',
      code: 'AI_REQUEST_FAILED'
    });
  } finally {
    clearTimeout(timer);
  }
}
