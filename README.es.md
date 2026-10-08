# Discord Channel Dump

[English](README.md) | **Español**

> **Nota:** este documento es una traducción de [README.md](README.md). Si hay diferencias, la versión en inglés es la referencia oficial.

Copias de seguridad de canales de texto de Discord en el disco: todos los mensajes en JSON, todas las imágenes y los adjuntos, y un visor HTML sin conexión. La herramienta controla una ventana real de Chromium con Playwright y usa la sesión normal de usuario de Discord, por lo que no requiere un token de bot ni permisos de administrador. La interfaz está en español de forma predeterminada y se puede cambiar a inglés.

---

## Inicio rápido

Requiere Node.js `^20.19.0`, `^22.13.0` o `>=24`.

```bash
npm install
npx playwright install chromium
node bin/backup.js
```

Se abre una ventana del navegador. Inicie sesión en Discord, abra el canal que desea respaldar, vuelva a la terminal y presione **ENTER**. La copia de seguridad se guarda en `backups/<nombre-del-canal>/`. Agregue `--lang en` para usar la interfaz en inglés.

---

## Uso

### Flujo por canal

1. Ejecute `node bin/backup.js`. Se abre una ventana del navegador con Discord (con la sesión ya iniciada si usó la herramienta antes).
2. **Inicie sesión** en la primera ejecución. La sesión se guarda en `browser-profile/`.
3. **Abra el canal** que desea respaldar. No hace falta desplazarse.
4. Vuelva a la terminal y presione **ENTER** en el mensaje de captura:
   - Español (predeterminado): `ENTER para capturar | "salir" para terminar:`
   - Inglés (`--lang en`): `ENTER to capture | "exit" to quit:`
5. La herramienta detecta el nombre del canal. Presione **ENTER** para confirmarlo o escriba un nombre personalizado.
6. Se descargan todos los mensajes, las imágenes y los adjuntos con una barra de progreso.
7. Repita desde el paso 3 para cada canal.
8. Escriba `salir` o `exit` (ambas palabras funcionan en los dos idiomas) para cerrar el navegador.

### Opciones

Ejecute `node bin/backup.js --help` para ver la misma lista en la terminal.

| Opción | Qué hace |
| --- | --- |
| `-h`, `--help` | Muestra la ayuda. |
| `-v`, `--version` | Muestra la versión. |
| `-o`, `--output <dir>` | Directorio de salida de las copias de seguridad. |
| `-p`, `--profile <dir>` | Directorio del perfil del navegador. |
| `--lang <code>` | Idioma de la interfaz: `es` (predeterminado) o `en`. Tiene prioridad sobre `DISCORD_LANG`. |
| `--verbose` | Muestra información de depuración (líneas `[debug]` en stderr). |
| `--dry-run` | Obtiene la cantidad de mensajes sin guardar archivos ni descargar contenido multimedia. |

```bash
node bin/backup.js --output ./my-backups
node bin/backup.js -p ./my-profile -o ./my-backups
node bin/backup.js --dry-run
```

### Variables de entorno

| Variable | Qué hace |
| --- | --- |
| `DISCORD_LANG` | Idioma de la interfaz (`es` o `en`). `--lang` tiene prioridad. Un valor no válido muestra una advertencia y la herramienta usa `es`. |
| `DISCORD_BACKUP_DIR` | Directorio de salida de las copias de seguridad. `--output` tiene prioridad. |
| `DISCORD_PROFILE_DIR` | Directorio del perfil del navegador. `--profile` tiene prioridad. |
| `NO_COLOR` | Con el valor `1`, desactiva los colores en la salida. |

### Scripts de npm

| Script | Ejecuta |
| --- | --- |
| `npm run backup` | `node bin/backup.js` |
| `npm run regen -- <dir>` | `node bin/regen-html.js <dir>` |
| `npm run install-browser` | `npx playwright install chromium` |
| `npm test` | Las pruebas (`npm run test:watch` las vuelve a ejecutar ante cambios) |
| `npm run lint` | ESLint |
| `npm run format:check` | Verificación de Prettier (`npm run format` reescribe los archivos) |

Las opciones de la CLI se pasan después de `--`, por ejemplo `npm run backup -- --lang en --output ./my-backups`.

### Regenerar el visor de una copia existente

`bin/regen-html.js` vuelve a generar `index.html` a partir de un `messages.json` existente. Sirve para incorporar funciones nuevas del visor o para cambiar su idioma. Acepta `-h`/`--help`, `-v`/`--version` y `--lang <code>`.

