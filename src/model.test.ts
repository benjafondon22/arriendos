import { describe, expect, it } from 'vitest';
import { emptyDraft, selectApartments, safeUrl, type Apartment, type Filters } from './model';
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
