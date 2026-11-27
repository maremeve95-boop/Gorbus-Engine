# Gorbus AI 2.0 — Benchmark de construcción de juegos

Este documento contiene una prueba práctica para evaluar si Gorbus AI puede construir, configurar, programar y comprobar proyectos dentro de Gorbus Engine.

> **Regla de honestidad:** el asistente solo puede marcar una operación como completada después de ejecutarla y verificar su resultado en el editor/runtime. Si una herramienta, componente o API no existe en la versión abierta del motor, debe marcarla como **NO DISPONIBLE** y proponer una alternativa compatible. No debe inventar APIs, logs, objetos ni resultados de pruebas.

## Objetivo

Crear un proyecto llamado **Gorbus AI Benchmark** con dos escenas independientes:

- **Neon Adventure 3D:** pequeño recorrido de plataformas en tercera persona.
- **Pixel Adventure 2D:** pequeño plataformas de desplazamiento lateral en un plano 2D real.

Trabaja dentro de un proyecto nuevo o de una copia. No sobrescribas proyectos del usuario ni borres recursos existentes.

## 0. Inspección y plan

Antes de editar:

1. Detecta la versión exacta de Gorbus Engine.
2. Inspecciona las herramientas, componentes, APIs Luau y formatos de escena disponibles.
3. Comprueba qué funciones de 2D, scripts por objeto, RIG, animación, importación de modelos y Play Test existen realmente.
4. Presenta un plan breve con operaciones concretas y separa las funciones disponibles de las que no lo están.
5. Crea el proyecto y guarda un punto de restauración antes de comenzar.

No inventes nombres de componentes ni métodos. Consulta el API del motor o los componentes visibles en el editor.

## 1. Escena 3D — Neon Adventure

Construye una escena pequeña pero jugable con:

- Un suelo amplio, iluminación y ambiente visual coherente.
- Un objeto de jugador llamado `Player`.
- Capsule Collider y cuerpo físico adecuados para un personaje.
- Controles WASD, salto y cámara en tercera persona con seguimiento suave.
- Plataformas elevadas y un recorrido con dificultad progresiva.
- Cinco cristales coleccionables.
- Un trampolín que aplique un impulso vertical al jugador.
- Un obstáculo giratorio con colisión.
- Una puerta de salida que solo se active al conseguir los cinco cristales.
- Un punto de aparición y una zona de reinicio si el jugador cae.

Usa el controlador y las APIs reales de la versión detectada. No escribas un controlador alternativo si el motor ya proporciona uno adecuado.

## 2. Escena 2D — Pixel Adventure

Construye una segunda escena que utilice el modo 2D real del motor:

- Cámara ortográfica y vista lateral.
- Movimiento del jugador en el plano XY.
- Gravedad, salto y colisiones con el suelo.
- Plataformas con distintas alturas.
- Monedas coleccionables y contador.
- Una meta que se active al recoger todas las monedas.
- Reinicio al caer fuera del escenario.

No presentes una escena 3D con objetos aplastados en profundidad como si fuera un sistema 2D nativo. Si el motor no dispone de modo 2D real, informa de ello y deja esta escena sin marcar como completada.

## 3. Scripts individuales por objeto

Siempre que el motor lo permita, asigna scripts independientes a los objetos:

| Objeto | Responsabilidad |
|---|---|
| `Player` | Movimiento, salto y estado del jugador |
| `Crystal` / `Coin` | Detección de recogida y actualización del contador |
| `Trampoline` | Impulso al jugador |
| `RotatingObstacle` | Movimiento giratorio y colisión |
| `ExitDoor` | Comprobación del objetivo y apertura |
| `SpawnPoint` | Aparición o reinicio |

Cada script debe tener una única responsabilidad, nombres claros y manejo de referencias inexistentes. Evita duplicar la misma lógica en varios archivos.

Si la versión del motor solo ejecuta un script principal, no simules que los scripts adjuntos se ejecutan: documenta la limitación y utiliza una arquitectura modular compatible con el runtime disponible.

## 4. Modelado y recursos

Utiliza las herramientas de modelado disponibles para crear:

- Un barril.
- Una caja.
- Una rampa.
- Un pequeño robot.
- Un personaje humanoide básico.

Prioriza geometría procedural y recursos integrados para que el proyecto se pueda abrir sin rutas externas.