```bash
# Un canal, visor en español (predeterminado)
node bin/regen-html.js backups/channel-name

# Un canal, visor en inglés
node bin/regen-html.js backups/channel-name --lang en

# Todos los canales (PowerShell)
Get-ChildItem backups -Directory | ForEach-Object { node bin/regen-html.js "backups/$($_.Name)" }

# Todos los canales (bash)
for dir in backups/*/; do node bin/regen-html.js "$dir"; done
```

Al terminar, se muestra una línea como `Listo: <ruta>/index.html  (120 mensajes)`.

### Uso del paquete instalado

El paquete expone un comando, `discord-channel-dump`, que ejecuta `bin/backup.js` y acepta las mismas opciones. Después de instalarlo, ejecute `npx playwright install chromium` una vez. `bin/regen-html.js` no tiene un comando instalado; ejecútelo desde un clon del repositorio.

Con el paquete instalado, las carpetas predeterminadas `backups/` y `browser-profile/` se crean dentro del propio directorio de instalación del paquete (por ejemplo, dentro del `node_modules` global). Reinstalar o desinstalar el paquete puede eliminarlas, por lo que se recomienda indicar siempre carpetas propias:

```bash
discord-channel-dump --output ~/discord-backups --profile ~/.discord-channel-dump-profile
```

También puede definir `DISCORD_BACKUP_DIR` y `DISCORD_PROFILE_DIR` una sola vez.

---

## Idioma

La interfaz está en **español de forma predeterminada**. Para cambiarla a inglés:

| Cómo | Ejemplo |
| --- | --- |
| Opción (máxima prioridad) | `node bin/backup.js --lang en` |
| Variable de entorno | `DISCORD_LANG=en node bin/backup.js` |
| Sin configurar | Español (`es`) |

Un valor no válido en `--lang` es un error: la herramienta muestra los valores admitidos y termina con código 1. El mensaje usa el idioma de `DISCORD_LANG` si es válido y, si no, el español:

```
Error: Valor no válido para --lang: "fr". Valores admitidos: es, en.
```

Un valor no válido en `DISCORD_LANG` solo muestra una advertencia en stderr, y la herramienta continúa en español:

```
Advertencia: valor no válido para DISCORD_LANG: "fr". Valores admitidos: es, en. Se usará el idioma predeterminado (es).
```

Qué sigue el idioma seleccionado:

- **Salida de la terminal**: ayuda, mensajes interactivos, progreso, resúmenes y errores de la API de Discord, de las descargas y de la validación de la configuración. Las descargas fallidas se marcan con `[omitido img]` / `[omitido adj]` en español y `[skip img]` / `[skip att]` en inglés.
- **Visor sin conexión**: el atributo `lang` de la página, las etiquetas, la cantidad de mensajes en singular o plural y las fechas (formato `es-AR` o `en-US`).

Qué no cambia: las líneas `[debug]` de `--verbose` siguen en inglés, y las palabras para terminar `salir` y `exit` funcionan en los dos idiomas.

El idioma del visor queda fijo al escribir `index.html`. Para cambiarlo en una copia existente, regenérelo:

```bash
node bin/regen-html.js backups/channel-name --lang en
```

Los scripts que analicen la salida de la terminal deben fijar un idioma, por ejemplo con `DISCORD_LANG=en`.

---

## Estructura de la salida

```
backups/
  channel-name/
    messages.json       <- todos los mensajes, del más antiguo al más reciente (arreglo JSON)
    index.html          <- visor sin conexión con estilo de Discord
    images/
      photo_<sha256>.png
      screenshot_<sha256>.jpg
    attachments/
      report_<sha256>.pdf
      spreadsheet_<sha256>.xlsx
      video_<sha256>.mp4
```

### Archivos multimedia

Se descargan todos los adjuntos, sea cual sea su tipo. Lo único que se decide es en qué carpeta se guardan:

| Carpeta | Qué se guarda |
| --- | --- |
| `images/` | Adjuntos cuyo nombre termina en `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.svg`, `.tif` o `.tiff`, además de las imágenes y miniaturas de los embeds. |
| `attachments/` | Todos los demás adjuntos (documentos, videos, audio, archivos comprimidos, etc.), además de los videos de los embeds. |

