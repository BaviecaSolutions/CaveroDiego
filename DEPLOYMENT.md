# Despliegue

Este proyecto se despliega automáticamente en producción mediante **GitHub Actions**.

## Flujo de despliegue

1. **Build (CI)**: En cada push o pull request a cualquier rama, se ejecuta el job `build` que:
   - Instala las dependencias con `npm ci`
   - Construye el sitio con `npm run build`
   - Verifica que se haya generado `_site/index.html`

2. **Deploy (CD)**: Solo cuando se hace push a la rama `main`, tras pasar el build, se ejecuta el job `deploy` que:
   - Configura una conexión SSH segura con el servidor
   - Se conecta al servidor como usuario `deploy` con clave SSH restringida
   - La clave SSH solo permite ejecutar un comando forzado que lanza el despliegue automático
   - El servidor responde: "Despliegue de caverodiego lanzado"

## Secretos de GitHub

El workflow requiere tres secretos configurados en el repositorio:

- **`DEPLOY_HOST`**: Hostname o IP del servidor de producción
- **`DEPLOY_SSH_KEY`**: Clave privada SSH del usuario `deploy` (con comando forzado)
- **`DEPLOY_KNOWN_HOSTS`**: Entrada `known_hosts` del servidor para verificación

Estos secretos ya están configurados en el repositorio.

## Seguridad

- El usuario `deploy` en el servidor solo puede ejecutar un comando específico (forced command)
- La conexión SSH usa `BatchMode=yes` y `StrictHostKeyChecking=yes` para evitar interacciones manuales
- El workflow NO envía ningún comando; simplemente conecta y el servidor ejecuta el despliegue
- Se usa concurrency control para evitar despliegues simultáneos
- Timeout de 5 minutos por despliegue

## Cambios respecto al sistema anterior

Anteriormente, el despliegue se realizaba mediante un webhook HTTP (puerto 3000) en Easypanel. Este sistema ha sido reemplazado por GitHub Actions para:

- **Mayor seguridad**: No exponer Easypanel a internet
- **Autenticación robusta**: SSH con claves en lugar de webhooks HTTP
- **Trazabilidad**: Logs completos en GitHub Actions
- **Control de concurrencia**: Evitar despliegues simultáneos

El autodespliegue de Easypanel queda **desactivado**.
