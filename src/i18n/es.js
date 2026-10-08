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
  "app.prompt.capture": 'ENTER para capturar | "salir" para terminar: ',
  "app.prompt.confirmName": "Confirme (ENTER) o escriba un nombre personalizado: ",
  "app.tokenMissing":
    "Aún no se capturó el token. Verifique que Discord esté abierto y cargado, y vuelva a intentarlo.",
  "app.channelIdMissing": "No se pudo detectar el ID del canal. Abra un canal primero.",
  "app.channelId": "ID del canal: {id}",
  "app.channelName": 'Nombre del canal: "{name}"',
  "app.dryRunSummary": "Simulación: se respaldarían {count} mensajes.",
  "app.done": "Listo.",
  "app.shutdown": "Cancelando y limpiando…",
});
