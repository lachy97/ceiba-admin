import { skuPrefix } from '../data/seed'
import type { Category, Product, ProductStatus } from '../data/types'
import { CATEGORIES } from '../data/types'

/** Lo que el usuario escribe en el formulario: todo texto hasta validarlo. */
export interface ProductDraft {
  name: string
  sku: string
  category: Category | ''
  price: string
  cost: string
  stock: string
  status: ProductStatus
}

export type ProductErrors = Partial<Record<keyof ProductDraft, string>>

/** Acepta "12,50" y "12.50". Devuelve NaN si no es un número válido. */
export function parseDecimal(input: string): number {
  const s = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(s)) return Number.NaN
  return Number(s)
}

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length

export const SKU_PATTERN = /^[A-Z]{3}-\d{3}$/

export function validateProduct(d: ProductDraft, products: Product[], editingId?: string): ProductErrors {
  const e: ProductErrors = {}
  const name = d.name.trim()
  if (!name) e.name = 'Escribe el nombre del producto.'
  else if (name.length < 3) e.name = 'El nombre debe tener al menos 3 caracteres.'
  else if (name.length > 80) e.name = 'El nombre no puede superar los 80 caracteres.'

  const sku = d.sku.trim().toUpperCase()
  if (!sku) e.sku = 'Escribe un SKU.'
  else if (!SKU_PATTERN.test(sku)) e.sku = 'Usa el formato ABC-123.'
  else if (products.some((p) => p.sku === sku && p.id !== editingId)) e.sku = `El SKU ${sku} ya existe.`

  if (!d.category || !CATEGORIES.includes(d.category)) e.category = 'Elige una categoría.'

  const price = parseDecimal(d.price)
  if (!d.price.trim()) e.price = 'Escribe el precio.'
  else if (Number.isNaN(price)) e.price = 'El precio debe ser un número, por ejemplo 12,50.'
  else if (price <= 0) e.price = 'El precio debe ser mayor que 0.'
  else if (decimals(price) > 2) e.price = 'Usa como máximo 2 decimales.'

  const cost = parseDecimal(d.cost)
  if (!d.cost.trim()) e.cost = 'Escribe el coste.'
  else if (Number.isNaN(cost) || cost < 0) e.cost = 'El coste debe ser un número igual o mayor que 0.'
  else if (decimals(cost) > 2) e.cost = 'Usa como máximo 2 decimales.'
  else if (!e.price && cost > price) e.cost = 'El coste no puede superar el precio de venta.'

  const stock = d.stock.trim()
  if (!stock) e.stock = 'Escribe las unidades en stock.'
  else if (!/^\d+$/.test(stock)) e.stock = 'El stock debe ser un número entero igual o mayor que 0.'

  return e
}

export const hasErrors = (e: ProductErrors) => Object.keys(e).length > 0

export function emptyDraft(): ProductDraft {
  return { name: '', sku: '', category: '', price: '', cost: '', stock: '', status: 'activo' }
}

export function productToDraft(p: Product): ProductDraft {
  const fmt = (n: number) => n.toFixed(2).replace('.', ',')
  return {
    name: p.name,
    sku: p.sku,
    category: p.category,
    price: fmt(p.price),
    cost: fmt(p.cost),
    stock: String(p.stock),
    status: p.status,
  }
}

export function draftToProduct(d: ProductDraft, base: Pick<Product, 'id' | 'createdAt'>): Product {
  return {
    id: base.id,
    createdAt: base.createdAt,
    name: d.name.trim(),
    sku: d.sku.trim().toUpperCase(),
    category: d.category as Category,
    price: parseDecimal(d.price),
    cost: parseDecimal(d.cost),
    stock: Number(d.stock.trim()),
    status: d.status,
  }
}

/** Siguiente SKU libre de una categoría, p. ej. "CAF-007". */
export function suggestSku(category: Category, products: Product[]): string {
  const prefix = skuPrefix(category)
  const used = products
    .map((p) => p.sku)
    .filter((s) => s.startsWith(prefix + '-'))
    .map((s) => Number(s.slice(prefix.length + 1)))
    .filter((n) => Number.isFinite(n))
  const next = (used.length ? Math.max(...used) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}