Comprueba las operaciones de transformación, pivote, escala y espejo si existen. Si importas un recurso externo, conserva el archivo dentro del proyecto y verifica que vuelva a cargar después de cerrar y abrir la escena.

## 5. RIG y animación

Comprueba las funciones reales de rigging y animación antes de utilizarlas.

Si están disponibles:

1. Crea o importa un personaje con esqueleto.
2. Añade huesos y jerarquía coherentes.
3. Comprueba la asignación de malla al esqueleto (skinning).
4. Crea o importa clips de reposo y caminar.
5. Reproduce los clips y verifica que el personaje se deforme correctamente.
6. Comprueba la transición entre reposo y caminar.

No confundas una jerarquía de objetos vacíos con un rig funcional. No marques el skinning o la animación como completados si solo se han creado huesos sin deformación o clips sin reproducción.

Si el motor no permite crear rigs, informa de la limitación y deja preparada una ruta de importación compatible si existe.

## 6. Herramientas del jugador

Si el sistema de herramientas está implementado, configura:

- **Linterna:** ilumina la zona delante del jugador.
- **Escáner:** detecta objetos interactivos cercanos y muestra sus nombres.
- **Jetpack:** aplica un impulso controlado con duración o energía limitada.
- **Botas de impulso:** aumentan el salto durante un intervalo breve.

Cada herramienta debe tener activación, desactivación, estado y límites claros. Evita que el jugador pueda acumular impulsos indefinidamente o activar una herramienta que no exista.

## 7. Gorbus AI — Operaciones visibles

Muestra el progreso en un registro vinculado a operaciones reales. Utiliza estados como:

1. Inspeccionando el proyecto.
2. Preparando las escenas.
3. Creando objetos.
4. Configurando componentes.
5. Asociando scripts.
6. Configurando físicas.
7. Creando materiales e iluminación.
8. Configurando RIG y animaciones.
9. Ejecutando comprobaciones.
10. Corrigiendo errores.
11. Preparando el informe.

Cada estado debe comenzar cuando la operación correspondiente realmente empieza y terminar cuando la operación se completa o falla.

Antes de aplicar cambios, muestra un resumen de lo que se va a crear o modificar. No sobrescribas archivos del usuario ni realices operaciones destructivas sin autorización.

## 8. Testing — pruebas verificables

Ejecuta todas las comprobaciones que permita el motor y clasifica cada una como:

- **PASS:** prueba ejecutada y resultado correcto.
- **FAIL:** prueba ejecutada y resultado incorrecto.
- **BLOCKED:** no pudo ejecutarse por una dependencia o limitación identificada.
- **NOT AVAILABLE:** la función no existe en la versión detectada.

Como mínimo, intenta comprobar:

### Estructura
- Existen las dos escenas y se pueden volver a abrir.
- Los objetos requeridos están presentes.
- Los componentes están asignados a los objetos correctos.
- Los scripts están asociados y el runtime los carga.
- No hay referencias rotas a recursos externos.

### Jugabilidad 3D
- El jugador aparece en el punto correcto.
- WASD y salto funcionan.
- La cámara sigue al jugador.
- Los cinco cristales se pueden recoger una sola vez.
- El trampolín aplica el impulso esperado.
- El obstáculo gira y sus colisiones funcionan.
- La puerta permanece bloqueada hasta completar el objetivo.

### Jugabilidad 2D
- La cámara es ortográfica.
- El jugador se mueve en XY.
- Gravedad, salto y colisiones funcionan.
- Las monedas se recogen una sola vez.
- La meta comprueba el contador.

### Recursos
- Los modelos importados se conservan al reabrir el proyecto.
- El rig tiene jerarquía y skinning verificables.
- Los clips de animación se reproducen.

No digas que has probado WASD, físicas, RIG o animaciones si solo has comprobado que el código compila. Distingue siempre entre análisis estático, compilación y prueba interactiva.

## 9. Entrega

Al terminar, presenta:

1. El proyecto guardado y organizado.
2. Las escenas y scripts creados.
3. Los modelos y recursos utilizados.
4. Un informe PASS / FAIL / BLOCKED / NOT AVAILABLE.
5. Los errores encontrados y las correcciones realizadas.
6. Las limitaciones del motor que impidieron completar alguna tarea.

No finalices con una descripción de lo que *podrías* hacer. Construye todo lo que esté soportado por las herramientas disponibles y entrega evidencias verificables de cada resultado.
