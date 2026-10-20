export type Apartment = {
  id: string; title: string; url: string; rent: number; expenses: number; area: number;
  metro: string; distance: number | null; floor: number | null; terrace: number; finishes: number;
  parking: number; phone: string; contacted: boolean; visited: boolean; notes: string; createdAt: string;
};
export type Draft = Omit<Apartment, 'id' | 'createdAt'>;
export const emptyDraft: Draft = { title: '', url: '', rent: 0, expenses: 0, area: 0, metro: '', distance: null, floor: null, terrace: 0, finishes: 0, parking: 0, phone: '', contacted: false, visited: false, notes: '' };
export const money = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
export function safeUrl(value: string) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
export type Filters = { search: string; status: string; maxTotal: string; metro: string; parking: boolean; sort: string };
export function selectApartments(items: Apartment[], f: Filters) {
  return items.filter(a => (!f.search || `${a.title} ${a.metro} ${a.notes}`.toLocaleLowerCase().includes(f.search.toLocaleLowerCase()))
    && (!f.maxTotal || a.rent + a.expenses <= Number(f.maxTotal))
    && (!f.metro || a.metro === f.metro) && (!f.parking || a.parking > 0)
    && (f.status === 'all' || (f.status === 'pending' && !a.contacted && !a.visited) || (f.status === 'contacted' && a.contacted) || (f.status === 'visited' && a.visited)))
    .sort((a, b) => f.sort === 'price' ? (a.rent + a.expenses) - (b.rent + b.expenses) : f.sort === 'area' ? b.area - a.area : f.sort === 'distance' ? (a.distance ?? Infinity) - (b.distance ?? Infinity) : b.createdAt.localeCompare(a.createdAt));
}
