import { describe, expect, it } from 'vitest'
import type { Product } from '../data/types'
import { draftToProduct, emptyDraft, parseDecimal, suggestSku, validateProduct, type ProductDraft } from './validation'

const existing: Product[] = [
  {
    id: 'prd_001',
    sku: 'CAF-001',
    name: 'Café molido',
    category: 'Café',
    price: 8.9,
    cost: 3.5,
    stock: 10,
    status: 'activo',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const valid: ProductDraft = {
  name: 'Café en grano 500 g',
  sku: 'CAF-002',
  category: 'Café',
  price: '14,50',
  cost: '6.10',
  stock: '25',
  status: 'activo',
}

describe('parseDecimal', () => {
  it('acepta coma o punto decimal', () => {
    expect(parseDecimal('12,50')).toBe(12.5)
    expect(parseDecimal('12.5')).toBe(12.5)
    expect(Number.isNaN(parseDecimal('doce'))).toBe(true)
  })
})

describe('validateProduct', () => {
  it('no devuelve errores para un borrador válido', () => {
    expect(validateProduct(valid, existing)).toEqual({})
  })

  it('marca todos los campos obligatorios', () => {
    const e = validateProduct(emptyDraft(), existing)
    expect(Object.keys(e).sort()).toEqual(['category', 'cost', 'name', 'price', 'sku', 'stock'])
  })

  it('rechaza SKU duplicado salvo en el propio producto', () => {
    expect(validateProduct({ ...valid, sku: 'CAF-001' }, existing).sku).toContain('ya existe')
    expect(validateProduct({ ...valid, sku: 'CAF-001' }, existing, 'prd_001').sku).toBe(undefined)
  })

  it('valida formato, precio y coste', () => {
    expect(validateProduct({ ...valid, sku: 'caf1' }, existing).sku).toBeTruthy()
    expect(validateProduct({ ...valid, price: '0' }, existing).price).toBeTruthy()
    expect(validateProduct({ ...valid, price: '1,999' }, existing).price).toBeTruthy()
    expect(validateProduct({ ...valid, cost: '20' }, existing).cost).toContain('no puede superar')
    expect(validateProduct({ ...valid, stock: '2.5' }, existing).stock).toBeTruthy()
  })
})

describe('draftToProduct y suggestSku', () => {
  it('convierte el borrador en un producto con números', () => {
    const p = draftToProduct({ ...valid, sku: 'caf-002' }, { id: 'prd_002', createdAt: 'x' })
    expect(p).toMatchObject({ sku: 'CAF-002', price: 14.5, cost: 6.1, stock: 25 })
  })

  it('propone el siguiente SKU libre de la categoría', () => {
    expect(suggestSku('Café', existing)).toBe('CAF-002')
    expect(suggestSku('Hogar', existing)).toBe('HOG-001')
  })
})
