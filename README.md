# Gorbus Engine — GE 2.0.0 Patched

Editor web para desarrollar juegos 2D y 3D con Three.js, Rapier y scripts Luau. Esta entrega amplía la base GE 1.0.4.

## Qué incluye

### Edición 2D y 3D
- Proyectos 2D con cámara ortográfica en plano XY y profundidad restringida.
- Proyectos 3D con cámara en perspectiva y espacio XYZ.
- Plantillas de plataformas 2D, escena vacía 2D y varias escenas 3D.

### Scripts, componentes y herramientas
- `main.luau` como script principal y scripts Luau individuales en `Scripts/*.luau`.
- Cada script individual tiene un entorno propio y callbacks `onStart`, `onUpdate` y `onStop`.
- Componentes físicos Rigidbody y colliders de caja, esfera y cápsula.
- Herramientas equipables: linterna, escáner, mochila propulsora y botas de impulso.
- API Luau: `Gorbus.addTool("Player", "jetpack")`, `Gorbus.hasTool(...)` y `Gorbus.useTool("Player", "jetpack", 8)`. La mochila aplica impulso vertical y las botas aplican un impulso hacia delante; ambas requieren un Rigidbody dinámico.

### Modelos, rig y animación
- Importación GLB y glTF de Meshy AI, Blender u otras herramientas compatibles. Los recursos quedan incrustados en el `.gorbus`.
- Se conservan clips de animación incluidos en el GLB/glTF y se pueden reproducir mediante Animation Mixer.
- Panel RIG para visualizar esqueletos, seleccionar huesos, editar la pose y guardarla.
- Auto-Rig básico de tres huesos (Root, Spine y Head) para una malla estática sencilla de un solo mesh. No sustituye a un rig humanoide profesional, pesos pintados manualmente ni retargeting.
- Modelado procedural: árbol low-poly, escaleras, arco, rampa, torre, plataformas, robot y barril.
- Operaciones de malla: centrar pivote, aplicar escala, duplicar en espejo X y restablecer transform.

### Mecánicas listas para usar
- Prefabs base: checkpoint/spawn, coleccionable, plataforma móvil, botón y puerta, plataforma que cae, zona trigger, volumen de agua y terreno procedural.
- Nuevas mecánicas GE 2.0.0: **Bounce Pad** (impulsa cuerpos dinámicos al contacto) y **Rotating Hazard** (obstáculo con cuerpo cinemático y collider activo).
- En proyectos 2D los dos prefabs nuevos se orientan al plano XY; en 3D funcionan en el espacio XYZ.

### Gorbus AI — modelo fijo
- Modelo único, sin selector ni catálogo: **NVIDIA Nemotron 3 Ultra 550B A55B**.
- Identificador Puter: `nvidia/nemotron-3-ultra-550b-a55b:free`.
- Gorbus muestra el modelo fijo y el uso de la sesión. También mantiene la información de consumo mensual que Puter facilita.
- El identificador `:free` corresponde a una variante gratuita anunciada por Puter. La disponibilidad, las cuotas y los límites siguen dependiendo de Puter y de la cuenta; no se promete uso ilimitado ni disponibilidad permanente.
- Gorbus AI puede proponer objetos, prefabs, archivos Luau y pasos de construcción. Las acciones de escena se revisan y se aplican mediante **Aplicar al proyecto**.
- La IA puede proponer los nuevos prefabs `bounce-pad` y `rotating-hazard` mediante acciones `createPrefab`.

### Pruebas
- **Ejecutar tests** valida nombres, transforms, geometrías, referencias de scripts y compila `main.luau` y `Scripts/*.luau` sin ejecutar el código durante esa fase.
- **Play Test + runtime** inicia la simulación y comprueba mundo Rapier, cuerpos dinámicos, cámara y scripts cargados.
- La prueba de runtime es un smoke test del motor; no es un jugador IA autónomo que complete niveles ni una certificación de equilibrio o diversión. La jugabilidad debe revisarse manualmente.

## Roadmap — GE 2.1 y siguientes

Las propuestas nuevas se están organizando en un roadmap separado para distinguir las funciones ya disponibles de las que todavía hay que diseñar, implementar y medir:

- Rendimiento para escenas densas: ECS/batching, instancing, culling, pooling y perfilador.
- Herramienta de selección múltiple **Colocar con física** para distribuir y asentar grupos de objetos en el mundo.
- **Crowd Bake** para optimizar grupos de personajes y estudiar escenarios de 100, 250 y 500 figuras animadas.
- Animador inteligente por poses clave, interpolación y biblioteca de animaciones utilizables.
- Editor de UI in-game responsive con botones, imágenes, efectos, estados y animaciones.
- Integración de HTML/CSS/JavaScript para interfaces y lógica complementaria, con evaluación técnica de RmlUi antes de elegir una solución.
- Nuevos paquetes de assets y flujos de creación de mundos/niveles asistidos por Gorbus AI.

