# Gorbus Engine 0.5 — Gorbus AI + Luau

Gorbus Engine es un editor 3D experimental que funciona en el navegador. Esta versión incorpora una pantalla inicial para crear proyectos a partir de plantillas, una biblioteca local de proyectos, un editor de escena y scripting con **Luau real** ejecutado mediante WebAssembly.

## Pensado para Chromebook

La opción más sencilla es publicar el proyecto en GitHub y desplegarlo en Vercel:

1. Descomprime el ZIP y sube el contenido de esta carpeta a un repositorio de GitHub.
2. En Vercel, importa ese repositorio.
3. Configura los ajustes de construcción:
   - **Install command:** `npm install`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Abre la dirección de Vercel en Chrome.

**Importante al subir a GitHub:** el directorio raíz del proyecto debe ser la carpeta `Gorbus_Engine`, es decir, la carpeta que contiene `package.json`, `index.html` y `src/`. No selecciones solo `src/` ni publiques el ZIP como si fuera una página estática.

Si Vercel muestra un error de compilación, comprueba los logs de instalación y que haya ejecutado `npm install` seguido de `npm run build`. El resultado publicado debe salir de `dist/`.

También se puede ejecutar con Node.js 22:

```bash
npm install
npm run dev
```

No abras `index.html` con `file://`: el editor usa módulos ES y WebAssembly, por lo que debe servirse desde Vercel o desde un servidor local. Las librerías del motor ahora se instalan como dependencias npm y se empaquetan con Vite; no se descargan desde CDNs al abrir el editor.

## Pantalla inicial y proyectos

Al abrir Gorbus aparece el **Start Center**, inspirado en los flujos de selección de proyectos de Unity Hub y Roblox Studio, con diseño visual propio:

- **Inicio:** acceso rápido a plantillas y proyectos recientes.
- **Mis proyectos:** biblioteca de proyectos guardados en el navegador actual.
- **Plantillas:** Baseplate 3D, Laboratorio físico, Plataformas y Escena vacía.
- **Nuevo proyecto:** permite elegir nombre y plantilla antes de abrir el editor.
- **Abrir proyecto:** importa archivos `.gorbus` o `.json` compatibles.

Los proyectos recientes se guardan en `localStorage` del navegador (hasta 12 entradas). No se sincronizan automáticamente entre dispositivos o navegadores. Usa **Guardar escena** para descargar una copia `.gorbus` que puedas mover a otro equipo.

## Funciones de esta preview

- Viewport 3D con Three.js, cámara orbital, cuadrícula, selección y gizmos de transformación.
- Jerarquía de objetos e Inspector para transformar objetos y cambiar materiales.
- Primitivas 3D, luces puntuales e importación de modelos `.glb` / `.gltf` para la sesión actual.
- **Play / Pause / Stop:** ejecuta la simulación y restaura las transformaciones al detenerla.
- **Física 3D con Rapier:** gravedad, cuerpos dinámicos/estáticos/kinemáticos, colliders de caja y esfera, fricción y rebote.
- **Test físico:** añade una demostración de cuerpos que caen sin borrar los objetos de tu escena.
- **Scripting Luau:** editor `main.luau`, ejecución de prueba, guardado y callbacks `onStart()`, `onUpdate(dt)` y `onStop()`.
- Guardado de escenas `.gorbus` / `.json`, con objetos, componentes físicos y script Luau.

## Luau y API de Gorbus

Gorbus utiliza el lenguaje **Luau** (el lenguaje de scripting abierto desarrollado por Roblox) mediante el paquete comunitario `luau-web`, que integra el runtime Luau en WebAssembly para navegadores. Luau ofrece tipado gradual y sintaxis como anotaciones de tipos (`dt: number`).

**Importante:** Gorbus no ejecuta el entorno de Roblox. El lenguaje es Luau, pero el motor tiene su propia API `Gorbus.*`; no incluye automáticamente `game`, `workspace`, `Instance`, servicios ni el DataModel de Roblox.

Ejemplo mínimo:

