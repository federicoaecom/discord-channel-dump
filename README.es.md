# Discord Channel Dump

[English](README.md) | **Español**

> **Nota:** este documento es una traducción de [README.md](README.md). Si hay diferencias, la versión en inglés es la referencia oficial.

Herramienta para hacer copias de seguridad de canales de Discord mediante automatización del navegador con Playwright. No requiere un token de bot ni permisos de administrador: usa tu sesión normal de usuario de Discord.

---

## Cómo funciona

En lugar de desplazarse por el DOM (frágil y lento), la herramienta llama directamente a la **API REST** de Discord desde el navegador autenticado:

```
Your browser session  ->  GET /api/v9/channels/{id}/messages?limit=50&before={id}
                       ->  automatic pagination back to the first message
```

Así se obtiene el **100 % de los mensajes**, sin problemas de tiempos de espera ni de desplazamiento.

El navegador se abre **una sola vez** y mantiene la sesión iniciada entre ejecuciones gracias al perfil persistente guardado en `browser-profile/`. No necesitas iniciar sesión cada vez.

---

## Seguridad y privacidad

| Qué | Dónde | Qué hacer |
|-----|-------|-----------|
| Sesión iniciada de Discord (cookies y datos del sitio de la aplicación web de Discord) | `browser-profile/` | Trátala como una contraseña. Nunca la subas a un repositorio ni la compartas. Elimina la carpeta para cerrar la sesión. |
| Token de autorización de Discord capturado por la herramienta | Memoria del proceso, durante la ejecución actual | Nada. La herramienta no lo registra en los logs ni lo escribe en disco. |
| Contenido de mensajes privados y archivos adjuntos | `backups/` | Guárdalos y compártelos con el mismo cuidado que las conversaciones originales. |

- **Manejo del token**: la herramienta lee el token del encabezado `Authorization` de las solicitudes que la aplicación web de Discord envía a `discord.com/api`. Lo conserva en memoria durante la ejecución actual y solo lo envía en sus propias solicitudes a la API de Discord, que se ejecutan en el proceso de Node.js a través de Playwright. Las descargas de archivos multimedia desde la CDN no lo incluyen.
- **Git**: `backups/` y `browser-profile/` están incluidas en `.gitignore`. Si cambias su ubicación con `--output`, `--profile` o variables de entorno, asegúrate de mantener las nuevas carpetas fuera del control de versiones.

### Aviso legal

