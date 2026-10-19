import { describe, expect, it } from 'vitest'
import type { Product } from '../data/types'
import { DEFAULT_PRODUCT_QUERY, normalize, paginate, queryProducts, toggleSort } from './table'

const p = (id: string, name: string, extra: Partial<Product> = {}): Product => ({
  id,
  sku: `CAF-00${id}`,
  name,
  category: 'Café',
  price: 10,
  cost: 4,
  stock: 20,
  status: 'activo',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...extra,
})

const catalog = [
  p('1', 'Café molido'),
  p('2', 'Cesta de yarey', { category: 'Artesanía', price: 29, stock: 3 }),
  p('3', 'Bombones', { category: 'Cacao', price: 12.9, stock: 0 }),
  p('4', 'Cuaderno', { category: 'Accesorios', status: 'borrador' }),
]

describe('normalize', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalize('  Café  ')).toBe('cafe')
  })
})

describe('queryProducts', () => {
  it('busca sin tildes por nombre o SKU', () => {
    expect(queryProducts(catalog, { ...DEFAULT_PRODUCT_QUERY, search: 'cafe' }).map((x) => x.id)).toEqual(['1'])
    expect(queryProducts(catalog, { ...DEFAULT_PRODUCT_QUERY, search: 'caf-003' }).map((x) => x.id)).toEqual(['3'])
  })

  it('filtra por stock bajo (incluye agotados) y por agotados', () => {
    expect(queryProducts(catalog, { ...DEFAULT_PRODUCT_QUERY, stock: 'bajo' }).map((x) => x.id)).toEqual(['3', '2'])
    expect(queryProducts(catalog, { ...DEFAULT_PRODUCT_QUERY, stock: 'agotado' }).map((x) => x.id)).toEqual(['3'])
  })

  it('filtra por estado y ordena por precio descendente', () => {
    expect(queryProducts(catalog, { ...DEFAULT_PRODUCT_QUERY, status: 'borrador' })).toHaveLength(1)
    const sorted = queryProducts(catalog, { ...DEFAULT_PRODUCT_QUERY, sort: { key: 'price', dir: 'desc' } })
    expect(sorted[0].id).toBe('2')
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)

  it('calcula páginas y rango mostrado', () => {
    const page = paginate(items, 3, 10)
    expect(page.items).toEqual([21, 22, 23])
    expect(page.pages).toBe(3)
    expect(page.from).toBe(21)
    expect(page.to).toBe(23)
  })

  it('corrige páginas fuera de rango', () => {
    expect(paginate(items, 99, 10).page).toBe(3)
    expect(paginate([], 2, 10)).toMatchObject({ page: 1, pages: 1, from: 0, to: 0 })
  })
})

describe('toggleSort', () => {
  it('invierte la dirección o cambia de columna', () => {
    expect(toggleSort({ key: 'name', dir: 'asc' }, 'name')).toEqual({ key: 'name', dir: 'desc' })
    expect(toggleSort({ key: 'name', dir: 'asc' }, 'price', 'desc')).toEqual({ key: 'price', dir: 'desc' })
  })
})
