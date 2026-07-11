# Revisión de calidad — 2026-07-11

Revisión del estado actual del proyecto `discord-channel-dump` después de completar y archivar el cambio `p1-polish-security`.

---

## P0 — Arreglar antes de que CI pase en serio

### CI no instala los navegadores de Playwright

- **Problema**: `.github/workflows/ci.yml` ejecuta `npm ci` pero no instala Chromium. Las suites `test/browser/session.test.js` y `test/viewer-dom.test.js` lanzan un navegador real, por lo que CI fallará en GitHub.
- **Impacto**: CI rojo en cualquier push/PR.
- **Fix**: agregar `npx playwright install chromium` después de `npm ci`.

---

## P1 — Alto valor, bajo riesgo

### 1. Validación de configuración incompleta

- **Problema**: `validateConfig` en `src/config.js` no revisa `maxRetries`, `maxRedirects`, `retryDelayMs` ni `jitterMaxMs`. `bin/backup.js` valida la config, pero un error muestra stack trace en vez de un mensaje amigable.
- **Fix**:
  - Validar todos los tunables numéricos en `validateConfig`.
  - En `bin/backup.js`, capturar `ConfigError` y mostrar un mensaje claro.

### 2. El objeto `config` exportado es mutable

- **Problema**: `module.exports = { ...defaults }` expone un objeto vivo. `bin/backup.js` lo muta directamente con `applyOverrides`. Cualquier módulo podría cambiar la config global en runtime.
- **Fix**: congelar el objeto exportado con `Object.freeze()` o usar una factory `loadConfig(overrides)`.

### 3. Manejo de errores en `regen-html.js`

- **Problema**: `JSON.parse` de `messages.json` sin try/catch; si el JSON está corrupto, tira stack trace. Además importa `generateHtml` desde `../src/utils` en vez de `../src/viewer/render`.
- **Fix**: importar desde el módulo canonical y envolver errores de lectura/parseo.

### 4. Shutdown no espera limpieza

- **Problema**: `shutdown()` en `src/app.js` llama `process.exit(1)` después de 100 ms. El cierre del contexto puede no completarse.
- **Fix**: esperar `context.close()` antes de salir, y evitar `process.exit` cuando el control puede devolverse al caller.

### 5. Faltan tests para `config.js`

- **Problema**: No hay cobertura de `maxRetries`, `maxRedirects`, `retryDelayMs`, `jitterMaxMs` ni del mensaje de error amigable en CLI.
- **Fix**: agregar tests unitarios para `validateConfig` y un test de CLI para `ConfigError`.

---

## P2 — Mejoras de calidad

1. **Logging desestructurado**: mezcla de `console.log`, `console.error`, `process.stdout.write` y mensajes hardcodeados. Opción: `src/ui/logger.js` con niveles y flag `--verbose`.
2. **Cobertura de errores de red en `src/api/discord.js`**: solo se prueba el happy path y 429; faltan network errors, timeouts y respuestas malformadas.
3. **Falta modo `--dry-run`**: útil para verificar token + canal sin descargar nada.
4. **Mejorar detección de nombre de canal en el DOM**: `getChannelNameFromDom` depende de clases internas de Discord. Opción: usar `aria-label` o `document.title` como fallback.

---

## P3 — Pulido y documentación

1. `CHANGELOG.md`
2. Guía de contribución
3. JSDoc o tipos básicos para funciones públicas
4. Preparar para publicar en npm (`.npmignore`, `files` en `package.json`)

---

## Primer paquete recomendado

**P0 + P1.1 + P1.2** (CI + validación completa de config + inmutabilidad de config).
Son cambios chicos, de alto impacto y desbloquean CI confiable.
