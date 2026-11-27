# STRYDE — Gorbus Engine Port 0.1

Primer corte nativo del proyecto STRYDE v1.4, preparado para Gorbus Engine. Esta entrega reconstruye el modo **Entrenamiento / Campo Orión** como una escena 3D con física Rapier y lógica Luau. No ejecuta ni incrusta el HTML original.

## Incluido

- Arena 3D cerrada con suelo, límites y coberturas físicas.
- Jugador en primera persona con cápsula y Rigidbody.
- Cámara controlada por ratón y movimiento nativo de Gorbus.
- Cuatro modos de escaneo con ritmos y puntuaciones distintos.
- Seis balizas, tres móviles, que se activan al recibir un pulso y reaparecen después.
- HUD nativo del viewport con cronómetro, puntos, precisión, balizas activadas, modo de escaneo y rango.
- Ronda de entrenamiento de 60 segundos, puntuación, precisión y rango final.
- Pulsos de escaneo ilimitados.

## Controles

- **WASD:** movimiento.
- **Shift:** correr.
- **Espacio:** saltar.
- **Ratón:** mirar.
- **Clic izquierdo:** escanear una baliza.
- **Clic derecho:** estabilizar la vista (sensibilidad reducida).
- **1–4:** cambiar modo de escaneo.
- El HUD muestra la puntuación y los avisos de activación durante la partida.
- **Tab:** mostrar marcador en la consola.
- **T:** reiniciar la ronda.

## Abrir en Gorbus Engine

1. Usa una versión de Gorbus Engine que incluya GE 2.1 y la API `Gorbus.isMouseButtonDown` / `Gorbus.isMouseButtonJustPressed`.
2. En la pantalla inicial o el menú de archivo, elige **Abrir escena**.
3. Selecciona `STRYDE_Training_Range.gorbus`.
4. Pulsa **Ejecutar tests** y después **Play**.
5. Haz clic en el viewport para capturar el ratón si el navegador lo solicita.

## Qué todavía no está portado

La versión HTML original contiene diez modos, tienda, cosméticos, progreso, misiones, logros, bots, minijuego Garra, varios mapas, sonido procedural y música. Este port añade un HUD nativo limitado para esta ronda (temporizador, puntos, precisión, balizas activadas, modo de escaneo y rango), pero Gorbus todavía no tiene un editor general de HUD/UI para juegos, audio de juego, persistencia de datos de partida ni red en la API Luau. La tienda, el multijugador, los bots y los otros modos todavía no están portados.

## Mejoras respecto al primer corte

- Escena separada del HTML original y serializada como proyecto `.gorbus` editable.
- HUD de ronda creado por la API runtime de Gorbus y alojado dentro del viewport, con avisos de activación.
- Física de jugador y arena nativa del motor en vez de colisiones calculadas a mano.
- Balizas móviles actualizadas a intervalos limitados para reducir trabajo por frame.
- Estado de partida controlado por Luau con reinicio y resultados reproducibles.

## Archivos

- `STRYDE_Training_Range.gorbus`: escena lista para abrir.
- `main.luau`: script fuente independiente.
