# Gorbus Engine (GE) 1.0.2

Editor de videojuegos 3D para navegador, pensado para funcionar también en Chromebook. La interfaz toma como referencia la distribución de Unity que compartiste: **Hierarchy** a la izquierda, **Scene** en el centro, **Inspector** a la derecha y **Project / Assets** en el panel inferior. Gorbus mantiene su propio estilo y no copia recursos o iconos de Unity.

## Qué incluye GE 1.0.1

### Interfaz y aspecto visual
- Panel Hierarchy a la izquierda, viewport Scene central, Inspector a la derecha y Assets abajo.
- Iconos SVG coherentes, estados de selección y foco visible, paneles con contraste y profundidad.
- Isla procedural con superficie de terreno y pared rocosa visual, cielo con nubes suaves y niebla.
- Sombras direccionales con mapa moderado y bloom opcional mediante EffectComposer y UnrealBloomPass.

Para probar la referencia visual: abre un proyecto, cambia la categoría de Assets a **Prefabs** y añade **Terrain** al viewport.

### Física y eventos
- Rapier 3D con EventQueue y eventos de contacto.
- Callbacks Luau: `onCollisionEnter(a, b)`, `onCollisionExit(a, b)`, `onTriggerEnter(trigger, other)` y `onTriggerExit(trigger, other)`. Reciben los nombres de los objetos; el suelo físico aparece como `World`.
- `Gorbus.raycast(ox, oy, oz, dx, dy, dz, maxDistance)` para consultas genéricas de escena.
- CCD y damping inicial para cuerpos dinámicos; ocho iteraciones de solver de Rapier.
- Collider triangular Trimesh en la superficie del terreno procedural.
- Flotabilidad y resistencia básicas al movimiento al entrar en un Water Volume. Es una aproximación sencilla, no una simulación de fluidos completa.

### Toolbox: prefabs
| Prefab | Comportamiento |
|---|---|
| Trigger Zone | Sensor invisible durante Play con eventos de entrada y salida. |
| Spawn Point | Punto de aparición; API `Gorbus.getSpawnPosition()` y `Gorbus.spawnAt(name)`. |
| Kinematic Mover | Plataforma cinemática cíclica; arrastra objetos mediante contactos/fricción de Rapier. Velocidad y waypoints editables en Inspector. |
| Water Volume | Sensor con flotabilidad y drag básicos. |
| Coin | Sensor coleccionable al tocarlo un cuerpo dinámico. |
| Button + Door | El botón detecta contacto y abre la puerta vinculada. |
| Falling Platform | Se convierte en cuerpo dinámico al recibir un contacto físico. |
| Terrain | Isla procedural con superficie Trimesh. La pared rocosa decorativa no tiene collider propio. |

### Cámaras
- Libre / Orbit.
- Tercera persona con seguimiento suave, control orbital y colisión de cámara mediante raycast visual.
- Cenital / Top-Down.
- Primera persona con ratón mediante Pointer Lock. El movimiento del personaje depende de tu script Luau.
- Transiciones suaves. En Luau: `Gorbus.setCameraMode(mode, duration)` y `Gorbus.cameraTo(x, y, z, targetX, targetY, targetZ, duration)`.

### Edición
- Deshacer / Rehacer con `Ctrl+Z`, `Ctrl+Y` y `Ctrl+Shift+Z`.
- Duplicar con `Ctrl+D` (atajo existente del editor).
- Snap de posición, rotación y escala.
- Historial de hasta 40 snapshots de escena, incluyendo metadatos de prefabs.
- Al detener Play se restauran transformaciones, estados de plataformas/puertas y waypoints para repetir la simulación.

### Gorbus AI
- Modelo fijo DeepSeek V4.1 Flash mediante Puter.js; Puter resuelve el proveedor disponible. No hay selector de modelos ni clave API propia.
- Contexto de escena, componentes, física, prefabs y waypoints.
- Flujo inspirado en asistentes de programación: plan, construcción, revisión y entrega.
- Instrucciones para construir un prototipo completo y jugable, usando APIs reales de GE y sin inventar APIs de Roblox.
- Comprueba la sintaxis de `main.luau` con `luau-web` antes de presentar la propuesta y hace un intento automático de corrección si el compilador la rechaza.
- Botón **Comprobar Luau** para volver a revisar manualmente el borrador.
- Los archivos siguen siendo propuestas: revísalos y pulsa **Aplicar al proyecto**. Después prueba la jugabilidad con **Play**.