```luau
--!strict
local objectName: string = "Cube"

function onStart()
    Gorbus.log("¡Hola desde Gorbus!")
end

function onUpdate(dt: number)
    if Gorbus.isKeyDown("w") then
        Gorbus.move(objectName, 0, 0, -4 * dt)
    end
end

function onStop()
    Gorbus.log("Juego detenido")
end
```

En `examples/main.luau` hay un ejemplo WASD con impulso al pulsar Espacio. Para probarlo, crea o abre un proyecto con un objeto llamado `Cube` o `Player`, añade `Rigidbody` y `Box Collider`, abre la pestaña **Luau Scripts**, pega el ejemplo y pulsa **Play**.

### API disponible en esta preview

| Función | Descripción |
|---|---|
| `Gorbus.log(message)` | Envía un mensaje a la consola del editor. |
| `Gorbus.find(name)` | Comprueba si existe un objeto con ese nombre. |
| `Gorbus.move(name, x, y, z)` | Desplaza un objeto por ejes. |
| `Gorbus.setPosition(name, x, y, z)` | Establece su posición. |
| `Gorbus.setVelocity(name, x, y, z)` | Establece la velocidad de un Rigidbody activo. |
| `Gorbus.setHorizontalVelocity(name, x, z)` | Cambia la velocidad horizontal conservando la vertical. |
| `Gorbus.applyImpulse(name, x, y, z)` | Aplica un impulso a un Rigidbody activo. |
| `Gorbus.hasRigidbody(name)` | Comprueba si el objeto tiene cuerpo físico activo en Play. |
| `Gorbus.isKeyDown(key)` | Consulta teclas (`w`, `a`, `s`, `d`, `space`, etc.) mientras la pestaña tiene el foco. |
| `Gorbus.isKeyJustPressed(key)` | Detecta una pulsación nueva una sola vez (útil para saltar o interactuar). |
| `Gorbus.getPosition(name)` | Devuelve la posición actual como una tabla/array. |
| `Gorbus.getTime()` | Devuelve el tiempo transcurrido desde que abrió la página. |

`onUpdate(dt)` recibe el paso fijo de simulación (60 Hz) mientras Play esté activo. `setVelocity` y `applyImpulse` requieren un Rigidbody activo.

## Atajos

- `Q / W / E / R`: seleccionar, mover, rotar y escalar.
- `F`: enfocar el objeto seleccionado.
- `Ctrl + D`: duplicar selección.
- `Delete`: eliminar selección.
- `Ctrl + S`: guardar proyecto.
- `Esc`: detener Play.
- `Ctrl + Enter`: probar el script Luau desde el editor de código.

## Dependencias y ejecución

Las dependencias se declaran en `package.json` y Vite las empaqueta durante `npm run build`:

- Three.js `0.185.0`: renderizado 3D y controles.
- Rapier 3D `0.21.0` (`compat`): simulación física; se carga al iniciar Play.
- `luau-web` `1.5.1`: runtime Luau WebAssembly; se carga al ejecutar un script.
- Vite `7.x`: servidor de desarrollo y compilación.

Después de publicar el build, las librerías del motor se sirven desde los propios archivos compilados; no dependen de CDNs en tiempo de ejecución. La primera instalación y compilación sí requiere conexión para descargar dependencias npm. El proyecto evita exponer `window`, el DOM o APIs de Node al entorno de scripts; solo entrega el puente limitado `Gorbus` y `print`. Aun así, esta es una preview experimental y conviene ejecutar únicamente scripts propios o de confianza.

Luau es un proyecto de código abierto distribuido bajo licencia MIT. `luau-web` es una integración comunitaria y no un producto oficial de Roblox.

## Límites conocidos de la preview

