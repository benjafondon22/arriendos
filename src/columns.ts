export const columns = [
  ['availability', 'Disponibilidad'], ['rent', 'Arriendo'], ['expenses', 'Gastos comunes'], ['total', 'Total mensual'],
  ['area', 'Superficie'], ['metro', 'Metro / distancia'], ['floor', 'Piso'], ['terrace', 'Terraza'],
  ['finishes', 'Terminaciones'], ['parking', 'Estacionamientos'], ['followup', 'Seguimiento'],
  ['visit', 'Visita agendada'], ['phone', 'Teléfono'], ['notes', 'Notas'],
] as const;
export type Column = typeof columns[number][0];
export const defaultColumns: Column[] = ['availability', 'rent', 'expenses', 'total', 'area', 'metro', 'followup', 'visit'];
const key = 'arriendos.columns.v1';
export function readColumns(): Column[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(saved) ? columns.map(([id]) => id).filter(id => saved.includes(id)) : [...defaultColumns];
  } catch { return [...defaultColumns]; }
}
export function storeColumns(value: Column[]) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Preferences are optional; database writes remain independent. */ } }
