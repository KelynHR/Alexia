# Lago Sur · Landing page premium

Propuesta editable para renovar la página de Lago Sur. HTML, CSS y JavaScript, sin frameworks ni dependencias externas de servidor. Incluye imágenes del sitio actual, formulario conectado a SQLite y panel privado con exportación CSV.

## Abrir en Visual Studio Code

1. Descomprime el ZIP y abre la carpeta `lagosur-landing` en VS Code.
2. Instala **Node.js 24 LTS** (o versión 22.13 o posterior compatible con `node:sqlite`). Comprueba `node --version` en la terminal. Si acabas de instalarlo, reinicia VS Code.
3. En la terminal de VS Code ejecuta:

   ```bash
   npm start
   ```

   **No necesitas ejecutar `npm install`.**

4. Abre **http://localhost:3000**.
5. Para ver prospectos, abre **http://localhost:3000/admin**. Usuario: `admin`. Copia la contraseña que aparece en la terminal al arrancar el servidor.
6. Para detenerlo, pulsa `Ctrl+C`.

Al ejecutar sin `ADMIN_PASSWORD`, se genera una contraseña nueva en cada arranque. Los prospectos permanecen guardados. SQLite puede mostrar una advertencia de función experimental en algunas versiones de Node; no impide el funcionamiento.

## Qué contiene

| Archivo | Uso |
| --- | --- |
| `index.html` | Estructura y textos de la landing |
| `styles.css` | Diseño responsive, colores y tipografías |
| `script.js` | Menú móvil, galería, planos, WhatsApp, formulario |
| `config.js` | Número de WhatsApp, mensaje y endpoint del formulario |
| `assets/` | Fotografías, renders, planos y logo del sitio actual |
| `server.mjs` | Servidor local y base de datos SQLite |
| `admin.html`, `admin.js` | Consulta, búsqueda y exportación de prospectos |
| `package.json` | Comando para iniciar el proyecto |
| `data/leads.sqlite` | Se crea al recibir el primer arranque; conserva los registros |

## Activar WhatsApp

En `config.js` sustituye el valor vacío de `whatsappNumber` por el número comercial autorizado con código de país, sin espacios ni `+`:

```js
whatsappNumber: '52XXXXXXXXXX',
```

No se ha supuesto que el teléfono publicado en la web sea un WhatsApp. Mientras el campo esté vacío, el botón flotante ofrece el formulario e indica que el canal está pendiente de confirmación. Después de configurarlo, abre WhatsApp con el mensaje preparado; el visitante decide si lo envía.

## Probar la captación

1. Arranca con `npm start`.
2. Completa el formulario con datos ficticios y acepta la casilla.
3. Envía: el éxito se muestra únicamente después de confirmar la escritura en SQLite.
4. Entra a `/admin`, consulta el registro y prueba **Exportar CSV**.
5. Los registros guardan fecha, nombre, correo, teléfono, interés, mensaje, consentimiento y origen de visita (UTM y referente).

El formulario **no envía correos, no sincroniza un CRM y no confirma automáticamente una cita**. Guarda solicitudes en la base local. No depende del almacenamiento del navegador.

Abrir `index.html` directamente o usar Live Server permite revisar el diseño, pero para guardar solicitudes y acceder al panel debes utilizar el servidor incluido. No se simulan envíos exitosos sin servidor.

## Personalizar

- Textos y enlaces comerciales: `index.html`.
- Paleta y fuentes: variables al comienzo de `styles.css`.
- Imágenes: reemplaza los archivos en `assets/`, conservando nombres o actualizando las rutas.
- WhatsApp y endpoint: `config.js`.
- Formulario: mantener sus nombres de campo o adaptar también `server.mjs`.
- Tipografías: Cormorant Garamond y Manrope desde Google Fonts; hay alternativas locales de respaldo si no tienes conexión.

Los planos originales son horizontales; la ventana de distribución los muestra completos sin recortarlos.

## Contraseña fija (opcional)

En PowerShell, antes de iniciar:

```powershell
$env:ADMIN_PASSWORD = "elige-una-clave-larga-propia"
npm start
```

