import { describe, expect, it } from 'vitest'
import { DAY, createDemoData, startOfDay } from '../data/seed'
import type { Customer, Order } from '../data/types'
import { computeKpis, dailySeries, lowStock, margin, niceTicks, orderTotal, statusBreakdown, topProducts } from './stats'

const NOW = new Date(2026, 9, 15, 12, 0).getTime()

function order(partial: Partial<Order> & { createdAt: string }): Order {
  return {
    id: 'ord_1',
    number: 1,
    customerId: 'cus_1',
    status: 'entregado',
    items: [{ productId: 'p1', name: 'Café', qty: 2, unitPrice: 10 }],
    shipping: 4.95,
    history: [],
    ...partial,
  }
}

const daysAgo = (n: number) => new Date(startOfDay(NOW) - n * DAY + 10 * 3_600_000).toISOString()

describe('orderTotal', () => {
  it('suma artículos y envío con dos decimales', () => {
    expect(orderTotal(order({ createdAt: daysAgo(0) }))).toBe(24.95)
  })
})

describe('computeKpis', () => {
  const orders = [
    order({ id: 'a', createdAt: daysAgo(1) }),
    order({ id: 'b', createdAt: daysAgo(2) }),
    order({ id: 'c', createdAt: daysAgo(3), status: 'cancelado' }),
    order({ id: 'd', createdAt: daysAgo(10) }),
  ]
  const customers: Customer[] = [
    { id: 'c1', name: 'A', email: 'a@example.com', city: 'Madrid', country: 'España', createdAt: daysAgo(2) },
    { id: 'c2', name: 'B', email: 'b@example.com', city: 'Lima', country: 'Perú', createdAt: daysAgo(9) },
  ]

  it('excluye pedidos cancelados y compara con el período anterior', () => {
    const k = computeKpis(orders, customers, 7, NOW)
    expect(k.orders.value).toBe(2)
    expect(k.orders.previous).toBe(1)
    expect(k.orders.change).toBe(1)
    expect(k.revenue.value).toBe(49.9)
    expect(k.averageOrder.value).toBe(24.95)
    expect(k.newCustomers.value).toBe(1)
    expect(k.newCustomers.previous).toBe(1)
  })

  it('devuelve change null si el período anterior está vacío', () => {
    const k = computeKpis([order({ createdAt: daysAgo(0) })], [], 7, NOW)
    expect(k.revenue.change).toBe(null)
  })
})

describe('dailySeries', () => {
  it('genera un punto por día y coloca cada pedido en su día', () => {
    const series = dailySeries([order({ createdAt: daysAgo(0) }), order({ createdAt: daysAgo(0) })], 7, NOW)
    expect(series).toHaveLength(7)
    expect(series[6].orders).toBe(2)
    expect(series[6].revenue).toBe(49.9)
    expect(series[0].orders).toBe(0)
  })
})

describe('statusBreakdown y topProducts', () => {
  it('cuenta estados dentro del período', () => {
    const s = statusBreakdown([order({ createdAt: daysAgo(1), status: 'pendiente' }), order({ createdAt: daysAgo(40) })], 30, NOW)
    expect(s.pendiente).toBe(1)
    expect(s.entregado).toBe(0)
  })

  it('ordena productos por ingresos', () => {
    const top = topProducts(
      [
        order({ createdAt: daysAgo(1), items: [{ productId: 'x', name: 'X', qty: 1, unitPrice: 5 }] }),
        order({ createdAt: daysAgo(1), items: [{ productId: 'y', name: 'Y', qty: 3, unitPrice: 5 }] }),
      ],
      7,
      NOW,
    )
    expect(top[0].productId).toBe('y')
    expect(top[0].units).toBe(3)
  })
})

describe('niceTicks', () => {
  it('usa pasos redondos que cubren el máximo', () => {
    expect(niceTicks(940, 4)).toEqual([0, 250, 500, 750, 1000])
    expect(niceTicks(0)).toEqual([0])
  })
})

describe('margin y lowStock', () => {
  it('calcula el margen bruto', () => {
    expect(margin({ price: 10, cost: 4 })).toBeCloseTo(0.6)
  })

  it('lista productos activos con poco stock, de menor a mayor', () => {
    const data = createDemoData(NOW)
    const low = lowStock(data.products)
    expect(low.length).toBeGreaterThan(0)
    expect(low.every((p) => p.stock <= 10 && p.status === 'activo')).toBe(true)
    expect(low[0].stock).toBe(0)
  })
})
