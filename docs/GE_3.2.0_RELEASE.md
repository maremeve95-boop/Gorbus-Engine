# Gorbus Engine 3.2.0 — Release

GE 3.2.0 depura el catálogo de inicio y mejora el descubrimiento de las plantillas originales.

## Catálogo

- Se retiran las diez plantillas añadidas en 3.1.0: Classic Baseplate, Flat Terrain, Village, Castle, Suburban, Pirate Island, Modern City, Starting Place, Classic Obby y Racing.
- Se retiran sus constructores de escena y sus reglas CSS decorativas del parche activo.
- Se conservan las plantillas originales del motor: Baseplate, Laboratorio físico, Primera persona, Plataformas, Escena vacía, Plataformas 2D y Escena vacía 2D.

## Mejoras de biblioteca

- Campo de búsqueda por el texto visible de cada plantilla.
- Filtros Todo, 3D y 2D que se combinan con la búsqueda.
- Descripciones visibles y mayor legibilidad de nombres.
- Tarjetas con área de vista previa panorámica 16:9.
- Se conserva la barra lateral compacta y el botón Abrir proyecto.

## Compatibilidad

- El formato `.gorbus` y los proyectos existentes no cambian.
- La biblioteca local, las capturas guardadas y las portadas personalizadas PNG/JPG se mantienen.
- Las vistas Recientes, Experiencias y Archivo siguen funcionando.

## Verificación

`npm run check` incluye la restauración de fuentes, los verificadores históricos y 15 comprobaciones estructurales GE 3.2.0; también construye el bundle Vite en CI.

## Límites

- El buscador filtra las plantillas que ya están incluidas en el editor; no descarga contenido externo.
- Las miniaturas siguen siendo vistas previas CSS estilizadas, no capturas nuevas del motor.
- Esta actualización no cambia el motor de física ni promete mejoras de FPS; su mejora se centra en el inicio y la biblioteca.
