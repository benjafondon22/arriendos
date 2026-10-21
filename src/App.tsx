import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Building2, Plus, Search, ArrowUpRight, Pencil, Trash2, X, Check, SlidersHorizontal, Car, List, Phone, Download, Columns3, CalendarDays } from 'lucide-react';
import { availabilityLabels, emptyDraft, money, safeUrl, selectApartments, visitLabel, type Apartment, type Availability, type Draft, type Filters } from './model';
import { columns, defaultColumns, readColumns, storeColumns, type Column } from './columns';
import * as storage from './storage';
const initialFilters: Filters = { search: '', status: 'all', maxTotal: '', metro: '', parking: false, sort: 'newest', availability: 'all' };

export default function App() {
  const [items, setItems] = useState<Apartment[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [visibleColumns, setVisibleColumns] = useState<Column[]>(readColumns);
  const [columnMenu, setColumnMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Apartment | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Apartment | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    storage.load().then(setItems).catch(() => {
      setLoadFailed(true); setError('No se pudieron leer tus departamentos. Reinicia la aplicación antes de guardar cambios.');
    }).finally(() => setReady(true));
  }, []);
  const shown = useMemo(() => selectApartments(items, filters), [items, filters]);
  const shownColumns = columns.filter(([id]) => visibleColumns.includes(id));
  function filter<K extends keyof Filters>(key: K, value: Filters[K]) { setFilters(f => ({ ...f, [key]: value })); }
  function changeColumns(value: Column[]) { setVisibleColumns(value); storeColumns(value); }
  async function persist(item: Apartment) {
    if (loadFailed) return false;
    setBusy(true); setError('');
    try { await storage.save(item); setItems(v => [...v.filter(a => a.id !== item.id), item]); return true; }
    catch { setError('No se pudo guardar. Vuelve a intentarlo; el formulario conserva tus cambios.'); return false; }
    finally { setBusy(false); }
  }
  async function deleteItem() {
    if (!deleting) return;
    setBusy(true);
    try { await storage.remove(deleting.id); setItems(v => v.filter(a => a.id !== deleting.id)); setDeleting(null); }
    catch { setError('No se pudo eliminar el departamento. Vuelve a intentarlo.'); }
    finally { setBusy(false); }
  }
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mis-arriendos.json'; a.click(); URL.revokeObjectURL(url);
  }
  function cell(a: Apartment, column: Column): ReactNode {
    switch (column) {
      case 'availability': return <select className={'availability ' + a.availability} aria-label={'Disponibilidad de ' + a.title} value={a.availability} disabled={busy} onChange={e => void persist({ ...a, availability: e.target.value as Availability })}>{Object.entries(availabilityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>;
      case 'rent': return money(a.rent);
      case 'expenses': return money(a.expenses);
      case 'total': return <strong className="total-price">{money(a.rent + a.expenses)}</strong>;
      case 'area': return `${a.area} m²`;
      case 'metro': return <><span>{a.metro || 'Sin definir'}</span><small>{a.distance === null ? 'Distancia sin definir' : `${a.distance} m a la estación`}</small></>;
      case 'floor': return a.floor ?? '—';
      case 'terrace': case 'finishes': return a[column] ? <span className="table-rating" aria-label={`${a[column]} de 5`}>{'★'.repeat(a[column])}<span>{'☆'.repeat(5 - a[column])}</span></span> : <span className="muted">Sin evaluar</span>;
      case 'parking': return a.parking;
      case 'phone': return a.phone ? <a className="phone" href={'tel:' + a.phone.replace(/[^+\d]/g, '')}>{a.phone}</a> : '—';
      case 'notes': return <span className="table-notes">{a.notes || '—'}</span>;
      case 'followup': return <div className="status-actions">
        <button disabled={busy} aria-pressed={a.contacted} className={a.contacted ? 'checked' : ''} onClick={() => void persist({ ...a, contacted: !a.contacted })}><span>{a.contacted && <Check size={11}/>}</span>Contactado</button>
        <button disabled={busy} aria-pressed={a.visitScheduled} className={a.visitScheduled ? 'checked' : ''} onClick={() => setEditing({ ...a, visitScheduled: true })}><span>{a.visitScheduled && <Check size={11}/>}</span>Visita agendada</button>
        <button disabled={busy} aria-pressed={a.visited} className={a.visited ? 'checked' : ''} onClick={() => void persist({ ...a, visited: !a.visited })}><span>{a.visited && <Check size={11}/>}</span>Visitado</button>
      </div>;
      case 'visit': return a.visitScheduled ? <button disabled={busy} className="visit-date" onClick={() => setEditing(a)}><CalendarDays size={14}/><time dateTime={a.visitAt}>{visitLabel(a.visitAt)}</time></button> : <button disabled={busy} className="schedule-link" aria-label={'Agendar visita de ' + a.title} onClick={() => setEditing({ ...a, visitScheduled: true })}><Plus size={13}/> Agendar</button>;
    }
  }
  return <div className="shell">
    <aside>
      <a className="brand" href="#"><span className="brand-icon"><Building2 size={22}/></span> arriendos<span className="brand-dot">.</span></a>
      <div className="workspace-label">ESPACIO PERSONAL</div>
      <button className="nav active" onClick={() => setFilters(initialFilters)}><List size={18}/> Mis departamentos <span>{items.length}</span></button>
      <div className="sidebar-note"><div className="note-icon">⌂</div><strong>Tu próximo hogar,<br/>un poco más cerca.</strong><p>Compara con calma.<br/>Encuentra tu lugar.</p></div>
      <div className="local"><span/>{storage.desktop ? 'SQLite · guardado en tu equipo' : 'Vista web · guardado en este navegador'}</div>
    </aside>
    <main><header><div className="breadcrumb">Mi espacio <span>/</span> Búsqueda de arriendo</div><div className="avatar">YO</div></header>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">UN NUEVO LUGAR PARA TI</div><h1>Mis departamentos</h1><p>Compara tus opciones y organiza cada paso de tu búsqueda.</p></div><button className="primary" disabled={!ready || busy || loadFailed} onClick={() => setEditing(null)}><Plus size={18}/> Agregar departamento</button></div>
        <div className="stats">
          <div><span>En tu lista</span><strong>{items.length}<small>{items.filter(a => a.availability === 'active').length} disponibles</small></strong><Building2/></div>
          <div><span>Contactados</span><strong>{items.filter(a => a.contacted).length}<small>conversaciones iniciadas</small></strong><Phone/></div>
          <div><span>Visitas agendadas</span><strong>{items.filter(a => a.visitScheduled && !a.visited && a.availability === 'active').length}<small>disponibles y por visitar</small></strong><CalendarDays/></div>
          <div className="stat-accent"><span>Visitados</span><strong>{items.filter(a => a.visited).length}<small>un paso más cerca</small></strong><Check/></div>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="list-panel">
          <div className="tabs">{[['all', 'Todos'], ['pending', 'Por contactar'], ['contacted', 'Contactados'], ['scheduled', 'Agendadas'], ['visited', 'Visitados']].map(([value, label]) => <button key={value} className={filters.status === value ? 'selected' : ''} onClick={() => filter('status', value)}>{label}{value === 'all' && <span>{items.length}</span>}</button>)}<button className="export" onClick={exportData} disabled={!ready || loadFailed}><Download size={15}/> Exportar JSON</button></div>
          <div className="filters">
            <label className="search"><Search size={17}/><input aria-label="Buscar departamento" placeholder="Buscar por ID, nombre, metro o notas…" value={filters.search} onChange={e => filter('search', e.target.value)}/></label>
            <select aria-label="Filtrar por disponibilidad" value={filters.availability} onChange={e => filter('availability', e.target.value)}><option value="all">Toda disponibilidad</option>{Object.entries(availabilityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
            <label className="filter-input"><span>Máx. total $</span><input aria-label="Presupuesto total máximo" type="number" min="0" placeholder="Sin límite" value={filters.maxTotal} onChange={e => filter('maxTotal', e.target.value)}/></label>
            <select aria-label="Filtrar por estación" value={filters.metro} onChange={e => filter('metro', e.target.value)}><option value="">Todas las estaciones</option>{[...new Set(items.map(a => a.metro).filter(Boolean))].sort().map(m => <option key={m}>{m}</option>)}</select>
            <label className="parking"><input type="checkbox" checked={filters.parking} onChange={e => filter('parking', e.target.checked)}/><Car size={16}/> Estacionamiento</label>
          </div>
          <div className="results">
            <span><strong>{shown.length}</strong> {shown.length === 1 ? 'departamento' : 'departamentos'} en tu búsqueda</span>
            <div className="list-tools"><label><SlidersHorizontal size={14}/><select aria-label="Ordenar departamentos" value={filters.sort} onChange={e => filter('sort', e.target.value)}><option value="newest">Más recientes</option><option value="price">Menor costo total</option><option value="area">Mayor superficie</option><option value="distance">Más cerca del metro</option><option value="visit">Fecha de visita</option><option value="code">ID de publicación</option></select></label>
              <div className="columns-control"><button className="columns-toggle" aria-expanded={columnMenu} aria-controls="column-options" onClick={() => setColumnMenu(v => !v)}><Columns3 size={14}/> Columnas</button>
                {columnMenu && <div id="column-options" className="column-options"><strong>Personaliza tu listado</strong><p>Publicación, ID y acciones siempre visibles.</p>{columns.map(([id, label]) => <label key={id}><input type="checkbox" checked={visibleColumns.includes(id)} onChange={e => changeColumns(e.target.checked ? [...visibleColumns, id] : visibleColumns.filter(c => c !== id))}/>{label}</label>)}<button onClick={() => changeColumns([...defaultColumns])}>Restablecer columnas</button><button onClick={() => setColumnMenu(false)}>Listo</button></div>}
              </div>
            </div>
          </div>
          {!ready ? <div className="empty">Cargando tus departamentos…</div> : loadFailed ? <div className="empty"><h2>No se pudo abrir tu lista</h2><p>Cierra y vuelve a abrir la aplicación. Tus datos no se sobrescribirán.</p></div> : shown.length === 0 ? <div className="empty"><span className="empty-icon"><Building2 size={30}/></span><h2>{items.length ? 'No hay coincidencias' : 'Tu búsqueda empieza aquí'}</h2><p>{items.length ? 'Prueba con otros filtros para encontrar tus opciones.' : 'Guarda ese departamento que te gustó y compara todos los detalles.'}</p><button className="primary" onClick={() => items.length ? setFilters(initialFilters) : setEditing(null)}>{items.length ? 'Limpiar filtros' : 'Agregar mi primer departamento'}</button></div> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Listado de departamentos, desplaza para ver más columnas"><table className="apartment-table"><thead><tr><th scope="col" className="publication-col">Publicación / ID</th>{shownColumns.map(([id, label]) => <th scope="col" key={id}>{label}</th>)}<th scope="col" className="actions-col">Acciones</th></tr></thead><tbody>{shown.map(a => <tr key={a.id} className={'row-' + a.availability}><th scope="row" className="publication-col"><h2>{a.title}</h2><span className="listing-code">{a.listingCode ? `ID: ${a.listingCode}` : 'Sin código'}</span>{a.url && safeUrl(a.url) && <a className="publication-link" href={safeUrl(a.url)!} target="_blank" rel="noreferrer">Ver publicación <ArrowUpRight size={12}/></a>}</th>{shownColumns.map(([id]) => <td key={id} className={'col-' + id}>{cell(a, id)}</td>)}<td className="actions-col"><div><button disabled={busy} className="icon-button" aria-label={'Editar ' + a.title} onClick={() => setEditing(a)}><Pencil size={16}/></button><button disabled={busy} className="icon-button delete" aria-label={'Eliminar ' + a.title} onClick={() => setDeleting(a)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
        </div>
        <footer>Arriendos 0.2.0 · Tu búsqueda, en orden.<span>Los cambios se guardan en tu equipo.</span></footer>
      </section>
    </main>
    {editing !== undefined && <Editor item={editing} busy={busy} onClose={() => setEditing(undefined)} onSave={async draft => {
      const item = { ...draft, id: editing?.id ?? crypto.randomUUID(), createdAt: editing?.createdAt ?? new Date().toISOString() };
      if (await persist(item)) setEditing(undefined);
    }}/>}
    {deleting && <div className="overlay"><section className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">¿Eliminar departamento?</h2><p>Se eliminará “{deleting.title}” de tu lista. Para conservarlo, puedes marcar su publicación como pausada o finalizada.</p><div className="modal-actions"><button disabled={busy} onClick={() => setDeleting(null)}>Cancelar</button><button className="danger" disabled={busy} onClick={() => void deleteItem()}>Eliminar</button></div></section></div>}
  </div>;
}

function Editor({ item, busy, onSave, onClose }: { item: Apartment | null; busy: boolean; onSave: (draft: Draft) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(item ?? { ...emptyDraft });
  const [validation, setValidation] = useState('');
  function field<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft(d => ({ ...d, [key]: value })); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.url && !safeUrl(draft.url)) { setValidation('Ingresa un enlace http:// o https:// válido.'); return; }
    if (draft.visitScheduled && (!draft.visitAt || Number.isNaN(new Date(draft.visitAt).getTime()))) { setValidation('Indica la fecha y hora de la visita agendada.'); return; }
    void onSave({ ...draft, title: draft.title.trim(), listingCode: draft.listingCode.trim(), url: draft.url.trim(), visitAt: draft.visitScheduled ? draft.visitAt : '' });
  }
  useEffect(() => {
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', handle);
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', handle); };
  }, [busy, onClose]);
  const numeric = (key: 'rent' | 'expenses' | 'area' | 'distance' | 'floor' | 'parking', label: string, required = false) => <label>{label}<input type="number" required={required} min={key === 'floor' ? undefined : 0} step={key === 'area' ? '0.1' : '1'} value={draft[key] ?? ''} onChange={e => field(key, e.target.value === '' && (key === 'distance' || key === 'floor') ? null : Number(e.target.value))}/></label>;
  return <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
    <div className="modal-heading"><div><div className="eyebrow">TU PRÓXIMO HOGAR</div><h2 id="form-title">{item ? 'Editar departamento' : 'Agregar departamento'}</h2></div><button disabled={busy} className="icon-button" aria-label="Cerrar formulario" onClick={onClose}><X/></button></div>
    <form onSubmit={submit}><fieldset disabled={busy} className="editor-fields"><div className="form-grid">
      <label className="full">Nombre o dirección *<input autoFocus required maxLength={150} value={draft.title} onChange={e => field('title', e.target.value)} placeholder="Ej. Depto luminoso en Ñuñoa"/></label>
      <label>ID de publicación<input maxLength={100} value={draft.listingCode} onChange={e => field('listingCode', e.target.value)} placeholder="Ej. NUN-001 o código del portal"/></label>
      <label>Disponibilidad<select aria-label="Disponibilidad" value={draft.availability} onChange={e => field('availability', e.target.value as Availability)}>{Object.entries(availabilityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="full">Link de la publicación<input type="url" value={draft.url} onChange={e => field('url', e.target.value)} placeholder="https://…"/></label>
      {numeric('rent', 'Arriendo mensual (CLP) *', true)}{numeric('expenses', 'Gastos comunes (CLP) *', true)}{numeric('area', 'Superficie (m²) *', true)}{numeric('floor', 'Piso')}
      <label>Estación de metro más cercana<input value={draft.metro} onChange={e => field('metro', e.target.value)} placeholder="Ej. Chile España"/></label>
      {numeric('distance', 'Distancia al metro (metros)')}{numeric('parking', 'Nº de estacionamientos')}
      <label>Teléfono de contacto<input type="tel" value={draft.phone} onChange={e => field('phone', e.target.value)} placeholder="+56 9 1234 5678"/></label>
      {(['terrace', 'finishes'] as const).map(key => <label key={key}>{key === 'terrace' ? 'Terraza' : 'Terminaciones'}<select aria-label={key === 'terrace' ? 'Terraza' : 'Terminaciones'} value={draft[key]} onChange={e => field(key, Number(e.target.value))}><option value={0}>Sin evaluar</option>{[1, 2, 3, 4, 5].map(n => <option value={n} key={n}>{n} de 5 {'★'.repeat(n)}</option>)}</select></label>)}
      <label className="full">Notas<textarea aria-label="Notas" rows={3} value={draft.notes} onChange={e => field('notes', e.target.value)} placeholder="Lo que te gustó, dudas para la visita, disponibilidad…"/></label>
      <div className="full form-checks"><label><input type="checkbox" checked={draft.contacted} onChange={e => field('contacted', e.target.checked)}/> Contactado</label><label><input type="checkbox" checked={draft.visitScheduled} onChange={e => field('visitScheduled', e.target.checked)}/> Visita agendada</label><label><input type="checkbox" checked={draft.visited} onChange={e => field('visited', e.target.checked)}/> Visitado</label></div>
      {draft.visitScheduled && <label className="full appointment-field">Fecha y hora de visita *<input aria-label="Fecha y hora de visita" type="datetime-local" required value={draft.visitAt} onChange={e => field('visitAt', e.target.value)}/><small>Hora local de tu computador. Puedes desmarcar “Visita agendada” para cancelar la agenda.</small></label>}
    </div></fieldset>
    {validation && <p role="alert" className="error">{validation}</p>}
    <div className="modal-actions"><span>Total mensual <strong>{money(draft.rent + draft.expenses)}</strong></span><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className="primary" disabled={busy || !draft.title.trim()}>{busy ? 'Guardando…' : 'Guardar departamento'}</button></div>
    </form>
  </section></div>;
}