`<sha256>` es el resumen SHA-256 de 64 caracteres en minúsculas de la identidad canónica del recurso: el origen y la ruta de la URL más los parámetros de consulta restantes, ordenados. Se ignoran los parámetros volátiles de firma de la CDN de Discord (`ex`, `is` y `hm`, sin distinguir mayúsculas de minúsculas) y los fragmentos de la URL, de modo que las firmas rotativas reutilizan el mismo archivo en lugar de descargar duplicados. Cualquier otro parámetro de consulta mantiene los recursos separados, aunque compartan el nombre de archivo. Los nombres de los archivos multimedia se limitan a 255 bytes en UTF-8, recortando el nombre legible cuando hace falta; la extensión se conserva siempre que el sufijo del hash y la extensión quepan.

### `messages.json`

El archivo es un arreglo JSON de mensajes, ordenados del más antiguo al más reciente. `author` es el nombre visible o, si no existe, el nombre de usuario, y vale `null` cuando Discord no proporciona ninguno. `localImages` y `localAttachments` incluyen solo los archivos que se guardaron correctamente.

```json
[
  {
    "msgId": "1234567890",
    "timestamp": "2024-03-15T14:32:00.000Z",
    "author": "Username",
    "text": "Message content",
    "images": ["https://cdn.discordapp.com/..."],
    "attachments": [{ "label": "file.pdf", "url": "https://..." }],
    "localImages": ["images/photo_<sha256>.png"],
    "localAttachments": [{ "label": "file.pdf", "path": "attachments/file_<sha256>.pdf" }]
  }
]
```

### Visor sin conexión (`index.html`)

- **Búsqueda en tiempo real**: filtra los mensajes por texto o autor y resalta las coincidencias (marcador de posición: "Buscar en el chat…").
- **Filtro por rango de fechas**: selectores "Desde" y "Hasta" que se combinan con la búsqueda.
- **Ctrl+F** (o Cmd+F): lleva el foco a la búsqueda propia en lugar del cuadro de búsqueda del navegador.
- **Botón "Limpiar"**: restablece todos los filtros a la vez.
- Funciona completamente **sin conexión**: no requiere internet ni un servidor.

---

## Cómo funciona

En lugar de desplazarse por la página de Discord (frágil y lento), la herramienta lee la **API REST** de Discord:

```
1. Chromium (Playwright) abre Discord con el perfil guardado.
2. La herramienta lee el token del encabezado Authorization de las propias solicitudes de la aplicación web a la API.
3. Node.js llama a la API con ese token mediante el contexto de solicitudes de Playwright:
     GET /api/v9/channels/{id}/messages?limit=50&before={id}
   y pagina hacia atrás hasta el primer mensaje.
4. Se descarga el contenido multimedia desde la CDN y luego se escriben messages.json e index.html.
```

Así se obtienen **todos los mensajes**, sin problemas de desplazamiento ni de tiempos de espera. Las solicitudes a la API se ejecutan en el proceso de Node.js (`context.request` de Playwright), no dentro de la página web.

El navegador se abre **una vez por ejecución** y mantiene la sesión iniciada entre ejecuciones gracias al perfil persistente de `browser-profile/`, por lo que no es necesario iniciar sesión cada vez.

---

## Configuración

En la mayoría de los casos alcanza con las opciones y las variables de entorno anteriores. Los demás parámetros están en [src/config.js](src/config.js), que es la única fuente de verdad y valida cada valor al iniciar:

| Parámetro | Predeterminado | Significado |
| --- | --- | --- |
| `backupDir` | `backups/` | Directorio de salida (`--output`, `DISCORD_BACKUP_DIR`). |
| `profileDir` | `browser-profile/` | Directorio del perfil del navegador (`--profile`, `DISCORD_PROFILE_DIR`). |
| `apiBatchSize` | `50` | Mensajes por solicitud a la API (entero de 1 a 100). |
| `apiDelayMs` | `400` | Pausa entre páginas de la API, en milisegundos. |
| `downloadTimeoutMs` | `20000` | Tiempo de espera de cada solicitud de descarga, en milisegundos. |
| `maxRetries` | `3` | Reintentos de una descarga tras un error de red, un tiempo de espera agotado, HTTP 429 o HTTP 5xx. |
| `maxRedirects` | `10` | Redirecciones que se siguen por descarga. |
| `retryDelayMs` | `1000` | Demora base entre reintentos; se duplica en cada reintento. |
| `jitterMaxMs` | `500` | Demora aleatoria máxima que se suma a cada reintento. |
| `dryRun` | `false` | Lo establece `--dry-run`. |
| `language` | `es` | Lo establecen `--lang` o `DISCORD_LANG`. |

`backups/` y `browser-profile/` son relativos a la raíz del proyecto (o del paquete). Si Discord limita las solicitudes a la API, la herramienta espera el tiempo que indica Discord y vuelve a intentarlo; si ocurre con frecuencia, aumente `apiDelayMs` a `800` o `1000`. Una descarga que sigue fallando después de los reintentos se marca como omitida y la copia continúa.

