# Publicar en Vercel

Esta versión conserva el diseño y adapta las citas y prospectos a Turso (libSQL remoto).

1. Crea una base de datos en https://turso.tech y genera su token de acceso.
2. Sube el contenido de esta carpeta al repositorio. En Vercel selecciona esta carpeta como Root Directory (la que contiene package.json y vercel.json).
3. Usa Framework Preset: Other; Install Command: npm install; no configures Output Directory ni Build Command. Node.js: 22.x.
4. En Settings → Environment Variables configura para Production:

| Variable | Valor |
| --- | --- |
| TURSO_DATABASE_URL | URL libsql:// de tu base Turso |
| TURSO_AUTH_TOKEN | Token privado de Turso |
| ADMIN_PASSWORD | Contraseña larga y propia para el administrador |
| APP_ORIGIN | https://alexia-blush-xi.vercel.app (sin barra final) |

5. Haz un nuevo deployment después de guardar las variables.
6. Abre la página, envía un prospecto, reserva una cita y comprueba ambos en /admin. Usuario: admin. Prueba también exportar y cancelar la cita.

Las tablas se crean automáticamente al arrancar. No compartas los tokens ni los agregues al repositorio. Si cambias el dominio, actualiza APP_ORIGIN y vuelve a desplegar. Las URLs de preview no aceptarán formularios salvo que configures su origen para ese entorno.

## Datos anteriores
Los datos de data/leads.sqlite NO se importan automáticamente a Turso. Este ZIP conserva ese archivo para uso local y respaldo; .vercelignore y .gitignore impiden subirlo al despliegue. Si ya contiene citas reales, conserva una copia y migra su contenido antes de recibir nuevas reservas. No publiques la base en GitHub.

## Uso local
Ejecuta npm install y luego npm start con Node 22. Sin variables TURSO se usa data/leads.sqlite.

El límite de envíos en memoria sigue siendo por instancia; no constituye un límite global entre todas las funciones.
