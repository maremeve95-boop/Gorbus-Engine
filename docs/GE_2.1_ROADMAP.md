# Gorbus Engine — Roadmap técnico GE 2.1+

Este documento recoge las próximas líneas de trabajo propuestas para Gorbus Engine. **No describe funciones que ya estén disponibles en GE 2.0.0**: las marca como objetivos de diseño y define cómo comprobarlas antes de anunciarlas.

## Entregado en GE 2.1 Preview — herramientas de mundo

- [x] Selección múltiple desde Hierarchy con Ctrl/Cmd y Shift, además de selección múltiple desde Scene con Ctrl/Cmd.
- [x] Seleccionar todo y limpiar selección.
- [x] Colocación por lotes con un mundo Rapier temporal, límite de 300 objetos por operación y soporte de colliders fijos existentes.
- [x] Detección recursiva de geometría en modelos GLB anidados y cálculo de bounds en el espacio local del objeto, incluyendo offsets de collider.
- [x] Mantener anclados los colliders configurados como fijos y el terreno cuando se usa Seleccionar todo.
- [x] Restricción al plano XY para proyectos 2D.

Limitaciones de esta primera versión: usa formas simplificadas derivadas de bounding boxes (aunque recorre las mallas anidadas y respeta sus transformaciones y centros locales); mantiene los colliders configurados como fijos y el terreno como anclajes, no hace mesh-collision exacta, no hornea rigs animados como cuerpos físicos, no ofrece todavía una previsualización/cancelación completa y necesita revisar el resultado final. La simulación se usa como herramienta de edición previa, no durante Play.

## Objetivos

### 1. Rendimiento del motor y escenas grandes
- Crear un perfilador de escena que mida tiempo de CPU, render, física, scripts, memoria, draw calls y número de entidades/componentes.
- Introducir una arquitectura ECS progresiva: datos de entidades separados de los objetos visuales de Three.js y sistemas especializados para Transform, Render, Physics, Animation y Script.
- Mantener compatibilidad con los proyectos actuales durante la migración. No reescribir todo el motor de golpe.
- Añadir actualización por demanda para objetos estáticos, spatial hashing/culling, pooling y batching/instancing cuando los objetos compartan geometría y material.
- Medir mejoras en escenas de referencia y comparar FPS, frame time y memoria antes/después.

**Criterio:** el objetivo no será prometer «infinitos objetos», sino publicar resultados reproducibles con escenas y dispositivos de prueba concretos.

### 2. Diseño de mundos y colocación física por lotes — ampliaciones pendientes
- Ampliar la selección múltiple actual a Assets y a más flujos de Scene.
- Añadir operaciones de lote: colocar sobre superficie, distribuir en cuadrícula, ordenar por filas, dispersar con semilla, alinear y agrupar.
- Crear una acción **Colocar con física** que genere una previsualización, compruebe colisiones y deje que Rapier estabilice los cuerpos dentro de un límite de tiempo/iteraciones.
- Ofrecer opciones para conservar o restablecer posición, rotación, escala y tipo de Rigidbody; excluir objetos anclados o marcados como estáticos.
- Permitir cancelar y deshacer la operación completa como una sola acción.

**Criterio:** no deben quedar objetos atravesados, fuera del nivel o con velocidades residuales; las excepciones se deben señalar antes de aplicar el resultado.

### 3. Multitudes y animación optimizada
- Añadir un flujo de **Crowd Bake** que analice rigs, jerarquías óseas, clips, materiales y mallas antes de iniciar Play.
- Agrupar personajes compatibles por esqueleto, geometría y material; compartir recursos siempre que sea posible.
- Evaluar baking de animaciones a texturas/paletas de poses y renderizado instanciado para multitudes repetidas, con LOD por distancia y actualización escalonada.
- Mantener rigs individuales tradicionales cuando el personaje necesite IK, física, interacción o animación única.
- Crear una escena benchmark con 100, 250 y 500 personajes, con perfiles de calidad para escritorio y móvil.

**Criterio:** «500 personajes» será una meta de benchmark para personajes compatibles y optimizados, no una garantía universal para 500 rigs distintos en cualquier móvil.