- Es un editor de prototipos web, no un sustituto completo de Unity o Roblox Studio.
- El archivo `.gorbus` guarda escenas y scripts, pero los modelos GLB/GLTF importados no se empaquetan todavía.
- La biblioteca reciente es local al navegador y no sincroniza proyectos en la nube.
- Las herramientas de animación, audio, terreno, navegación, multijugador, prefabs avanzados y exportación de juegos aún no están implementadas.
- Este paquete corrige la resolución de dependencias y muestra un aviso visible si falla el arranque. Aun así, debe ejecutarse `npm install` y `npm run build` en Vercel o en un entorno con npm antes de probar Play en Chrome.


## Cómo se empaqueta el código fuente en GitHub

Los tres archivos principales del editor (`index.html`, `styles.css` y `src/main.js`) se guardan comprimidos en siete fragmentos dentro de `build-assets/`. Es una forma de transportar de manera fiable los archivos grandes a este repositorio. **No tienes que unirlos a mano.** El comando `npm run build` ejecuta primero `prepare.mjs`, que concatena los fragmentos, verifica su SHA-256, los descomprime y reconstruye los archivos antes de lanzar Vite. Si falta o se altera un fragmento, la compilación se detiene con un error claro.


## Gorbus AI (DeepSeek fijo)

La versión 0.5 integra **Gorbus AI**, un asistente de programación para crear y modificar scripts del proyecto:

- El botón **✦ Gorbus AI** abre el panel de conversación dentro del editor.
- La IA recibe el nombre del proyecto, los objetos de escena y el contenido de los scripts Luau guardados.
- Los archivos sugeridos aparecen en ventanas/pestañas de código y se muestran progresivamente.
- Puedes revisar y editar cada borrador; los cambios solo entran al proyecto cuando pulsas **Aplicar al proyecto**. También puedes descartarlos.
- No hay selector de modelos. El backend fija `deepseek-v4-pro` con `thinking: { type: "enabled" }`.
- La API valida las rutas y tamaños de los archivos y solo acepta `main.luau` y `Scripts/*.luau`.

**Acerca de DeepSeek-R1:** la API oficial retiró el identificador heredado `deepseek-reasoner` el 24 de julio de 2026. La API actual documenta `deepseek-v4-pro` y `deepseek-flash`; por eso Gorbus 0.5 usa V4 Pro con razonamiento activado, fijo y sin selector. No se presenta falsamente como R1. Consulta https://api-docs.deepseek.com/updates/ y https://api-docs.deepseek.com/api/list-models/.

### Activar Gorbus AI en Vercel

El asistente requiere una clave API de DeepSeek. **Nunca la escribas en el código del navegador, en GitHub ni en el chat.**

1. Abre tu proyecto de Gorbus Engine en Vercel.
2. Entra en **Settings → Environment Variables**.
3. Añade la variable `DEEPSEEK_API_KEY` y pega el secreto directamente en Vercel.
4. Activa la variable para Production y Preview.
5. Guarda y vuelve a desplegar.

El navegador solo llama a `/api/gorbus-ai`; la clave permanece en la función servidor `api/gorbus-ai.js`. Si no se ha configurado, Gorbus AI muestra el error `AI_NOT_CONFIGURED` y el resto del editor sigue disponible.

La API puede generar costes según el uso y las tarifas de DeepSeek. La cuenta, la clave y cualquier presupuesto deben ser gestionados por un adulto responsable. Hay un límite básico de ocho solicitudes por minuto por instancia, pero un sitio público todavía podría recibir llamadas de otras personas; revisa el consumo y restringe el acceso al sitio cuando sea necesario.

### Configuración del proyecto

- **Install command:** `npm install`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node:** 22 (indicado en `.nvmrc`)

`vercel.json` configura la función `api/gorbus-ai.js` y no utiliza una reescritura global que oculte la ruta de la API. El proyecto reconstruye los archivos grandes del editor desde nueve fragmentos en `build-assets/v05-source-*.br64`; `prepare.mjs` verifica SHA-256 antes de que Vite compile. No unas esos fragmentos manualmente.

Para probar también la función API en local, usa Vercel CLI (`vercel dev`) y configura `DEEPSEEK_API_KEY` como variable privada del entorno local. No abras `index.html` con `file://`.