## Las cinco prioridades de GE 1.0.1
1. **Workspace Unity-style + terreno y luz:** es el cambio visual más inmediato y hace que el editor se entienda como un entorno 3D.
2. **Física y eventos sólidos:** sin colisiones, triggers y superficies correctas, los juegos no se pueden probar con confianza.
3. **Prefabs reutilizables:** Trigger, Spawn, Mover, Water, Coin, Button/Door y Falling Platform aceleran mecánicas comunes.
4. **Cámaras listas:** Orbit, tercera persona, cenital, primera persona y transiciones desbloquean varios géneros.
5. **QoL de edición:** Undo/Redo, duplicar y snapping reducen errores y agilizan la creación de escenas.

## Funciones todavía pendientes
No se anuncian como terminadas en GE 1.0.1: AudioSource, emisión de partículas, SSAO, presets gráficos completos, edición en vivo durante Play y exportación del juego a un único HTML independiente. Bloom, sombras y niebla sí están presentes, pero el panel de postprocesado todavía no ofrece SSAO ni todos los presets. Tampoco hay sistema 2D, multijugador, terrain sculpting, controlador de personaje integrado ni cargador de módulos `require`; `main.luau` sigue siendo el punto de entrada ejecutado.

El Kinematic Mover utiliza cuerpos cinemáticos y contactos/fricción de Rapier para mover objetos que van encima; el resultado depende de la geometría, masa y velocidad. Water Volume aplica una fuerza vertical y resistencia aproximadas a partir del solapamiento de volúmenes, no simula corrientes ni olas. La cámara de tercera persona usa un raycast visual contra los meshes de la escena, no contra la simulación física.

## Ejecutar localmente
Necesitas Node.js 22 y conexión a Internet para instalar dependencias.

```bash
npm install
npm run dev
```

Validación y build de producción:

```bash
npm run check
npm run build
```

En Vercel: instalación `npm install`, build `npm run build`, directorio `dist`. Gorbus AI solicita que cada usuario conecte su propia cuenta Puter dentro del editor.

## Tecnologías
| Parte | Tecnología |
|---|---|
| Render y viewport | Three.js 0.185 |
| Física | Rapier 3D 0.21 |
| Lenguaje de scripts | Luau WebAssembly (`luau-web`) |
| IA | Puter.js + DeepSeek V4.1 Flash |
| Build | Vite 7 |

GE 1.0.1 es un editor web en desarrollo, no un reemplazo completo de Unity o Roblox Studio. El compilador Luau valida sintaxis; el comportamiento del juego debe probarse con **Play**.


## GE 1.0.2 — Gorbus AI en directo y archivos adjuntos

### Escritura de scripts en tiempo real
- Gorbus AI transmite la respuesta de Puter y el editor detecta progresivamente los campos `path` y `content` del JSON.
- Cuando comienza a llegar el contenido de `main.luau` o `Scripts/*.luau`, la pestaña aparece y el borrador se actualiza mientras llegan los fragmentos.
- La cabecera muestra el estado **EN DIRECTO**. El borrador queda en solo lectura durante la generación para evitar que la escritura entrante sobrescriba cambios manuales.
- Si se generan varios archivos, aparecen sus pestañas y se muestra el que se está escribiendo.
- Cuando termina la respuesta, vuelve a habilitarse la edición manual. Los cambios siguen siendo borradores hasta pulsar **Aplicar al proyecto**.
- La autocorrección de sintaxis Luau también puede mostrar la segunda escritura en directo.

