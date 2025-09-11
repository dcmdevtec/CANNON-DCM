# Integración de JSONCargo API en CANNON-DCM

## Funcionalidades implementadas

1. **Consulta de contenedores vía API**
   - Se creó un componente que permite consultar datos de contenedores usando la API de JSONCargo.
   - Los datos obtenidos incluyen: número de contenedor, naviera, estado, origen, destino, barco, ETA, entre otros.

2. **Tabla de resultados con diseño profesional**
   - Se implementó una tabla en el módulo "Datos API" con el mismo diseño y funcionalidad que la tabla de seguimiento de contenedores.
   - Incluye búsqueda, filtros, badges de estado, checkbox y botón de acción.
   - Solo muestra los datos traídos desde la API.

3. **Estructura SQL para persistencia**
   - Se creó la carpeta `sql` con los archivos `schema.sql`, `schema_full.sql` y `functions.sql` para guardar los datos de contenedores y buques, así como incidencias detectadas.
   - Las tablas siguen el formato `cnn_nombretabla_descripcion`.

4. **Preparación para integración con mapa marítimo**
   - Se dejó lista la estructura para que los datos de posición de buques puedan ser usados en el componente de mapa marítimo.
   - Se identificó cómo obtener la posición del barco desde la API y mostrarla en el mapa.

## Archivos principales creados/modificados
- `src/components/ContainerApiViewer.tsx`
- `src/components/ContainerApiTableV2.tsx`
- `src/pages/DatosApi.tsx`
- `sql/schema.sql`, `sql/schema_full.sql`, `sql/functions.sql`

## Siguientes pasos sugeridos
- Integrar la consulta de posición de buques y visualización en el mapa.
- Conectar la persistencia con Supabase.
- Agregar notificaciones automáticas en caso de incidencias detectadas en buques.

---

**Avance realizado:**
- Consulta y visualización profesional de datos de contenedores vía API.
- Estructura lista para persistencia y futuras integraciones.