### 4. Animador inteligente
- Crear un editor de poses clave donde el usuario solo tenga que definir poses principales y tiempos.
- Interpolar posiciones y rotaciones de huesos con curvas editables, suavizado y control de pies/manos cuando el rig lo permita.
- Incorporar biblioteca de clips listos para usar, siempre con licencia y metadatos visibles.
- Añadir un grafo de estados para mezclar Idle, Walk, Run, Jump y acciones; permitir transición y mezcla según velocidad/inputs.
- Investigar retargeting entre esqueletos compatibles e IK como etapas separadas.
- Gorbus AI podrá proponer poses, tiempos o transiciones, pero el resultado tendrá previsualización y edición manual.

**Límite:** unas pocas poses no bastan para generar automáticamente cualquier animación profesional. El sistema inicial se centrará en interpolación, plantillas y rigs compatibles.

### 5. UI dentro del juego
- Incorporar un editor visual de UI en pantalla y en espacio 3D: texto, imágenes, paneles, botones, barras, iconos y contenedores.
- Añadir estilos, bordes, gradientes, sombras, brillos, partículas ligeras, estados hover/pressed/disabled y transiciones.
- Crear layouts responsive mediante anchors, constraints, flex/grid y áreas seguras para móviles/notches.
- Incluir previsualización de móvil vertical, móvil horizontal, tablet y escritorio con cambios de tamaño en directo.
- Exponer eventos como `onClick`, `onHover`, `onValueChanged` y navegación por teclado/táctil a Luau y JavaScript.
- Mantener el árbol UI separado de la física del mundo y evitar que el código de UI pueda acceder libremente a APIs sensibles.

### 6. HTML, CSS y JavaScript
- Añadir archivos de UI web como recursos nativos del proyecto (`UI/*.html`, `UI/*.css`, `UI/*.js`).
- Renderizar la UI 2D mediante una capa DOM aislada y responsive; conectar botones y eventos con una API explícita del motor.
- Permitir usar HTML/CSS para interfaces avanzadas sin obligar a abandonar Luau para gameplay y física.
- Investigar un modo de juego web completo y el aislamiento de scripts antes de prometer soporte total de HTML/JS como sustituto del runtime.
- Evaluar RmlUi como alternativa opcional solo después de comprobar su build WebAssembly, compatibilidad CSS real, accesibilidad, tamaño y mantenimiento. No se debe integrar una segunda UI runtime sin una ventaja medida frente a DOM/CSS.

### 7. Biblioteca de assets
- Añadir packs por categoría (naturaleza, ciudad, interiores, sci-fi, personajes, UI, audio y VFX), con miniaturas, etiquetas, tamaño y licencias.
- Permitir añadir packs completos y filtrar/buscar assets sin ir seleccionando archivos individualmente.
- Incluir herramientas de validación de recursos: rutas rotas, texturas ausentes, escalas anómalas, mallas vacías, rigs incompatibles y materiales duplicados.

### 8. Gorbus AI como asistente de construcción
- Permitir que Gorbus AI cree propuestas de escenas, niveles, assets procedurales, animaciones y UI HTML/CSS/JS.
- Mostrar un plan de cambios y una previsualización antes de aplicar modificaciones al proyecto.
- Validar referencias, scripts, formatos y tests disponibles; explicar qué no pudo crear o probar.

## Orden recomendado

1. Perfilador y benchmark base.
2. Selección múltiple + colocación física por lotes + Undo atómico.
3. Batching/instancing y culling para objetos repetidos.
4. Crowd Bake y benchmark de 100/250/500 personajes.
5. Editor de poses clave y grafo de animación.
6. UI responsive integrada con HTML/CSS/JS y puente seguro a Luau.
7. Biblioteca de assets y generación asistida por Gorbus AI.

## Definición de terminado

Cada función nueva debe incluir una demo reproducible, pruebas automáticas donde sea viable, mediciones antes/después para rendimiento y una lista explícita de dispositivos/casos probados. Si una capacidad solo funciona con límites concretos, esos límites deben aparecer en la interfaz y la documentación.
