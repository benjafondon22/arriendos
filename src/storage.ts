import { isTauri } from '@tauri-apps/api/core';
import type { Apartment } from './model';
import Database from '@tauri-apps/plugin-sql';
const key = 'arriendos.preview.v1';
let connection: Promise<Database> | undefined;
export const desktop = isTauri();
async function db() {
  // The Rust plugin applies versioned migrations before load resolves.
  // A relative URL is resolved under AppConfig, never under the installation.
  connection ??= Database.load('sqlite:arriendos.db');
  try { return await connection; }
  catch (error) { connection = undefined; throw error; }
}
export async function load(): Promise<Apartment[]> {
  if (!desktop) return JSON.parse(localStorage.getItem(key) || '[]');
  const rows = await (await db()).select<{ data: string }[]>('SELECT data FROM apartments');
  return rows.map(row => JSON.parse(row.data));
}
export async function save(item: Apartment) {
  if (!desktop) { const items = await load(); localStorage.setItem(key, JSON.stringify([...items.filter(a => a.id !== item.id), item])); return; }
  await (await db()).execute('INSERT INTO apartments (id, data) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET data = excluded.data', [item.id, JSON.stringify(item)]);
}
export async function remove(id: string) {
  if (!desktop) { localStorage.setItem(key, JSON.stringify((await load()).filter(a => a.id !== id))); return; }
  await (await db()).execute('DELETE FROM apartments WHERE id = $1', [id]);
}