En macOS/Linux:

```bash
ADMIN_PASSWORD='elige-una-clave-larga-propia' npm start
```

No guardes contraseñas en el código ni compartas capturas de la terminal con esa clave. El panel exige autenticación HTTP Basic; por defecto el servidor solo escucha en tu equipo (`127.0.0.1`).

## Llevar a producción

Esta entrega es una propuesta y un entorno local funcional. Para captar clientes reales:

- Confirma el WhatsApp, textos, características, imágenes, derechos de uso y condiciones de las amenidades con el cliente.
- Sustituye el texto de demostración del formulario y el modal de datos por el aviso de privacidad aprobado del responsable. Retira `noindex` cuando corresponda.
- Define si las solicitudes se guardarán en hosting Node con disco persistente, CRM, correo o un servicio externo. Un hosting estático no ejecuta `server.mjs` ni guarda SQLite.
- Publica con HTTPS; configura una contraseña sólida en el entorno, almacenamiento persistente, copias de seguridad y protección contra abuso. Revisa origen permitido y autenticación al adaptar el servidor: el ejemplo local solo acepta formularios desde localhost.
- La carpeta `data/` es privada: no debe incluirse en una carpeta pública ni subirse al repositorio. El servidor ya deniega su descarga.

No hay precios inventados, testimonios, promesas de plusvalía ni cifras comerciales añadidas. Los datos de 30 residencias, modelo Baikal de 195 m², distribución, amenidades y tiempos de traslado provienen de https://www.lagosur.mx/ consultado el 3 de noviembre de 2026. Los tiempos de traslado son referencias, no garantías. Los renders se identifican como ilustrativos.

---

## Actualización VIP · Navidad, visitas y recorrido

### Instalar estos archivos sobre la primera versión

1. Detén el servidor con `Ctrl+C`.
2. Extrae este paquete y copia su contenido **dentro de tu carpeta original `lagosur-landing`**, aceptando reemplazar los archivos existentes.
3. Conserva tu carpeta original `assets/`, `package.json`, `script.js` y **`data/`**. Este paquete solo trae los archivos cambiados y los nuevos módulos.
4. Si ya configuraste un WhatsApp o endpoint propio, vuelve a colocar sus valores en `config.js`: el archivo de actualización trae los valores de la propuesta original.
5. Ejecuta `npm start` y actualiza el navegador con `Ctrl+F5`.

La base `data/leads.sqlite` existente **no se reemplaza**. Al iniciar, se añaden la tabla de citas y su índice de disponibilidad; se conservan todos los prospectos. Haz una copia de `data/` con el servidor apagado antes de aplicar actualizaciones si ya tienes datos reales.

### Cambios visuales

- Bodoni Moda en títulos, Jost en cifras y Manrope en lectura. Fuentes solicitadas a Google Fonts con respaldo local.
- Suben los tamaños de navegación, descripciones, fichas, formulario, FAQ y pie. Los tiempos de traslado usan Jost en lugar de la fuente editorial de títulos.
- WhatsApp incorpora destellos y un halo espaciados; no desaparece ni parpadea bruscamente. Las animaciones respetan «reducir movimiento» del sistema.
- Mapa vectorial ligero integrado en `index.html`, con iconos iguales y ubicación de Lago Sur destacada con ondas. **Es un esquema de referencia, no un mapa geográfico a escala**; Google Maps sigue siendo el enlace para navegar.

### Navidad

`config.js` → `window.LAGO_CONFIG.christmas` permite activar la campaña, cambiar fechas y mostrarla una vez por sesión o en cada carga. Por defecto aparece del 1 de noviembre al 31 de diciembre de 2026, usando fecha de Ciudad de México. Si se cierra y quieres volver a probarla, abre una ventana privada o cambia `showEveryVisit` a `true` y recarga.

El mensaje propone una visita privada y no promete descuentos, cupones ni rendimientos no autorizados. Para ofrecer una promoción económica real, confirma primero monto, vigencia, inventario y condiciones con el cliente y edita el modal en `index.html`.

### Calendario conectado a SQLite

