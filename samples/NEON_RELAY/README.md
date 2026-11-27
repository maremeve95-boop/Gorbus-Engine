# NEON RELAY — Juego de prueba para Gorbus Engine 2.1.0

NEON RELAY es un pequeño juego 3D en primera persona creado para comprobar el flujo de trabajo de Gorbus Engine 2.1.0.

## Objetivo
Recoge los **9 núcleos de energía** repartidos por una arena futurista antes de que termine el contador de 90 segundos. Cada núcleo suma 100 puntos. Si consigues todos, recibes una bonificación por el tiempo restante.

## Controles
- **WASD:** moverse.
- **Ratón:** mirar.
- **Shift:** correr.
- **Espacio:** saltar.
- **T:** reiniciar la partida.

Haz clic dentro del viewport para capturar el ratón si el navegador lo solicita.

## Abrir
1. Descarga el ZIP de Gorbus Engine 2.1.0 Preview.
2. Abre el editor y selecciona **Abrir escena**.
3. Selecciona `NEON_RELAY.gorbus`.
4. Ejecuta Play.
5. Recoge los nueve núcleos.

## Qué prueba
- Carga de escenas y jerarquía.
- Cápsula, Rigidbody y colisiones físicas.
- Cámara FPS y captura del ratón.
- WASD, Shift, salto y lectura de input.
- Lógica Luau, detección de proximidad y transformaciones.
- Coleccionables, puntuación, cronómetro y HUD runtime.
- Reinicio de partida y limpieza al detener Play.

## Estructura
- `NEON_RELAY.gorbus`: escena autocontenida con script y objetos.
- `main.luau`: copia independiente del script principal.

El proyecto está construido con las APIs documentadas en los ejemplos de GE 2.1.0. No se ha podido ejecutar una prueba interactiva del juego dentro del editor en este entorno; úsalo como smoke test real de la release y comunica cualquier error que aparezca en consola.
