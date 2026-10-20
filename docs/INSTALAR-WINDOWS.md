# Instalar Arriendos en Windows 11

No necesitas VS Code, Node.js, Rust, una terminal ni un navegador abierto para usar la aplicación. GitHub construye el programa; tú descargas e instalas el resultado. Esta compilación es para Windows 11 **x64** (Intel/AMD). No se ha validado Windows ARM64.

## 1. Obtener el instalador desde GitHub

Primero, los archivos de este proyecto deben estar guardados en tu repositorio de GitHub, incluida la carpeta `.github/workflows`. Un archivo local de workflow por sí solo no ejecuta GitHub Actions.

1. Abre `https://github.com/benjafondon22/arriendos` e inicia sesión.
2. Entra en la pestaña **Actions**.
3. Selecciona **Instalador Windows**. Se ejecuta automáticamente al subir cambios a `main`; también puedes pulsar **Run workflow → Run workflow** cuando el workflow ya esté en la rama predeterminada.
4. Espera a que la ejecución termine en verde. La primera puede tardar varias decenas de minutos: compila Rust, descarga WebView2 y prueba dos instalaciones.
5. Abre esa ejecución y baja a **Artifacts**. Descarga **Arriendos-Windows-x64** (no `pruebas-windows`). Puede ser necesario haber iniciado sesión en GitHub.
6. En Descargas, haz clic derecho en el ZIP y elige **Extraer todo**.
7. Dentro encontrarás un archivo como **Arriendos_0.1.0_x64-setup.exe**, `SHA256SUMS.txt` y estas instrucciones. No descargues **Source code**: ese es el código, no la app instalable.

El instalador se publica como artifact sólo después de superar las pruebas nativas de ese workflow. Los artifacts expiran a los 90 días: conserva el `.exe` o vuelve a ejecutar el workflow cuando lo necesites. No se crean Releases públicas ni actualizaciones automáticas.

Si la ejecución termina en rojo, no hay instalador verificado: abre el paso fallido y comparte su mensaje de error. La primera ejecución de Windows es necesaria para confirmar la compilación y las pruebas nativas; no se debe confundir con las pruebas web.

## 2. Instalar y abrir

1. Haz doble clic en el **archivo `.exe` extraído**.
2. El instalador está en español. Sigue **Siguiente → Instalar → Finalizar**.
3. Instala para tu usuario y crea **Arriendos** en el escritorio y el menú Inicio. Normalmente no necesita permisos de administrador para la app; el componente WebView2 puede pedir autorización si no está instalado.
4. Abre **Arriendos** desde el escritorio. Puedes cerrar el navegador y cualquier terminal.
5. Agrega un departamento, cierra la ventana y vuelve a abrirla: debe seguir en tu lista.

Este proyecto todavía no tiene un certificado de firma de código. Windows puede mostrar **“Windows protegió su PC”** o un editor desconocido. Comprueba que el archivo provenga de la ejecución correcta de tu propio repositorio. Sólo si confías en ese origen, utiliza **Más información → Ejecutar de todas formas**, cuando esté disponible. No desactives SmartScreen ni el antivirus; una política de empresa puede requerir intervención del administrador.

## 3. Usar sin internet

Después de descargar el `.exe`, puedes instalar y usar la app sin conexión: incluye el instalador **offline** de Microsoft WebView2. Por eso el archivo es grande. WebView2 es el motor integrado de la ventana, no un navegador que tengas que abrir.

La interfaz, las fuentes, los iconos y SQLite están incluidos localmente. No hay login, servidor, APIs remotas ni sincronización. Puedes crear, consultar, editar, filtrar y eliminar sin conexión. Abrir voluntariamente el enlace de una publicación sí requiere internet; guardar ese enlace no lo requiere. Las comprobaciones de seguridad de Windows o las actualizaciones de Microsoft son independientes de la app.

## 4. Actualizar sin perder datos

1. Cierra Arriendos antes de instalar una versión nueva.
2. Descarga el nuevo instalador desde una ejecución verde de **Actions**.
3. Ejecútalo para el **mismo usuario de Windows**. Actualiza la instalación existente; no necesitas desinstalar primero.
4. Abre Arriendos desde el acceso directo habitual.

La base no se guarda junto al ejecutable. Está en:

```
%APPDATA%\cl.personal.arriendos\arriendos.db
```

Puedes pegar `%APPDATA%\cl.personal.arriendos` en la barra de direcciones del Explorador. La ruta y el identificador de la aplicación se mantienen estables entre versiones. Cada modificación se escribe en SQLite antes de confirmarse en la interfaz, y las migraciones versionadas conservan la tabla original. Usar otro usuario de Windows muestra otra base.

No se prometen datos recuperables si se borra esa carpeta, falla el disco o se elige eliminar los datos al desinstalar. El desinstalador puede ofrecer una casilla para borrar los datos: **no la marques si quieres conservarlos**.

## 5. Hacer un respaldo

1. Cierra Arriendos completamente.
2. Abre `%APPDATA%\cl.personal.arriendos` en el Explorador.
3. Copia la carpeta completa a una ubicación segura (incluye `arriendos.db` y cualquier archivo auxiliar).
4. Para restaurarla en el mismo usuario o en otro computador, instala la app, ciérrala y copia el respaldo en esa misma ubicación. Reemplazar una base reemplaza también la lista existente.

El botón **Exportar JSON** es una copia legible adicional; esta versión no tiene importación de JSON. Los datos de la antigua vista web no se transfieren automáticamente a SQLite.