Estas funciones son objetivos de desarrollo, no capacidades que GE 2.0.0 ya prometa tener. El diseño técnico, prioridades, pruebas y límites están en [docs/GE_2.1_ROADMAP.md](docs/GE_2.1_ROADMAP.md).

## GE 2.1 Preview — herramientas de mundo

- **Selección múltiple:** en Hierarchy usa Ctrl/Cmd + clic para añadir o quitar objetos y Shift + clic para seleccionar un rango. En Scene, Ctrl/Cmd + clic también añade o quita el objeto bajo el cursor.
- **Seleccionar todo / Limpiar selección:** accesos directos en el panel Diseño de mundos.
- **Colocar con física:** ejecuta una simulación Rapier temporal sobre los objetos seleccionados (hasta 300 por operación), usa los colliders de objetos no seleccionados como soportes cuando existen y aplica las posiciones finales sin iniciar Play. La operación respeta el plano XY en proyectos 2D.
- El asentamiento usa colliders simplificados de caja/esfera/cápsula a partir de los bounds del modelo. Los meshes complejos/terrenos y los rigs no se convierten en colisiones exactas durante este bake; revisa el resultado antes de continuar.

La restauración aplica estas herramientas después de GE 2.0.0 en cada ejecución de `npm run dev`, `npm run check` y `npm run build`. El verificador `scripts/verify-ge-2.1-world-tools.mjs` comprueba la presencia de los controles y rutas de código; no sustituye una prueba visual de selección ni un test manual de equilibrio con escenas reales.

## Importar modelos

1. Exporta el modelo como `.glb` o `.gltf`.
2. Para `.gltf`, incrusta los buffers e imágenes como data URI; si usa archivos externos, expórtalo como `.glb`.
3. Usa el botón de importar modelo del editor. Límite: 30 MB por archivo.
4. Guarda el proyecto como `.gorbus` para conservar el modelo dentro del proyecto.

## Cómo se restauran las fuentes de GE 2.0.0

El repositorio conserva el sistema de capas comprimidas que ya utilizaba el proyecto. El código de GE 2.0.0 se almacena en `build-assets/ge200-overlay-*.br64`; `prepare.mjs` concatena los diez fragmentos, valida el SHA-256 del archivo comprimido y restaura únicamente las rutas permitidas antes de aplicar las mejoras al editor. Así, `npm run dev`, `npm run check` y `npm run build` parten de las mismas fuentes restauradas. No edites los fragmentos a mano: cambia el archivo fuente restaurado, actualiza el overlay y su hash como una única operación.

## Ejecutar localmente

Requisitos: Node.js `>=20.19` (se recomienda Node 22) y conexión a Internet para instalar dependencias.

```bash
npm install
npm run dev
```

Comprobaciones estructurales y de sintaxis del proyecto:

```bash
npm run check:static
```

Comprobación completa, una vez instaladas las dependencias:

```bash
npm run check
```

Build de producción:

```bash
npm run build
```

Para Vercel: instalación `npm install`, build `npm run build`, directorio de salida `dist`.

## Port nativo de STRYDE v1.4

Se ha iniciado un port nativo del juego STRYDE v1.4 en `ports/stryde-v14/`. El primer prototipo jugable es **Campo Orión / Entrenamiento**: escena `.gorbus`, script Luau, jugador FPS, controles de ratón, cuatro perfiles de arma y seis dianas. Es una primera fase; los otros modos, bots, tienda, progreso persistente, audio y HUD nativo aún no están portados. Consulta `ports/stryde-v14/README.md` para importarlo.

## Tecnologías

- Three.js `0.185.0` — render y viewport.
- Rapier 3D `0.21.0` — física.
- `luau-web` `1.5.1` — compilador/runtime Luau.
- Puter.js — acceso a Gorbus AI con el modelo fijo descrito arriba.
- Vite 7 — desarrollo y build.

## Estado de validación

Las comprobaciones estáticas del código fuente y los generadores de proyecto se ejecutan mediante `npm run check:static`. El build Vite y la ejecución interactiva deben realizarse después de instalar dependencias en el entorno de despliegue. El smoke test Play Test se ejecuta dentro del editor; no puede sustituirse por una comprobación estática del ZIP.