- Automatizar una cuenta de usuario puede infringir los [Términos de servicio de Discord](https://discord.com/terms). Usa esta herramienta bajo tu propia responsabilidad.
- Haz copias de seguridad solo del contenido al que tengas derecho a acceder y conservar.
- Este proyecto no está afiliado a Discord ni cuenta con su respaldo o patrocinio.

---

## Instalación (primera vez)

Requiere Node.js `^20.19.0`, `^22.13.0` o `>=24`.

```bash
npm install
npx playwright install chromium
```

---

## Uso

```bash
node bin/backup.js
```

### Flujo por canal

1. Se abre una ventana del navegador con Discord (con la sesión ya iniciada si usaste la herramienta antes).
2. **Inicia sesión** si es la primera ejecución: las cookies se guardan en `browser-profile/`.
3. **Ve al canal** del que quieres hacer la copia de seguridad (no hace falta desplazarse).
4. Vuelve a la terminal y pulsa **ENTER**.
5. El script detecta el nombre del canal: confírmalo o escribe uno personalizado.
6. Se descargan todos los mensajes, imágenes y archivos adjuntos, con el progreso en tiempo real.
7. Repite desde el paso 3 para cada canal.
8. Escribe `exit` para cerrar el navegador.

### Opciones de la CLI

```bash
node bin/backup.js --help
node bin/backup.js --version
node bin/backup.js --verbose
node bin/backup.js --dry-run
node bin/backup.js --output ./my-backups
node bin/backup.js --profile ./my-profile --output ./my-backups
```

- `--verbose` activa los registros de nivel de depuración.
- `--dry-run` obtiene la cantidad de mensajes sin escribir archivos ni descargar contenido multimedia.

---

## Regenerar el HTML de una copia existente

Para actualizar `index.html` en copias creadas antes de que se añadieran nuevas funciones al visor (por ejemplo, la búsqueda o el filtro por fechas):

```bash
# One channel
node bin/regen-html.js backups/channel-name

# All channels (PowerShell)
Get-ChildItem backups -Directory | ForEach-Object { node bin/regen-html.js "backups/$($_.Name)" }

# All channels (bash)
for dir in backups/*/; do node bin/regen-html.js "$dir"; done
```

---

## Estructura de salida

```
backups/
  channel-name/
    messages.json       <- mensajes estructurados (JSON)
    index.html          <- visor sin conexión con estilo de Discord
    images/
      photo_<sha256>.png
      screenshot_<sha256>.jpg
    attachments/
      report_<sha256>.pdf
      spreadsheet_<sha256>.xlsx
      video_<sha256>.mp4
```

`<sha256>` representa el resumen SHA-256 de 64 caracteres en minúsculas de la identidad canónica del archivo multimedia: el origen y la ruta de la URL más los parámetros de consulta restantes, ordenados. Los parámetros volátiles de firma de la CDN de Discord (`ex`, `is`, `hm`, sin distinguir mayúsculas de minúsculas) y los fragmentos de URL se ignoran, de modo que las firmas rotativas reutilizan el mismo archivo en lugar de descargar duplicados. Cualquier otro parámetro de consulta mantiene los recursos diferenciados, aunque compartan nombre de archivo. Los nombres de archivo multimedia se limitan a 255 bytes UTF-8 recortando el nombre base legible cuando es necesario; la extensión se conserva siempre que el sufijo hash y la extensión quepan.

### Visor HTML (`index.html`)

La interfaz del visor está en español. Los mensajes de la CLI están actualmente en inglés.

El visor incluye:

- **Búsqueda en tiempo real**: filtra los mensajes por texto o autor y resalta las coincidencias (campo "Buscar en el chat…").
- **Filtro por rango de fechas**: selectores "Desde" y "Hasta" que se combinan con la búsqueda.
- **Ctrl+F**: redirige a la búsqueda interna en lugar del cuadro de búsqueda del navegador.
- **Botón "Limpiar"**: restablece todos los filtros a la vez.
- Funciona completamente **sin conexión**: no necesita internet ni un servidor.

### `messages.json`: formato de los mensajes

```json
{
  "msgId": "1234567890",
  "timestamp": "2024-03-15T14:32:00.000Z",
  "author": "Username",
  "text": "Message content",
  "images": ["https://cdn.discordapp.com/..."],
  "attachments": [{ "label": "file.pdf", "url": "https://..." }],
  "localImages": ["images/photo_<sha256>.png"],
  "localAttachments": [
    { "label": "file.pdf", "path": "attachments/file_<sha256>.pdf" }
  ]
}
```

---

## Configuración

Todas las opciones ajustables están centralizadas en [src/config.js](src/config.js):

```js
module.exports = {
  backupDir: path.join(__dirname, "..", "backups"),      // Directorio de salida
  profileDir: path.join(__dirname, "..", "browser-profile"), // Sesión del navegador
  apiBatchSize: 50,      // Mensajes por solicitud (máximo de Discord = 100)
  apiDelayMs: 400,       // Pausa en ms entre páginas (evita los límites de frecuencia)
  downloadTimeoutMs: 20000, // Tiempo de espera en ms para cada descarga
};
```

Si Discord devuelve HTTP 429 (límite de frecuencia), aumenta `apiDelayMs` a `800` o `1000`.
Los archivos que superan `downloadTimeoutMs` se marcan como `[skip]` y el proceso continúa.

Las rutas de los directorios también se pueden cambiar con variables de entorno (`DISCORD_BACKUP_DIR` y `DISCORD_PROFILE_DIR`).

---

## Tipos de archivo descargados

| Tipo        | Ejemplos                   |
|-------------|----------------------------|
| Imágenes    | PNG, JPG, GIF, WEBP        |
| Documentos  | PDF, DOCX, XLSX, PPTX      |
| Videos      | MP4, MOV, AVI, MKV         |
| Audio       | MP3, WAV, OGG, FLAC        |
| Comprimidos | ZIP, RAR, 7Z               |
| Otros       | TXT, CSV, JSON, EXE        |

---

## Solución de problemas

### "Token not captured yet"

El navegador no tiene una sesión iniciada en Discord. Inicia sesión y vuelve a intentarlo.

### "Could not detect channel ID"

La URL actual no corresponde a un canal de texto. Asegúrate de estar en una URL de canal que contenga `/channels/`.

### HTTP 403 desde la API

Tu cuenta no tiene acceso a ese canal.

### HTTP 429 (límite de frecuencia)

Aumenta `apiDelayMs` en `src/config.js` a `800` o `1000`.

### Las imágenes devuelven 404 al descargarse

Los enlaces de la CDN de Discord caducan después de un tiempo. Haz la copia del canal mientras los enlaces sigan siendo válidos (normalmente duran varios días).
Los enlaces de Google Docs o Notion que devuelven 403 no se pueden descargar; es el comportamiento esperado.

### "Failed to create a ProcessSingleton" al iniciar

La ejecución anterior no se cerró correctamente y dejó un bloqueo en `browser-profile/`.
Elimina el archivo `browser-profile/SingletonLock` y vuelve a ejecutar el script.

---

## Notas

- La copia de seguridad **omite los archivos que ya existen** en disco, por lo que es seguro volver a ejecutarla en un canal ya procesado. Solo se sobrescriben `messages.json` e `index.html`. Las copias creadas antes del esquema actual de nombres de archivo vuelven a descargar sus medios; consulte las notas de actualización en [CHANGELOG.md](CHANGELOG.md).
- Las carpetas reciben el nombre del canal, con los caracteres no válidos en Windows saneados.
- La carpeta `browser-profile/` contiene tu sesión de Chrome; no la elimines o perderás la autenticación guardada.
- `backups/` y `browser-profile/` son directorios de ejecución preservados (runtime directories); la limpieza y la reestructuración del código fuente nunca los mueven ni los eliminan.

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) (en inglés).

## Registro de cambios

Consulta [CHANGELOG.md](CHANGELOG.md) (en inglés).
