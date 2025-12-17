# Documentación de Entrega - Cannon DCM Frontend

## 1. Descripción del Proyecto
Este proyecto consiste en el frontend para el sistema **Cannon DCM (Digital Container Monitoring)**. Es una aplicación web moderna construida con **React**, **Vite** y **TypeScript**, diseñada para ofrecer una experiencia de usuario rápida y eficiente.

La aplicación incluye funcionalidades clave como:
*   Autenticación dual (Supabase y API personalizada).
*   Dashboard de monitoreo de contenedores.
*   Gestión de aprobaciones y seguimiento.
*   Interfaz responsiva y optimizada.

## 2. Requisitos del Sistema

Para ejecutar o desplegar este proyecto, se requiere:

*   **Docker Engine** (v20.10+) y **Docker Compose** (v2.0+).
*   **Node.js** (v18+) (Solo para desarrollo local sin Docker).

## 3. Configuración de Variables de Entorno

El proyecto utiliza variables de entorno para configurar conexiones a servicios externos. Estas deben definirse en un archivo `.env.local` en la raíz del proyecto antes de construir la aplicación.

**Variables requeridas:**
```env
VITE_SUPABASE_URL=https://tu-url-supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
VITE_GEONAMES_USER=tu-usuario-geonames
```
> **Nota:** Al usar Vite, estas variables se incrustan en el código durante el proceso de construcción (`build`).

## 4. Despliegue en Producción (Recomendado)

La aplicación está contenerizada utilizando **Docker** y servida mediante **Nginx** para un rendimiento óptimo. Se incluye una configuración de `docker-compose` para simplificar el despliegue.

### Pasos para Desplegar:

1.  **Preparar el Servidor:**
    Asegúrese de subir los siguientes archivos/carpetas al servidor:
    *   `src/`
    *   `public/`
    *   `package.json` y `package-lock.json`
    *   `Dockerfile`
    *   `nginx.conf`
    *   `docker-compose.yaml`
    *   `.env.local`

2.  **Iniciar la Aplicación:**
    Ejecute el siguiente comando en el directorio del proyecto:
    ```bash
    docker compose up -d --build
    ```
    *   La aplicación se iniciará en el puerto **8080** (por defecto).
    *   Para cambiar el puerto, edite el archivo `docker-compose.yaml` (sección `ports`).

3.  **Verificar Estado:**
    ```bash
    docker compose ps
    ```

4.  **Ver Logs:**
    ```bash
    docker compose logs -f
    ```

5.  **Detener la Aplicación:**
    ```bash
    docker compose down
    ```

## 5. Desarrollo Local

Si desea ejecutar el proyecto en un entorno de desarrollo local:

1.  Instalar dependencias:
    ```bash
    npm install
    ```
2.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```
3.  Acceder a `http://localhost:8080`.

## 6. Estructura del Proyecto

*   `/src`: Código fuente de la aplicación (Componentes, Páginas, Hooks).
*   `/public`: Archivos estáticos y configuración del servidor (`.htaccess`).
*   `/dist`: Archivos compilados listos para producción (generados por el build).
*   `Dockerfile`: Definición de la imagen del contenedor (Multi-stage build).
*   `nginx.conf`: Configuración del servidor web para enrutamiento SPA.
*   `docker-compose.yaml`: Orquestación del contenedor para despliegue fácil.

## 7. Notas Adicionales

*   **Autenticación:** El sistema soporta dos métodos de login. El nuevo login conecta con el API Gateway configurado, mientras que el login original mantiene la conexión con Supabase.
*   **Enrutamiento:** La configuración de Nginx (`nginx.conf`) y Apache (`.htaccess`) está preparada para manejar el enrutamiento del lado del cliente (SPA), redirigiendo todas las peticiones a `index.html`.

---
**Fecha de Entrega:** 17 de Diciembre de 2025
**Versión:** 1.0.0
