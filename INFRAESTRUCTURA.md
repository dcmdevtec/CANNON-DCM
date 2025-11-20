
# Arquitectura del Aplicativo CANNON-DCM

Este documento describe la infraestructura técnica del aplicativo CANNON-DCM, detallando el lenguaje de programación, la base de datos, las tablas, y las funciones utilizadas.

## 1. Lenguaje y Framework

- **Lenguaje Principal:** [**TypeScript**](https://www.typescriptlang.org/)
- **Framework Frontend:** [**React**](https://react.dev/) con [**Vite**](https://vitejs.dev/) para el entorno de desarrollo y empaquetado.
- **Backend (Serverless):** Las funciones Edge de Supabase están escritas en **TypeScript** y se ejecutan en el entorno de [**Deno**](https://deno.land/).

## 2. Base de Datos y Backend

El backend y la base de datos están gestionados a través de [**Supabase**](https://supabase.com/), una plataforma de "Backend as a Service" (BaaS) que utiliza [**PostgreSQL**](https://www.postgresql.org/) como motor de base de datos.

### 2.1. Tablas de Supabase

A continuación se listan las tablas principales identificadas en el esquema de la base de datos:

| Tabla                      | Descripción                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `cnn_container_tracking`   | Tabla principal que almacena los datos de seguimiento de cada contenedor.                               |
| `cnn_container_events`     | Registra cada evento o movimiento asociado a un contenedor (ej. llegada a puerto, salida, etc.).        |
| `cnn_factura_tracking`     | Vincula la información de seguimiento de un contenedor con los datos de una factura específica.         |
| `cnn_container_vessels`    | Almacena información sobre las embarcaciones (`vessels`) que transportan los contenedores.             |
| `cnn_tracking_summary`     | Contiene un resumen del estado del seguimiento para facilitar las consultas.                            |
| `cnn_container_metadata`   | Guarda metadatos relacionados con la ingesta de datos, como el mensaje original y la calidad.           |
| `cnn_correo_tracking`      | Tabla para el seguimiento de información recibida por correo.                                           |
| `cnn_vessel_position`      | Almacena datos geoespaciales y de estado de las embarcaciones en tiempo real.                           |
| `cnn_vessel_incident`      | Registra incidentes o eventos anómalos relacionados con las embarcaciones.                              |
| `container_trackings`      | Tabla utilizada por la Edge Function para `upsert` (insertar/actualizar) datos de tracking.             |
| `notifications`            | Almacena notificaciones generadas por el sistema (ej. alertas de retraso de contenedores).            |

### 2.2. Vistas de la Base de Datos

Las vistas son consultas predefinidas que simplifican el acceso a datos complejos y agregados.

| Vista                            | Descripción                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `cnn_inventario_espacios_semanal`  | Agrega semanalmente los espacios utilizados por naviera, proveedor y puerto.                            |
| `cnn_llegada_contenedores_mensual` | Acumula mensualmente el total de contenedores llegados, agrupados por naviera, proveedor y puerto.      |
| `cnn_container_factura_view`     | Unifica los datos de `cnn_factura_tracking` y `cnn_container_tracking` para ofrecer una vista consolidada. |

## 3. Funciones

### 3.1. Funciones de la Base de Datos (PostgreSQL)

Estas funciones se ejecutan directamente en la base de datos para realizar operaciones complejas o reutilizables.

| Función                                  | Descripción                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `update_updated_at_column()`             | Es un `TRIGGER` que actualiza automáticamente el campo `updated_at` cada vez que se modifica una fila en las tablas asociadas.            |
| `insert_CNN_container_tracking_data(jsonb)` | Procesa un objeto JSON y lo descompone para insertar los datos de seguimiento en las tablas `cnn_container_tracking` y relacionadas. |
| `upsert_CNN_container_tracking_data(jsonb)` | Función que inserta o actualiza (`UPSERT`) los datos de seguimiento. Si un contenedor ya existe, lo elimina y lo vuelve a insertar. |

### 3.2. Supabase Edge Functions

Son funciones serverless que se ejecutan en el borde de la red, cerca del usuario, para baja latencia.

| Función           | Ruta                                        | Descripción                                                                                                                                                                                          |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `track-container` | `supabase/functions/track-container/index.ts` | Recibe un número de contenedor y un Bill of Lading. Simula una llamada a una API de tracking, procesa la respuesta y actualiza la tabla `container_trackings`. Además, crea notificaciones por retrasos. |

