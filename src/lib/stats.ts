import { DAY, startOfDay } from '../data/seed'
import type { Customer, Order, OrderStatus, Product } from '../data/types'
import { ORDER_STATUSES } from '../data/types'

export const round2 = (n: number) => Math.round(n * 100) / 100

export function orderSubtotal(o: Order): number {
  return round2(o.items.reduce((s, it) => s + it.qty * it.unitPrice, 0))
}

export function orderTotal(o: Order): number {
  return round2(orderSubtotal(o) + o.shipping)
}

export function orderUnits(o: Order): number {
  return o.items.reduce((s, it) => s + it.qty, 0)
}

export interface Period {
  start: number
  end: number
  prevStart: number
}

/** Período de `days` días que termina hoy (incluido), y el período anterior de igual duración. */
export function periodBounds(now: number, days: number): Period {
  const end = startOfDay(now) + DAY
  const start = end - days * DAY
  return { start, end, prevStart: start - days * DAY }
}

const inRange = (iso: string, from: number, to: number) => {
  const t = Date.parse(iso)
  return t >= from && t < to
}

export interface Metric {
  value: number
  previous: number
  /** Variación relativa; null si el período anterior fue 0. */
  change: number | null
}

const metric = (value: number, previous: number): Metric => ({
  value,
  previous,
  change: previous === 0 ? null : (value - previous) / previous,
})

export interface Kpis {
  revenue: Metric
  orders: Metric
  averageOrder: Metric
  newCustomers: Metric
}

export function computeKpis(orders: Order[], customers: Customer[], days: number, now: number): Kpis {
  const { start, end, prevStart } = periodBounds(now, days)
  const valid = orders.filter((o) => o.status !== 'cancelado')
  const cur = valid.filter((o) => inRange(o.createdAt, start, end))
  const prev = valid.filter((o) => inRange(o.createdAt, prevStart, start))
  const sum = (list: Order[]) => round2(list.reduce((s, o) => s + orderTotal(o), 0))
  const revenue = sum(cur)
  const prevRevenue = sum(prev)
  const aov = cur.length ? round2(revenue / cur.length) : 0
  const prevAov = prev.length ? round2(prevRevenue / prev.length) : 0
  const newCur = customers.filter((c) => inRange(c.createdAt, start, end)).length
  const newPrev = customers.filter((c) => inRange(c.createdAt, prevStart, start)).length
  return {
    revenue: metric(revenue, prevRevenue),
    orders: metric(cur.length, prev.length),
    averageOrder: metric(aov, prevAov),
    newCustomers: metric(newCur, newPrev),
  }
}

export interface DayPoint {
  day: number
  revenue: number
  orders: number
}

/** Ingresos y pedidos por día (sin cancelados), un punto por cada día del período. */
export function dailySeries(orders: Order[], days: number, now: number): DayPoint[] {
  const { start } = periodBounds(now, days)
  const points: DayPoint[] = Array.from({ length: days }, (_, i) => ({ day: start + i * DAY, revenue: 0, orders: 0 }))
  for (const o of orders) {
    if (o.status === 'cancelado') continue
    const idx = Math.floor((startOfDay(Date.parse(o.createdAt)) - start) / DAY + 0.5)
    if (idx < 0 || idx >= days) continue
    points[idx].revenue = round2(points[idx].revenue + orderTotal(o))
    points[idx].orders += 1
  }
  return points
}

export function statusBreakdown(orders: Order[], days: number, now: number): Record<OrderStatus, number> {
  const { start, end } = periodBounds(now, days)
  const out = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>
  for (const o of orders) if (inRange(o.createdAt, start, end)) out[o.status] += 1
  return out
}

export interface ProductSales {
  productId: string
  name: string
  units: number
  revenue: number
}

export function topProducts(orders: Order[], days: number, now: number, limit = 5): ProductSales[] {
  const { start, end } = periodBounds(now, days)
  const map = new Map<string, ProductSales>()
  for (const o of orders) {
    if (o.status === 'cancelado' || !inRange(o.createdAt, start, end)) continue
    for (const it of o.items) {
      const row = map.get(it.productId) ?? { productId: it.productId, name: it.name, units: 0, revenue: 0 }
      row.units += it.qty
      row.revenue = round2(row.revenue + it.qty * it.unitPrice)
      map.set(it.productId, row)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, limit)
}

export const LOW_STOCK = 10

export function stockLevel(stock: number): 'agotado' | 'bajo' | 'ok' {
  if (stock <= 0) return 'agotado'
  if (stock <= LOW_STOCK) return 'bajo'
  return 'ok'
}

export function lowStock(products: Product[], threshold = LOW_STOCK): Product[] {
  return products
    .filter((p) => p.status === 'activo' && p.stock <= threshold)
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'es'))
}

/** Margen bruto sobre el precio de venta (0–1). */
export function margin(p: Pick<Product, 'price' | 'cost'>): number {
  return p.price > 0 ? (p.price - p.cost) / p.price : 0
}

export interface CustomerStats {
  orders: number
  spent: number
  lastOrderAt: string | null
}

export function customerStats(orders: Order[]): Map<string, CustomerStats> {
  const map = new Map<string, CustomerStats>()
  for (const o of orders) {
    const s = map.get(o.customerId) ?? { orders: 0, spent: 0, lastOrderAt: null }
    s.orders += 1
    if (o.status !== 'cancelado') s.spent = round2(s.spent + orderTotal(o))
    if (!s.lastOrderAt || o.createdAt > s.lastOrderAt) s.lastOrderAt = o.createdAt
    map.set(o.customerId, s)
  }
  return map
}

/** Marcas "redondas" para un eje que va de 0 a `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow
  const ticks: number[] = []
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(round2(v))
  return ticks
}
