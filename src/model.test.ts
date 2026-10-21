import { describe, expect, it } from 'vitest';
import { emptyDraft, normalizeApartment, selectApartments, safeUrl, type Apartment, type Filters } from './model';
const filters: Filters = { search: '', status: 'all', maxTotal: '', metro: '', parking: false, sort: 'newest' };
const a: Apartment = { ...emptyDraft, id:'a', title:'Ñuñoa luminoso', rent:500000, expenses:100000, area:50, distance:400, metro:'Chile España', parking:1, createdAt:'2026-10-01' };
const b: Apartment = { ...a, id:'b', title:'Providencia', rent:450000, expenses:200000, area:60, metro:'Los Leones', distance:null, parking:0, contacted:true, visited:true, createdAt:'2026-10-02' };
describe('Comparación de departamentos', () => {
 it('filtra por costo incluyendo gastos comunes', () => { expect(selectApartments([a,b],{...filters,maxTotal:'620000'}).map(x=>x.id)).toEqual(['a']); });
 it('combina búsqueda, estación y estacionamiento', () => { expect(selectApartments([a,b],{...filters,search:'ÑUÑOA',metro:'Chile España',parking:true})).toEqual([a]); });
 it('distingue pendientes, contactados y visitados', () => { expect(selectApartments([a,b],{...filters,status:'pending'})).toEqual([a]); expect(selectApartments([a,b],{...filters,status:'contacted'})).toEqual([b]); expect(selectApartments([a,b],{...filters,status:'visited'})).toEqual([b]); });
 it('ordena precio total, superficie y distancia con desconocidos al final', () => {expect(selectApartments([b,a],{...filters,sort:'price'})).toEqual([a,b]);expect(selectApartments([a,b],{...filters,sort:'area'})).toEqual([b,a]);expect(selectApartments([b,a],{...filters,sort:'distance'})).toEqual([a,b]);});
 it('bloquea enlaces ejecutables', () => { expect(safeUrl('javascript:alert(1)')).toBeNull();expect(safeUrl('file:///etc/passwd')).toBeNull();expect(safeUrl('https://example.com')).toBe('https://example.com/'); });
});

describe('Publicaciones y compatibilidad 0.1.0 → 0.2.0', () => {
 it('encuentra un código externo sin distinguir mayúsculas', () => {
   expect(selectApartments([{...a,listingCode:'NUN-001'},b],{...filters,search:'nun-001'}).map(x=>x.id)).toEqual(['a']);
 });
 it('filtra disponibilidad independientemente del contacto y conserva finalizados en Todos', () => {
   const paused={...a,availability:'paused' as const};const finished={...b,availability:'finished' as const};
   expect(selectApartments([paused,finished],{...filters,availability:'paused'})).toEqual([paused]);
   expect(selectApartments([paused,finished],{...filters,availability:'finished',status:'visited'})).toEqual([finished]);
   expect(selectApartments([paused,finished],filters)).toHaveLength(2);
 });
 it('filtra visitas agendadas y ordena por fecha dejando sin agenda al final', () => {
   const first={...a,visitScheduled:true,visitAt:'2026-12-01T10:30'};const second={...b,visitScheduled:true,visitAt:'2026-12-02T15:00'};
   expect(selectApartments([second,a,first],{...filters,status:'scheduled',sort:'visit'})).toEqual([first,second]);
   expect(selectApartments([a,second,first],{...filters,sort:'visit'})).toEqual([first,second,a]);
   expect(selectApartments([first],{...filters,status:'pending'})).toEqual([]);
 });
});

 it('adopta tres registros antiguos sin modificar IDs, fechas, montos, marcas ni el objeto original', () => {
   const legacy = [a,b,{...a,id:'c',title:'Tercero',phone:'+56 9 9999 9999'}].map(item => {
     const {listingCode, availability, visitScheduled, visitAt, ...old} = item;
     return old;
   });
   const original = JSON.stringify(legacy);
   const migrated = legacy.map(item => normalizeApartment(item as Apartment));
   expect(JSON.stringify(legacy)).toBe(original);
   migrated.forEach((item,index) => {
     expect(item).toMatchObject(legacy[index]);
     expect(item).toMatchObject({listingCode:'',availability:'active',visitScheduled:false,visitAt:''});
   });
 });
