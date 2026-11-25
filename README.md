# Gorbus Engine 0.7 — Gorbus AI + Puter account manager + Luau

Gorbus Engine es un editor 3D experimental para navegador, pensado también para Chromebook. La interfaz sigue el flujo de trabajo de las referencias que compartiste de Unity y Roblox Studio: **Toolbox a la izquierda, viewport 3D en el centro, Explorer y Properties a la derecha, Play/Pause/Stop arriba y Project/Console/Luau Scripts abajo**. Es una interfaz original de Gorbus, no una copia exacta.

## Gorbus AI

Gorbus AI está integrado en el editor. Puede leer el contexto de la escena y los scripts, proponer archivos Luau completos y abrirlos como pestañas de código. La escritura aparece progresivamente en el editor. Los archivos se quedan como borradores hasta que pulses **Aplicar al proyecto**; puedes modificarlos o descartarlos.

### Modelo fijo

- Modelo fijo: **DeepSeek V4.1 Flash** (`deepseek/deepseek-v4.1-flash`).
- Puter selecciona automáticamente un proveedor que sirva ese modelo; Gorbus no fuerza `provider: "deepseek"`.
- Se deja activado el enrutamiento/fallback normal de Puter para evitar el error «Model ... is not served by provider deepseek».
- No se fija `reasoning_effort`: la documentación genérica de Puter limita esa opción a modelos OpenAI.
- No existe selector de modelos en Gorbus Engine.

La documentación oficial de Puter muestra directamente este identificador en sus ejemplos de `puter.ai.chat()` y lo incluye entre los modelos DeepSeek disponibles. Eso no significa que el modelo esté entrenado específicamente para la API de Gorbus o que sea infalible con Luau: el asistente añade instrucciones especializadas, ejemplos y la API real disponible en el motor.

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
| Asistente IA | Puter.js + DeepSeek V4.1 Flash |
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


## Corrección 0.6.1 — enrutamiento de Puter

La versión 0.6.1 corrige el error `Model ... is not served by provider deepseek`. El modelo sigue siendo DeepSeek V4.1 Flash, pero ya no se fuerza el proveedor `deepseek`: Puter resuelve automáticamente qué proveedor sirve el modelo. También se quitan `fallback: false` y `reasoning_effort: high`, ya que no son necesarios para este modelo y el segundo parámetro está documentado por Puter como opción de modelos OpenAI. El modelo no se puede cambiar desde Gorbus.


## Gorbus Engine 0.7 — Cuenta, IA y flujo de construcción

### Cuenta y uso de Puter

El botón **Cuenta** abre el panel de cuenta integrado. Incluye:

- Estado de sesión y nombre de usuario de Puter.
- Indicador de cuenta conectada o desconectada.
- Recursos disponibles en el límite mensual de toda la cuenta.
- Uso mensual estimado y barra de progreso cuando Puter devuelve esos datos.
- Desglose de actividad por servicio de esta aplicación, número de llamadas y coste reportado.
- Actualizar los datos, conectar Puter, volver a elegir/cambiar de cuenta y cerrar sesión.
- Acceso a la web de Puter para gestionar la propia cuenta.

El panel es informativo: **no incluye compras, recargas, tarjetas ni botones de facturación**. El saldo disponible se refiere a la cuenta completa de Puter; las líneas de actividad se refieren a Gorbus. Los datos de actividad pueden tardar aproximadamente un minuto en reflejar las últimas llamadas. Si Puter no devuelve un campo, Gorbus lo muestra como no disponible en lugar de inventar una cifra.

### Gorbus AI: construir, revisar y probar

Gorbus AI adopta un flujo de trabajo inspirado en asistentes de programación como Claude, pero mantiene su identidad propia:

1. **Plan:** interpreta el objetivo, el estado del proyecto, los objetos y los scripts actuales.
2. **Construcción:** genera un script completo y autocontenido, priorizando `main.luau`.
3. **Revisión:** utiliza el compilador Luau real de `luau-web` para comprobar sintaxis antes de presentar el borrador. Si la primera versión no compila, solicita una única corrección al mismo modelo fijo y vuelve a comprobarla.
4. **Entrega:** abre las pestañas de código para que puedas revisarlas y decidir si aplicar los cambios. Después debes usar **Play** para comprobar el comportamiento real del juego.

El botón **Comprobar Luau** permite volver a compilar el borrador manualmente sin ejecutar el juego. La compilación de sintaxis no demuestra que la lógica sea correcta ni que el juego sea divertido; por eso todavía hace falta probarlo con Play y revisar los errores de la consola.

El asistente intenta entregar juegos completos con controles, reglas, colisiones, feedback, estados de victoria/derrota y reinicio, siempre que las funciones reales de Gorbus lo permitan. No debe fingir que existen APIs de Roblox ni componentes que el motor no tenga. Actualmente Gorbus ejecuta automáticamente `main.luau`; no hay todavía un cargador completo de módulos `require` para varios scripts.

### Interfaz y acabado visual

La versión 0.7 añade un panel de cuenta propio, iconos SVG consistentes, estados de sesión, foco visible, iluminación ambiental suave en las barras y paneles, reflejos discretos, estados de botones y animaciones cortas con respeto a `prefers-reduced-motion`. El flujo de trabajo de IA muestra Plan, Construcción, Revisión y Entrega.

### Modelo fijo

El modelo continúa siendo **DeepSeek V4.1 Flash** a través de Puter. Gorbus no ofrece selector de modelos ni fuerza un proveedor que pueda provocar el error «Model is not served by provider». Las mejoras de esta versión son de flujo de trabajo, contexto, compilación y experiencia de usuario; no cambian silenciosamente el modelo seleccionado.
