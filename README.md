# Arriendos

Aplicación personal de escritorio para comparar departamentos, con Tauri 2, React, TypeScript y SQLite. Montos en CLP. Guarda enlaces y datos manualmente, filtra y ordena opciones y marca departamentos como contactados o visitados.

## Instalar en Windows 11 sin herramientas de desarrollo

Consulta [Instalar Arriendos en Windows 11](docs/INSTALAR-WINDOWS.md). GitHub Actions genera un instalador `.exe` x64 con WebView2 offline y accesos directos. Para usar la app no se necesita Node.js, Rust, VS Code, terminal ni navegador abierto.

## Compilación y verificación en GitHub

Workflow: [Instalador Windows](.github/workflows/windows-installer.yml).

- Se ejecuta con cambios a `main`, ramas `codex/**`, tags `v*`, PRs a `main` o manualmente.
- Usa Windows, Node 22, Rust estable, `npm ci` y `Cargo.lock` con `--locked`.
- Ejecuta pruebas de filtros, migración compatible con la base original y compilación web.
- Descarga el código real de 0.1.0 (commit fijo), construye e instala esa versión, guarda tres departamentos mediante su interfaz y verifica el archivo SQLite real con Python.
- Cierra normalmente la ventana y comprueba los mismos datos después de reabrir.
- Construye 0.2.0, actualiza la instalación 0.1.0 y compara los tres registros originales antes de editar. Comprueba también los nuevos campos, filtros y columnas persistentes.
- Las pruebas nativas se conectan al WebView2 propio de la app con Playwright/CDP. No lanzan un navegador externo. Sólo el proceso de pruebas habilita temporalmente el puerto de depuración local; el programa distribuido no lo habilita.
- Durante las pruebas se bloquean las solicitudes HTTP(S) externas. Los protocolos locales de Tauri siguen habilitados para probar el IPC real. No es una prueba de todas las configuraciones de red o de seguridad de Windows.
- Publica `Arriendos-Windows-x64` únicamente si los pasos anteriores pasan; incluye instalador, SHA-256 e instrucciones. Screenshots de las pruebas se conservan en `pruebas-windows`.

Configurar el workflow no equivale a ejecutarlo. La compilación nativa y las pruebas de actualización sólo se consideran verificadas tras una ejecución verde en Windows. La instalación de WebView2 sin conexión está configurada según las opciones oficiales de Tauri; el runner normalmente ya tiene WebView2 y no prueba un Windows limpio sin ese componente. No hay firma de código ni publicación automática en Releases.

## Persistencia y futuras versiones

- Base real: `%APPDATA%\cl.personal.arriendos\arriendos.db` en Windows (AppConfig de Tauri).
- Identidad estable: `cl.personal.arriendos`. **No cambiarla** ni cambiar `sqlite:arriendos.db` al actualizar.
- El instalador reemplaza binarios; los datos viven fuera del directorio de instalación.
- Las migraciones se registran en Rust mediante `tauri-plugin-sql`. La v1 adopta la tabla de la primera versión sin borrar filas. No editar migraciones publicadas: agregar v2, v3, etc. con cambios aditivos y pruebas de conservación de datos.
- Para nuevas versiones, subir la versión en `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` y `src-tauri/tauri.conf.json` de forma coherente. El job comprueba una actualización real desde 0.1.0, incluyendo registros JSON sin los nuevos campos.
- Guardar, editar y eliminar usan consultas parametrizadas. Los errores de lectura bloquean la edición para evitar sobrescribir datos que no se pudieron cargar.
- SQLite no está cifrado. No se sincroniza entre computadores. La vista web usa localStorage separado y no transfiere automáticamente sus datos.

## Desarrollo (opcional)

Sólo para modificar el código: Node.js 22+, Rust estable y los [prerrequisitos de Tauri 2](https://v2.tauri.app/start/prerequisites/) de tu sistema. VS Code es opcional.

```sh
npm ci
npm run tauri dev
```

Compilar instalador **desde Windows**:

```sh
npm run tauri build -- --bundles nsis -- --locked
```

Salida: `src-tauri/target/release/bundle/nsis/`. El modo offline descarga WebView2 durante la compilación para incluirlo en el `.exe`; quien lo instala no necesita descargarlo.

Pruebas locales independientes de la compilación nativa:

```sh
npm test
npm run build
python -m unittest discover -s scripts -p "test_*.py" -v
```

Vista web para desarrollar: `npm run dev`. Usa almacenamiento del navegador separado de SQLite.

## Funciones

Crear, editar y eliminar departamentos; enlace, arriendo, gastos comunes, superficie, estación y distancia al metro, piso, calificaciones de terraza y terminaciones (1–5 o sin evaluar), estacionamientos, teléfono y notas. Búsqueda por nombre/metro/notas; filtros por estado, costo mensual total, estación y estacionamiento; orden por fecha, costo total, superficie o distancia. Exportación JSON sin importación. No hay extracción automática de datos de plataformas ni contacto automático con anunciantes.

## Versión 0.2.0

Vista de tabla con columnas configurables (preferencias locales de la interfaz), disponibilidad reversible `active`/`paused`/`finished`, código externo opcional, marca de visita agendada y fecha/hora local. La búsqueda incluye el código y el teléfono; los filtros de disponibilidad y seguimiento se combinan. Las marcas de contacto, agenda y visita realizada son independientes. Cancelar la agenda borra su fecha; marcar como visitado no borra el historial de la agenda.

`normalizeApartment` completa valores nuevos al leer registros 0.1.0 sin reescribirlos. No cambia IDs internos, fechas, tabla, migraciones publicadas, ruta ni identificador de la app. Al editar sólo se actualiza el registro seleccionado en SQLite. La prueba nativa compara el contenido original de tres registros tras la instalación de la nueva versión.

Prueba de interfaz web (con `npm run dev` ya iniciado, Chromium instalado; configurar `CHROMIUM_PATH` y `APP_URL` si corresponde): `node scripts/web-smoke.mjs`. No sustituye la prueba nativa de Windows.
