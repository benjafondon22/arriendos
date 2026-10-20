// Exercises the INSTALLED Windows application (WebView2 -> Tauri IPC -> SQLite).
// No browser is launched. CDP is enabled only by this test process's environment.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const [exe, phase] = process.argv.slice(2);
if (process.platform !== 'win32' || !exe || !['seed', 'upgrade'].includes(phase)) {
  throw new Error('Uso en Windows: npm run test:windows -- <ruta a arriendos.exe instalado> <seed|upgrade>');
}
const title = 'Prueba SQLite · Ñuñoa';
const dbPath = join(process.env.APPDATA, 'cl.personal.arriendos', 'arriendos.db');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
await mkdir('test-results', { recursive: true });
let child, browser, page;
const errors = [];
const externalRequests = [];

async function launch() {
  child = spawn(exe, [], {
    env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9222 --remote-debugging-address=127.0.0.1' },
    stdio: 'inherit',
  });
  child.on('error', error => errors.push(error.message));
  let lastError;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`La app terminó antes de abrirse: ${child.exitCode}`);
    try { browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 1000 }); break; }
    catch (e) { lastError = e; await delay(500); }
  }
  assert.ok(browser, `WebView2 no expuso CDP: ${lastError}`);
  const context = browser.contexts()[0];
  assert.ok(context, 'WebView2 no tiene contexto');
  // Reject external HTTP(S) traffic, while preserving Tauri's in-process protocols.
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (['http:', 'https:'].includes(u.protocol) && !['tauri.localhost', 'ipc.localhost'].includes(u.hostname)) {
      externalRequests.push(u.href); return route.abort();
    }
    return route.continue();
  });
  for (let i = 0; i < 60; i++) {
    page = context.pages().find(p => p.url().includes('tauri.localhost'));
    if (page) break;
    await delay(500);
  }
  assert.ok(page, 'No se encontró la ventana de Tauri');
  page.on('pageerror', error => errors.push(error.message));
  await page.reload(); // Reload with all external network requests blocked.
  await page.getByRole('heading', { name: 'Mis departamentos', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Agregar departamento', exact: true }).waitFor({ state: 'visible' });
  assert.ok(await page.evaluate(() => Boolean(window.__TAURI_INTERNALS__)), 'No es una aplicación Tauri');
}

async function close() {
  // WM_CLOSE: same normal shutdown path as clicking the window's X.
  execFileSync('powershell.exe', ['-NoProfile', '-Command', `$p = Get-Process -Id ${child.pid}; if (-not $p.CloseMainWindow()) { throw 'WM_CLOSE falló' }`]);
  for (let i = 0; i < 80 && child.exitCode === null; i++) await delay(250);
  assert.notEqual(child.exitCode, null, 'La app no terminó tras cerrar la ventana');
  assert.equal(child.exitCode, 0, 'La app falló durante el cierre');
  browser = undefined; page = undefined; child = undefined;
}

function checkDatabase() {
  execFileSync('python', ['scripts/check-desktop-db.py', dbPath, title], { stdio: 'inherit' });
}

try {
  await launch();
  if (phase === 'seed') {
    await page.getByRole('button', { name: 'Agregar departamento', exact: true }).click();
    await page.getByLabel('Nombre o dirección').fill(title);
    await page.getByLabel('Link de la publicación').fill('https://example.com/departamento');
    await page.getByLabel('Arriendo mensual').fill('550000');
    await page.getByLabel('Gastos comunes').fill('90000');
    await page.getByLabel('Superficie').fill('52');
    await page.getByLabel('Estación de metro').fill('Chile España');
    await page.getByLabel('Distancia al metro').fill('350');
    await page.getByLabel('Piso', { exact: true }).fill('7');
    await page.getByLabel('Terraza', { exact: true }).selectOption('4');
    await page.getByLabel('Terminaciones', { exact: true }).selectOption('5');
    await page.getByLabel('Nº de estacionamientos').fill('1');
    await page.getByLabel('Teléfono de contacto').fill('+56 9 1234 5678');
    await page.getByLabel('Notas', { exact: true }).fill('Persistencia nativa sin internet');
    await page.getByRole('button', { name: 'Guardar departamento', exact: true }).click();
    await page.getByRole('heading', { name: title, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Contactado', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.status-actions button.checked') !== null);
    await close();
    checkDatabase();
    await launch();
  }
  // After either a normal restart or a real installer upgrade, the UI must read SQLite.
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Contactado', exact: true }).evaluate(e => e.classList.contains('checked')));
  await page.getByText('Persistencia nativa sin internet', { exact: true }).waitFor();
  await page.getByLabel('Presupuesto total máximo').fill('600000');
  await page.getByRole('heading', { name: 'No hay coincidencias' }).waitFor();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  if (phase === 'upgrade') {
    await page.getByRole('button', { name: `Editar ${title}` }).click();
    await page.getByLabel('Notas', { exact: true }).fill('Actualizado después de instalar la nueva versión');
    await page.getByRole('button', { name: 'Guardar departamento', exact: true }).click();
    await page.getByText('Actualizado después de instalar la nueva versión', { exact: true }).waitFor();
    await close();
    checkDatabase();
    await launch();
    await page.getByText('Actualizado después de instalar la nueva versión', { exact: true }).waitFor();
  }
  await page.screenshot({ path: `test-results/windows-${phase}.png` });
  await close();
  await stat(dbPath);
  checkDatabase();
  assert.deepEqual(errors, [], 'Errores de JavaScript o del proceso');
  assert.deepEqual(externalRequests, [], 'La app intentó acceder a Internet');
  console.log(`PASS ${phase}: SQLite real, cierre normal, reapertura y red externa bloqueada. Base: ${dbPath}`);
} catch (error) {
  if (page) await page.screenshot({ path: `test-results/windows-${phase}-error.png` }).catch(() => {});
  throw error;
} finally {
  // Do not leave WebView2/CDP running on failure. Do not touch other applications.
  if (child?.pid && child.exitCode === null) {
    try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F']); } catch { /* already stopped */ }
  }
}
