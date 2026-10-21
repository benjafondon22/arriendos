export type Availability = 'active' | 'paused' | 'finished';
export type Apartment = {
  id: string; listingCode: string; title: string; url: string; rent: number; expenses: number; area: number;
  metro: string; distance: number | null; floor: number | null; terrace: number; finishes: number;
  parking: number; phone: string; contacted: boolean; visited: boolean; notes: string; createdAt: string;
  availability: Availability; visitScheduled: boolean; visitAt: string;
};
export type Draft = Omit<Apartment, 'id' | 'createdAt'>;
export const emptyDraft: Draft = {
  title: '', listingCode: '', url: '', rent: 0, expenses: 0, area: 0, metro: '', distance: null,
  floor: null, terrace: 0, finishes: 0, parking: 0, phone: '', contacted: false, visited: false,
  notes: '', availability: 'active', visitScheduled: false, visitAt: '',
};
// Additive read adapter: old JSON records retain their IDs, dates and all original values.
// Reading never rewrites the database. Existing records become active, with no scheduled visit.
export function normalizeApartment(value: Apartment): Apartment { return { ...emptyDraft, ...value }; }
export const availabilityLabels: Record<Availability, string> = { active: 'Disponible', paused: 'Pausada', finished: 'Finalizada' };
export const money = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
export function safeUrl(value: string) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
export function visitLabel(value: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}
export type Filters = { search: string; status: string; maxTotal: string; metro: string; parking: boolean; sort: string; availability?: string };
export function selectApartments(items: Apartment[], f: Filters) {
  return items.filter(a => (!f.search || `${a.listingCode} ${a.title} ${a.metro} ${a.notes} ${a.phone}`.toLocaleLowerCase().includes(f.search.trim().toLocaleLowerCase()))
    && (!f.maxTotal || a.rent + a.expenses <= Number(f.maxTotal))
    && (!f.metro || a.metro === f.metro) && (!f.parking || a.parking > 0)
    && (!f.availability || f.availability === 'all' || a.availability === f.availability)
    && (f.status === 'all' || (f.status === 'pending' && !a.contacted && !a.visited && !a.visitScheduled)
      || (f.status === 'contacted' && a.contacted) || (f.status === 'visited' && a.visited) || (f.status === 'scheduled' && a.visitScheduled)))
    .sort((a, b) => f.sort === 'price' ? (a.rent + a.expenses) - (b.rent + b.expenses)
      : f.sort === 'area' ? b.area - a.area : f.sort === 'distance' ? (a.distance ?? Infinity) - (b.distance ?? Infinity)
      : f.sort === 'code' ? a.listingCode.localeCompare(b.listingCode, 'es', { numeric: true })
      : f.sort === 'visit' ? (a.visitScheduled && a.visitAt ? a.visitAt : '9999').localeCompare(b.visitScheduled && b.visitAt ? b.visitAt : '9999')
      : b.createdAt.localeCompare(a.createdAt));
}