Los botones «Agenda tu visita» abren un calendario que consulta los horarios reales de esta base de datos local. Las solicitudes crean un prospecto y una cita en una sola transacción.

`booking-config.json` configura la operación del servidor:

- `advisors`: sustituye los asesores de demostración por nombres reales y IDs únicos. Conserva los IDs al cambiar nombres. `active: false` impide nuevas asignaciones a un asesor y conserva las citas anteriores.
- `demo`: cambia a `false` cuando hayas configurado operación real y aviso de privacidad; el texto fijo de demostración en el HTML también debe adecuarse.
- `openWeekdays`: días de atención; 0=domingo, 1=lunes, …, 6=sábado.
- `times`: horas de inicio disponibles; deben separarse al menos por `durationMinutes`.
- `durationMinutes`: duración de cada visita. Por defecto 60 minutos.
- `minimumNoticeMinutes`: anticipación mínima; por defecto 120 minutos.
- `maxDaysAhead`: ventana de reservación, por defecto 60 días.
- `closedDates`: fechas sin visitas, formato `AAAA-MM-DD`. Configura cierres, festivos y vacaciones de tu operación.
- `timezone`: `America/Mexico_City`. Esta implementación utiliza UTC−6, aplicable a Querétaro. Para usar otra región, adapta la conversión de horarios de servidor y cliente.

Reinicia `npm start` después de editar `booking-config.json`. Ese archivo es privado y no puede descargarse desde el servidor.

La asignación elige, entre asesores disponibles, quien tenga menos citas vigentes desde hoy; en empate usa su ID. Cada asesor solo admite una cita activa por fecha y hora. Si dos visitantes toman el último espacio a la vez, solo una solicitud se confirma y la otra debe elegir de nuevo. Si hay dos asesores disponibles, se permiten dos citas simultáneas, una por asesor.

El visitante recibe fecha, hora, asesor y referencia, y puede descargar un archivo `.ics` para **añadir manualmente** la visita a su calendario. Esto **no** sincroniza Outlook, Google Calendar ni disponibilidad personal de asesores; tampoco envía correos o mensajes automáticos.

En `/admin`, la pestaña **Citas y asesores** permite consultar, buscar, exportar CSV y cancelar una cita. Al cancelarla se libera ese espacio; el prospecto se conserva.

Endpoints añadidos:

| Ruta | Uso |
| --- | --- |
| `GET /api/booking-settings` | Calendario y reglas públicas |
| `GET /api/availability?date=AAAA-MM-DD` | Disponibilidad del día |
| `POST /api/appointments` | Guardar cita y asignar asesor |
| `GET /api/appointments` | Listado privado |
| `GET /api/appointments/export` | Exportación privada de citas |
| `POST /api/appointments/cancel` | Cancelación privada |

### Recorrido de video / 360°

Se añade una sección preparada para video o recorrido 360°. **No se proporcionó una grabación ni un panorama 360° real**: inicialmente muestra una imagen del interior e identifica la experiencia como galería, sin presentar una fotografía normal como 360°.

En `config.js` → `window.LAGO_CONFIG.tour`:

```js
window.LAGO_CONFIG.tour = {
  embedUrl: '', // URL HTTPS de inserción del tour real (Matterport, Kuula, etc.)
  videoUrl: '', // Por ejemplo: 'assets/recorrido-baikal.mp4'
  poster: 'assets/interior3.jpg'
};
```

Configura solo el tipo de material que tengas; si rellenas ambos campos, se usa `embedUrl`. Debes copiar el MP4 real a `assets/` o usar una URL de video que permita reproducción. El proveedor del tour debe permitir su inserción en un iframe. El contenido externo se carga solo cuando el visitante abre el recorrido.

### Publicar la agenda

La agenda funciona con el servidor Node incluido, no con Live Server. Para publicar en internet necesitas un servidor Node con HTTPS y almacenamiento SQLite persistente (o adaptar la base a un servicio administrado). Revisa orígenes permitidos, protección de acceso y autenticación antes de ampliar el servidor, que por defecto solo escucha en tu computadora. Configura asesores, horarios, cierre navideño, aviso de privacidad y material comercial antes de recibir clientes reales.
