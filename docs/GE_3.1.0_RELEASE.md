# Gorbus Engine 3.1.0 — Release Preview

GE 3.1.0 moderniza el lanzador y amplía la galería de experiencias sin cambiar el formato de proyecto `.gorbus`.

## Lanzador y biblioteca de plantillas

- Inicio directo en la galería de plantillas.
- Barra lateral compacta con Nueva experiencia, Recientes, Inicio, Experiencias, Plantillas y Archivo.
- Filtros funcionales: Todo, Vacío, Jugabilidad y Temáticos.
- Diez plantillas 3D nuevas: Classic Baseplate, Flat Terrain, Village, Castle, Suburban, Pirate Island, Modern City, Starting Place, Classic Obby y Racing.
- Las nuevas plantillas generan objetos y geometría editables reales; no son capturas estáticas.
- Diseño responsive para escritorio, tablet y pantallas estrechas.
- Versionado consistente 3.1.0 en título, introducción, metadatos y etiqueta del viewport.

## Compatibilidad

- Los proyectos guardados mantienen el formato `GorbusScene` y el contenedor `.gorbus`.
- La galería sigue usando la biblioteca local del navegador y conserva sus miniaturas/capturas personalizadas.
- Se mantienen las opciones de importar proyectos y asignar portadas PNG/JPG.
- Las plantillas originales 2D/3D y el editor existente siguen disponibles.

## Límites conocidos

- Las nuevas plantillas son escenas iniciales editables; no incluyen automáticamente sistemas completos de juego, reglas, misiones o contenido final.
- El arte de las miniaturas es ilustración CSS de la galería, no una captura en tiempo real de cada plantilla.
- Esta release no afirma convertir automáticamente cualquier HTML en un proyecto nativo perfecto.
- La UI runtime 3.0 sigue siendo una capa 2D de pantalla; el editor de interfaz visual completo y controles interactivos en espacio 3D continúan pendientes.
- No se ha certificado aún una sesión manual completa en todos los navegadores y dispositivos.

## Verificación

`npm run check` y CI ejecutan los verificadores históricos, la restauración de fuentes, el verificador de la galería 3.1.0 y el build Vite de producción.
