import { describe, expect, it } from 'vitest'
import { createDemoData, shiftData, DAY } from '../data/seed'
import { canTransition, nextStatuses } from '../lib/orderFlow'
import { newProductId, reducer } from './reducer'

const NOW = new Date(2026, 9, 15, 12, 0).getTime()
const base = createDemoData(NOW)

describe('createDemoData', () => {
  it('es determinista con la misma semilla', () => {
    const again = createDemoData(NOW)
    expect(again.orders.length).toBe(base.orders.length)
    expect(again.orders[10]).toEqual(base.orders[10])
  })

  it('genera pedidos numerados en orden y sin fechas futuras', () => {
    expect(base.orders.length).toBeGreaterThan(300)
    expect(base.orders[0].number).toBe(1001)
    expect(base.orders.every((o) => Date.parse(o.createdAt) <= NOW)).toBe(true)
    expect(base.orders.every((o, i, a) => i === 0 || a[i - 1].createdAt <= o.createdAt)).toBe(true)
  })

  it('el historial termina en el estado actual del pedido', () => {
    expect(base.orders.every((o) => o.history[o.history.length - 1].status === o.status)).toBe(true)
  })
})

describe('reducer', () => {
  it('crea, edita y elimina productos', () => {
    const id = newProductId(base.products)
    const created = reducer(base, { type: 'product/save', product: { ...base.products[0], id, sku: 'CAF-999' } })
    expect(created.products).toHaveLength(base.products.length + 1)
    const edited = reducer(created, { type: 'product/save', product: { ...created.products[0], price: 99 } })
    expect(edited.products.find((p) => p.id === id)?.price).toBe(99)
    const removed = reducer(edited, { type: 'product/delete', id })
    expect(removed.products).toHaveLength(base.products.length)
  })

  it('solo permite transiciones de estado válidas', () => {
    const pending = base.orders.find((o) => o.status === 'pendiente')!
    const paid = reducer(base, { type: 'order/setStatus', id: pending.id, status: 'pagado', at: new Date(NOW).toISOString() })
    const after = paid.orders.find((o) => o.id === pending.id)!
    expect(after.status).toBe('pagado')
    expect(after.history[after.history.length - 1].status).toBe('pagado')

    const delivered = base.orders.find((o) => o.status === 'entregado')!
    const same = reducer(base, { type: 'order/setStatus', id: delivered.id, status: 'pendiente', at: 'x' })
    expect(same).toBe(base)
  })
})

describe('orderFlow', () => {
  it('define el ciclo de vida del pedido', () => {
    expect(nextStatuses('pendiente')).toEqual(['pagado', 'cancelado'])
    expect(canTransition('enviado', 'cancelado')).toBe(false)
    expect(nextStatuses('entregado')).toEqual([])
  })
})

describe('shiftData', () => {
  it('desplaza todas las fechas', () => {
    const shifted = shiftData(base, 2 * DAY)
    expect(Date.parse(shifted.orders[0].createdAt) - Date.parse(base.orders[0].createdAt)).toBe(2 * DAY)
    expect(Date.parse(shifted.seededAt) - Date.parse(base.seededAt)).toBe(2 * DAY)
  })
})
