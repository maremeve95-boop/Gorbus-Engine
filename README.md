# Gorbus Engine 0.6 — Puter AI + Luau + Studio UI

Gorbus Engine es un editor 3D experimental para navegador, pensado también para Chromebook. La interfaz sigue el flujo de trabajo de las referencias que compartiste de Unity y Roblox Studio: **Toolbox a la izquierda, viewport 3D en el centro, Explorer y Properties a la derecha, Play/Pause/Stop arriba y Project/Console/Luau Scripts abajo**. Es una interfaz original de Gorbus, no una copia exacta.

## Gorbus AI

Gorbus AI está integrado en el editor. Puede leer el contexto de la escena y los scripts, proponer archivos Luau completos y abrirlos como pestañas de código. La escritura aparece progresivamente en el editor. Los archivos se quedan como borradores hasta que pulses **Aplicar al proyecto**; puedes modificarlos o descartarlos.

### Modelo fijo

- Proveedor: **DeepSeek**, a través de Puter.js.
- Modelo fijo: **DeepSeek V4.1 Flash 1017** (`deepseek/deepseek-v4.1-flash-1017`).
- Razonamiento: `high`.
- `fallback: false`: si el proveedor DeepSeek o ese modelo no está disponible, Gorbus muestra el error en vez de cambiar silenciosamente a otro proveedor.
- No existe selector de modelos en Gorbus Engine.

La ficha de Puter describe esta actualización de octubre de 2026 como una versión mejorada para tareas de programación y agentes de código. Eso no significa que el modelo esté entrenado específicamente para la API de Gorbus o que sea infalible con Luau: el asistente añade instrucciones especializadas, ejemplos y la API real disponible en el motor.

### Conectar Puter

1. Publica el proyecto con Vercel o usa otro dominio HTTPS. No abras `index.html` con `file://`.
2. Entra al editor y abre **Gorbus AI**.
3. Pulsa **Conectar Puter** y completa el inicio de sesión.
4. Escribe una petición, por ejemplo: “Crea un juego de Pong 2.5D con dos palas, pelota, puntuación y controles”.
5. Revisa las pestañas de código y pulsa **Aplicar al proyecto** cuando estés conforme.

No se necesita `DEEPSEEK_API_KEY` ni un endpoint propio que guarde claves. Puter.js proporciona la autenticación y las llamadas a modelos directamente desde el navegador. El uso de IA se asocia a la cuenta de Puter conectada y puede consumir sus cuotas/recursos; no añadas métodos de pago ni compres planes para probar el prototipo. Cualquier ajuste de facturación debe gestionarlo un adulto responsable.

## Interfaz del editor

- **Toolbox:** primitivas, luces, prueba física, importación de modelos y acceso a scripts.
- **Viewport:** escena 3D en Three.js, cámara orbital, cuadrícula, selección y gizmos.
- **Explorer:** lista y búsqueda de objetos de la escena.
- **Properties:** transformaciones, materiales, color y componentes físicos.
- **Barra superior:** seleccionar, mover, escalar, rotar, Play, Pause, Stop y Test físico.
- **Panel inferior:** proyecto, consola y editor Luau.
- **Menús Ver y Ventana:** muestran/ocultan la cuadrícula, estadísticas, panel inferior y accesos a Proyecto, Consola, Luau Scripts y Gorbus AI.

## Motor y scripting

| Subsistema | Tecnología |
|---|---|
| Editor 3D | Three.js |
| Física 3D | Rapier |
| Lenguaje | Luau real en WebAssembly (`luau-web`) |
| Asistente IA | Puter.js + DeepSeek V4.1 Flash 1017 |
| Build | Vite |

El script principal que ejecuta esta preview es `main.luau`. Usa `onStart()`, `onUpdate(dt: number)` y `onStop()`. La API de Gorbus incluye `Gorbus.log`, `find`, `createObject`, `destroyObject`, `move`, `setPosition`, `getPosition`, `setScale`, `setColor`, `setVelocity`, `setHorizontalVelocity`, `applyImpulse`, `hasRigidbody`, `isKeyDown`, `isKeyJustPressed` y `getTime`.

Gorbus usa el lenguaje Luau, pero **no incluye el DataModel de Roblox**: no existen `game`, `workspace`, `Instance`, servicios Roblox ni sus módulos. El motor actual es 3D; una petición como Pong 2D puede implementarse como prototipo 2.5D con primitivas, pero todavía no hay un motor 2D dedicado. El modelo debe limitarse a APIs que realmente existan y explicar cualquier aproximación.

## Ejecutar y desplegar

Necesitas Node.js 22 y conexión a Internet para instalar dependencias.

```bash
npm install
npm run dev
```

En Vercel usa: **Install** `npm install`, **Build** `npm run build`, **Output** `dist`. No hay variable secreta que configurar para Gorbus AI; la persona que use la aplicación inicia sesión en Puter desde el propio editor.

## Límites de esta preview

Gorbus Engine sigue siendo un prototipo de editor web, no un sustituto completo de Unity o Roblox Studio. El asistente propone código, pero no puede compilar un juego final ni inventarse componentes ausentes. Los archivos auxiliares `Scripts/*.luau` pueden aparecer como propuestas, pero la preview ejecuta automáticamente `main.luau`; no carga todavía una arquitectura completa de módulos. Tampoco hay todavía un exportador de juegos completo, multiplayer, terreno avanzado, animaciones complejas ni un sistema de UI 2D.

## Cómo se prepara el código en GitHub

Los archivos principales del editor se guardan en diez fragmentos dentro de `build-assets/v06-source-*.br64`. No tienes que unirlos a mano: `npm run dev` y `npm run build` ejecutan primero `prepare.mjs`, que concatena los fragmentos, verifica SHA-256, restaura los tres archivos y aplica los pequeños parches del menú antes de arrancar Vite.