---

## Seguridad y privacidad

| Qué | Dónde | Qué hacer |
|-----|-------|-----------|
| Sesión iniciada de Discord (cookies y datos del sitio de la aplicación web de Discord) | `browser-profile/` | Trátela como una contraseña. Nunca la suba a un repositorio ni la comparta. Elimine la carpeta para cerrar la sesión. |
| Token de autorización de Discord capturado por la herramienta | Memoria del proceso, durante la ejecución actual | No hace falta hacer nada. La herramienta no lo registra ni lo escribe en el disco. |
| Contenido de mensajes privados y adjuntos | `backups/` | Guárdelos y compártalos con el mismo cuidado que las conversaciones originales. |

- **Manejo del token**: la herramienta lee el token del encabezado `Authorization` de las solicitudes que la aplicación web de Discord envía a `discord.com/api`. Lo conserva en memoria durante la ejecución actual y lo envía solo con sus propias solicitudes a la API de Discord, que se ejecutan en el proceso de Node.js mediante Playwright. Las descargas de contenido multimedia desde la CDN no lo incluyen.
- **Git**: `backups/` y `browser-profile/` están en `.gitignore`. Si cambia su ubicación con `--output`, `--profile` o variables de entorno, mantenga usted mismo las carpetas nuevas fuera del control de versiones.

### Aviso legal

- Automatizar una cuenta de usuario puede infringir los [Términos de servicio de Discord](https://discord.com/terms). Use esta herramienta bajo su propia responsabilidad.
- Respalde solo contenido al que tenga derecho a acceder y conservar.
- Este proyecto no está afiliado a Discord ni cuenta con su respaldo o patrocinio.

---

## Solución de problemas

Los mensajes se muestran en español y, entre paréntesis, en inglés.

| Mensaje o síntoma | Causa y solución |
| --- | --- |
| `Aún no se capturó el token…` (`Token not captured yet…`) | Discord no terminó de cargar o no hay una sesión iniciada. Inicie sesión, espere a que Discord cargue y vuelva a presionar ENTER. |
| `No se pudo detectar el ID del canal…` (`Could not detect channel ID…`) | La página actual no es un canal. Abra una URL de canal que contenga `/channels/`. |
| `La API respondió 403` (`API 403`) | Su cuenta no tiene acceso a ese canal. La ejecución termina con un error fatal; iníciela de nuevo y abra otro canal. |
| `[límite de solicitudes] esperando…` (`[rate limit] waiting…`) | Discord está limitando las solicitudes. La herramienta espera y vuelve a intentarlo; si ocurre con frecuencia, aumente `apiDelayMs` en [src/config.js](src/config.js) a `800` o `1000`. |
| `[omitido img]` o `[omitido adj]` (`[skip img]`, `[skip att]`) con `Error HTTP 404` o `Error HTTP 403` | El enlace venció o no se puede descargar. Los enlaces de la CDN de Discord vencen después de un tiempo (normalmente varios días), así que conviene respaldar los canales mientras los enlaces son válidos. Es esperable que fallen los enlaces a Google Docs o Notion que devuelven 403. |
| `Valor no válido para --lang` (`Invalid value for --lang`) | Use `--lang es` o `--lang en`. |
| `Failed to create a ProcessSingleton` al iniciar | Una ejecución anterior no se cerró correctamente y dejó un bloqueo en el perfil. Elimine `browser-profile/SingletonLock` y vuelva a ejecutar la herramienta. |

---

## Notas

- Volver a ejecutar la copia de un canal es seguro: los archivos multimedia que ya existen se **reutilizan** y no se vuelven a descargar. Solo se sobrescriben `messages.json` e `index.html`. Las copias creadas antes del esquema actual de nombres de archivo vuelven a descargar su contenido multimedia; consulte las notas de actualización en [CHANGELOG.md](CHANGELOG.md).
- Las carpetas de los canales se nombran a partir del nombre del canal, con los caracteres no válidos en Windows reemplazados.
- `browser-profile/` contiene la sesión de Chromium. Eliminarla cierra la sesión.
- `backups/` y `browser-profile/` son directorios de ejecución preservados (runtime directories); las tareas de limpieza y reestructuración del código nunca los mueven ni los eliminan.

## Contribuir

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) (en inglés).

## Registro de cambios

Consulte [CHANGELOG.md](CHANGELOG.md) (en inglés).
