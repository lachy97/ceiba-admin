import type { OrderStatus } from '../data/types'

/** Transiciones permitidas en el ciclo de vida de un pedido. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
}

export function nextStatuses(status: OrderStatus): OrderStatus[] {
  return NEXT[status]
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from].includes(to)
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ACTION_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Marcar como pendiente',
  pagado: 'Marcar como pagado',
  enviado: 'Marcar como enviado',
  entregado: 'Marcar como entregado',
  cancelado: 'Cancelar pedido',
}
