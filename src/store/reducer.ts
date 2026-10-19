import type { AppData, OrderStatus, Product } from '../data/types'
import { canTransition } from '../lib/orderFlow'

export type Action =
  | { type: 'product/save'; product: Product }
  | { type: 'product/delete'; id: string }
  | { type: 'order/setStatus'; id: string; status: OrderStatus; at: string }
  | { type: 'data/replace'; data: AppData }

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'product/save': {
      const exists = state.products.some((p) => p.id === action.product.id)
      const products = exists
        ? state.products.map((p) => (p.id === action.product.id ? action.product : p))
        : [action.product, ...state.products]
      return { ...state, products }
    }
    case 'product/delete':
      return { ...state, products: state.products.filter((p) => p.id !== action.id) }
    case 'order/setStatus': {
      let changed = false
      const orders = state.orders.map((o) => {
        if (o.id !== action.id || !canTransition(o.status, action.status)) return o
        changed = true
        return { ...o, status: action.status, history: [...o.history, { status: action.status, at: action.at }] }
      })
      return changed ? { ...state, orders } : state
    }
    case 'data/replace':
      return action.data
  }
}

export function newProductId(products: Product[]): string {
  const max = products.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, '')) || 0), 0)
  return `prd_${String(max + 1).padStart(3, '0')}`
}
