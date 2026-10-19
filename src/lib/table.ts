import type { Category, Customer, Order, OrderStatus, Product, ProductStatus } from '../data/types'
import { margin, stockLevel } from './stats'

/** Minúsculas y sin tildes, para buscar "cafe" y encontrar "Café". */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export type SortDir = 'asc' | 'desc'
export interface Sort<K extends string> {
  key: K
  dir: SortDir
}

export function toggleSort<K extends string>(current: Sort<K>, key: K, firstDir: SortDir = 'asc'): Sort<K> {
  if (current.key !== key) return { key, dir: firstDir }
  return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' })
}

export function sortBy<T>(items: T[], get: (item: T) => string | number, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => sign * compare(get(a), get(b)))
}

export interface Page<T> {
  items: T[]
  page: number
  pages: number
  total: number
  /** Posición (1-based) del primer y último elemento mostrados. */
  from: number
  to: number
}

export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / size))
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages)
  const startIdx = (p - 1) * size
  const slice = items.slice(startIdx, startIdx + size)
  return { items: slice, page: p, pages, total, from: total ? startIdx + 1 : 0, to: startIdx + slice.length }
}

/* ---------- Productos ---------- */

export type ProductSortKey = 'name' | 'price' | 'stock' | 'margin' | 'category'
export type StockFilter = 'todos' | 'bajo' | 'agotado'

export interface ProductQuery {
  search: string
  category: Category | 'todas'
  status: ProductStatus | 'todos'
  stock: StockFilter
  sort: Sort<ProductSortKey>
}

export const DEFAULT_PRODUCT_QUERY: ProductQuery = {
  search: '',
  category: 'todas',
  status: 'todos',
  stock: 'todos',
  sort: { key: 'name', dir: 'asc' },
}

export function queryProducts(products: Product[], q: ProductQuery): Product[] {
  const term = normalize(q.search)
  const filtered = products.filter((p) => {
    if (term && !normalize(`${p.name} ${p.sku}`).includes(term)) return false
    if (q.category !== 'todas' && p.category !== q.category) return false
    if (q.status !== 'todos' && p.status !== q.status) return false
    if (q.stock === 'agotado' && stockLevel(p.stock) !== 'agotado') return false
    if (q.stock === 'bajo' && stockLevel(p.stock) === 'ok') return false
    return true
  })
  const getters: Record<ProductSortKey, (p: Product) => string | number> = {
    name: (p) => p.name,
    price: (p) => p.price,
    stock: (p) => p.stock,
    margin: (p) => margin(p),
    category: (p) => p.category,
  }
  return sortBy(filtered, getters[q.sort.key], q.sort.dir)
}

/* ---------- Pedidos ---------- */

export interface OrderQuery {
  search: string
  status: OrderStatus | 'todos'
}

export function queryOrders(orders: Order[], customers: Map<string, Customer>, q: OrderQuery): Order[] {
  const term = normalize(q.search).replace(/^#/, '')
  return orders
    .filter((o) => {
      if (q.status !== 'todos' && o.status !== q.status) return false
      if (!term) return true
      const c = customers.get(o.customerId)
      return normalize(`${o.number} ${c?.name ?? ''} ${c?.email ?? ''}`).includes(term)
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function countByStatus(orders: Order[]): Record<OrderStatus | 'todos', number> {
  const out = { todos: orders.length, pendiente: 0, pagado: 0, enviado: 0, entregado: 0, cancelado: 0 }
  for (const o of orders) out[o.status] += 1
  return out
}
