/**
 * Spanish (es) message dictionary: flat key -> template map.
 *
 * Templates use `{name}` placeholders. Keep the key set and placeholders
 * identical to `en.js` (enforced by test/i18n/index.test.js).
 */

"use strict";

module.exports = Object.freeze({
  // Shared CLI messages (bin/backup.js, bin/regen-html.js, src/cli).
  "cli.error": "Error: {message}",
  "cli.fatalError": "Error fatal:",
  "cli.args.missingValue": "Falta el valor de {option}",
  "cli.args.unknownOption": "Opción desconocida: {option}",
  "cli.args.unexpectedArgument": "Argumento inesperado: {argument}",
  "cli.language.invalid":
    'Valor no válido para {source}: "{value}". Valores admitidos: {supported}.',
  "cli.language.invalidEnvWarning":
    'Advertencia: valor no válido para {source}: "{value}". Valores admitidos: {supported}. ' +
    "Se usará el idioma predeterminado ({default}).",

  // bin/backup.js
  "cli.backup.help": [
    "Uso: node bin/backup.js [opciones]",
    "",
    "Opciones:",
    "  -h, --help            Muestra esta ayuda",
    "  -v, --version         Muestra la versión",
    "  -o, --output <dir>    Directorio de salida de las copias de seguridad",
    "  -p, --profile <dir>   Directorio del perfil del navegador",
    "      --lang <code>     Idioma de la interfaz: {supported} (predeterminado: {default})",
    "                        (tiene prioridad sobre la variable de entorno DISCORD_LANG)",
    "      --verbose         Muestra información de depuración",
    "      --dry-run         Obtiene la cantidad de mensajes sin guardar archivos",
    "",
    "Ejemplos:",
    "  node bin/backup.js",
    "  node bin/backup.js --output ./my-backups",
    "  node bin/backup.js --profile ./my-profile --output ./my-backups",
    "  node bin/backup.js --dry-run",
    "  node bin/backup.js --lang en",
  ].join("\n"),

  // bin/regen-html.js
  "cli.regen.help": [
    "Uso: node bin/regen-html.js [opciones] <backup-folder>",
    "",
    "Opciones:",
    "  -h, --help        Muestra esta ayuda",
    "  -v, --version     Muestra la versión",
    "      --lang <code> Idioma de la interfaz: {supported} (predeterminado: {default})",
    "                    (tiene prioridad sobre la variable de entorno DISCORD_LANG)",
    "",
    "Ejemplos:",
    "  node bin/regen-html.js backups/channel-name",
    "  node bin/regen-html.js --lang en backups/channel-name",
    "  node bin/regen-html.js --help",
  ].join("\n"),
  "cli.regen.missingFolder": "Falta el argumento backup-folder.",
  "cli.regen.notFound": "No se encontró: {path}",
  "cli.regen.parseError": "No se pudo leer o interpretar {path}: {reason}",
  "cli.regen.done": "Listo: {path}  ({count} mensajes)",

  // src/app.js interactive session
  "app.banner": "Discord Channel Dump  v{version} (modo API)",
  "app.profileLabel": "Perfil:",
  "app.loginHint": "Inicie sesión en Discord si se le solicita.",
  "app.navigateHint": "Luego abra cualquier canal y presione ENTER.",
  // Typed at the capture prompt to quit. Every language's word is accepted.
  "app.exitCommand": "salir",
  "app.prompt.capture": 'ENTER para capturar | "{exit}" para terminar: ',
  "app.prompt.confirmName": "Confirme (ENTER) o escriba un nombre personalizado: ",
  "app.tokenMissing":
    "Aún no se capturó el token. Verifique que Discord esté abierto y cargado, y vuelva a intentarlo.",
  "app.channelIdMissing": "No se pudo detectar el ID del canal. Abra un canal primero.",
  "app.channelId": "ID del canal: {id}",
  "app.channelName": 'Nombre del canal: "{name}"',
  "app.dryRunSummary": "Simulación: se respaldarían {count} mensajes.",
  "app.done": "Listo.",
  "app.shutdown": "Cancelando y limpiando…",

  // src/output/writer.js
  "writer.images.label": "Imágenes",
  "writer.images.skipTag": "[omitido img]",
  "writer.images.done": "Imágenes listas.",
  "writer.attachments.label": "Adjuntos",
  "writer.attachments.skipTag": "[omitido adj]",
  "writer.attachments.done": "Adjuntos listos.",
  "writer.progress":
    "{processed}/{total} archivos | descargados: {downloaded} reutilizados: {reused} fallidos: {failed} {elapsed}s",
  "writer.mediaSummary": "Descargados: {downloaded}, reutilizados: {reused}, fallidos: {failed}.",
  "writer.folder": "Carpeta: {path}",
  "writer.saved": "Se guardaron",
  "writer.messages": "mensajes",
  "writer.mediaCounts": "Imágenes: {images} | Adjuntos: {attachments}",
  "writer.output": "Salida: {path}",
  "writer.invalidName.empty":
    'Nombre de canal no válido "{name}": se esperaba un subdirectorio de canal no vacío',
  "writer.invalidName.reserved":
    'Nombre de canal no válido "{name}": es un nombre reservado en Windows',
  "writer.invalidName.outsideBackupDir":
    'Nombre de canal no válido "{name}": el directorio resultante debe estar dentro de backupDir',

  // src/api/discord.js
  "api.rateLimitWait": "[límite de solicitudes] esperando {seconds}s…",
  "api.pageFetched": "Página {page}: {count} mensajes obtenidos...",
  "api.error": "La API respondió {status}: {text}",

  // src/downloader.js
  "downloader.cancelled": "Descarga cancelada",
  "downloader.redirectWithoutLocation": "Redirección sin encabezado Location — {url}",
  "downloader.tooManyRedirects": "Demasiadas redirecciones — {url}",
  "downloader.httpStatus": "Error HTTP {status} — {url}",
  "downloader.timeout": "Tiempo de espera agotado (>{seconds}s) — {url}",

  // src/config.js validation. {field} is a config field name and stays untranslated.
  "config.notObject": "La configuración debe ser un objeto.",
  "config.nonEmptyString": "{field} debe ser una cadena no vacía.",
  "config.integerRange": "{field} debe ser un número entero entre {min} y {max}",
  "config.nonNegativeNumber": "{field} debe ser un número no negativo.",
  "config.positiveNumber": "{field} debe ser un número positivo.",
  "config.positiveInteger": "{field} debe ser un número entero positivo.",
  "config.boolean": "{field} debe ser un valor booleano.",
  "config.oneOf": "{field} debe ser uno de estos valores: {values}.",
});