### Adjuntar archivos
Usa **Adjuntar archivos** o arrastra archivos al cuadro de Gorbus AI. Se leen como texto y se incorporan al contexto de la petición. Formatos admitidos: JavaScript y TypeScript, HTML, CSS, JSON/JSONC, Markdown, TXT, CSV, XML, SVG, YAML, TOML, Python, C/C++, C#, Java, Go, Rust, SQL, Lua/Luau, shell, Vue, Svelte, Astro, shaders y otros archivos de texto de configuración.

Límites: hasta 5 archivos, 128 KB por archivo y 384 KB en total. Puedes quitar cada adjunto antes de enviar. Los formatos binarios (por ejemplo, PDF, ZIP, imágenes y ejecutables) no se interpretan con este lector de texto. Los archivos se leen como contenido, no se ejecutan.

Gorbus AI puede explicar, revisar o tomar como referencia los adjuntos. El asistente sigue generando scripts Luau dentro de los paths admitidos por el motor; adjuntar un HTML o JavaScript no significa que el runtime del juego pueda ejecutar esos archivos ni que se apliquen automáticamente al propio editor.


## GE 1.0.3 — cámara de juego, ratón y matemáticas Luau

### API Luau añadida

| Método | Comportamiento |
|---|---|
| `Gorbus.lockMouse(boolean)` | Solicita Pointer Lock durante Play o libera el cursor con `false`. Devuelve un booleano indicando si la solicitud pudo iniciarse. |
| `Gorbus.getMouseDelta()` | Devuelve `{ x, y }` con el movimiento acumulado en píxeles desde la lectura anterior. Se reinicia al leerlo; úsalo una vez por `onUpdate`. |
| `Gorbus.setCameraPosition(x, y, z)` | Coloca la cámara de juego en coordenadas de mundo. |
| `Gorbus.setCameraRotation(x, y, z)` | Establece la rotación Euler en radianes, orden YXZ: X = pitch, Y = yaw, Z = roll. |
| `Gorbus.getObjectPosition(name)` | Devuelve `{ x, y, z }` o `nil`. Si el objeto tiene cuerpo Rapier, lee la posición física actual. |

### Cámara de juego

- El nuevo modo `Gorbus.setCameraMode("game")` desactiva OrbitControls y deja la cámara bajo control directo de Luau.
- En **Añadir componente** existe el componente **Camera**. Al iniciar Play, la primera cámara encontrada pasa a ser la cámara de juego y usa la posición y orientación del objeto que la contiene.
- Al pulsar Stop se restaura la cámara del editor y se libera Pointer Lock.
- Las llamadas `setCameraPosition` y `setCameraRotation` también activan el modo `game`, por lo que un script puede controlar la cámara sin añadir el componente Camera.
- El ejemplo `examples/first-person-camera.luau` muestra movimiento WASD relativo al yaw, control del ratón, cámara a la altura de la cabeza y salto con Rigidbody.

**Permiso del navegador:** Pointer Lock necesita una acción directa del usuario. Si `Gorbus.lockMouse(true)` se llama desde `onStart` y el navegador bloquea la solicitud asíncrona, Gorbus muestra el botón **Capturar ratón**. Haz clic una vez para autorizarlo. Pulsa Esc para liberar el cursor y detener Play.

### Matemáticas Luau

`math.sin`, `math.cos`, `math.rad`, `math.pi`, `math.clamp` y `math.sqrt` pertenecen a la biblioteca estándar de Luau. No son APIs de Roblox ni requieren módulos adicionales. GE 1.0.3 ejecuta una prueba de humo sobre `sin`, `cos` y `rad` al inicializar el intérprete y falla con un mensaje explícito si falta alguna función.

Ejemplo de dirección según el yaw:

```lua
local forwardX = math.sin(yaw)
local forwardZ = -math.cos(yaw)
local rightX = math.cos(yaw)
local rightZ = math.sin(yaw)
```

### Alcance y limitaciones

Pointer Lock depende de permisos y soporte del navegador; el botón de autorización es la alternativa si una llamada programática no conserva el gesto del usuario. `getMouseDelta` devuelve desplazamiento en píxeles, no una velocidad física independiente del intervalo; el script puede dividirlo por `dt` si necesita una tasa. El componente Camera activa la primera cámara de la escena; todavía no hay selector de prioridad para varias cámaras.
