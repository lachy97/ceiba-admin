export const CATEGORIES = ['Café', 'Cacao', 'Artesanía', 'Hogar', 'Accesorios'] as const
export type Category = (typeof CATEGORIES)[number]

export type ProductStatus = 'activo' | 'borrador'

export interface Product {
  id: string
  sku: string
  name: string
  category: Category
  /** Precio de venta en euros. */
  price: number
  /** Coste unitario en euros. */
  cost: number
  stock: number
  status: ProductStatus
  createdAt: string
}

export const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface OrderItem {
  productId: string
  name: string
  qty: number
  unitPrice: number
}

export interface StatusChange {
  status: OrderStatus
  at: string
}

export interface Order {
  id: string
  number: number
  customerId: string
  createdAt: string
  status: OrderStatus
  items: OrderItem[]
  shipping: number
  history: StatusChange[]
}

export interface Customer {
  id: string
  name: string
  email: string
  city: string
  country: string
  createdAt: string
}

export interface AppData {
  version: 1
  /** Momento en que se generaron (o desplazaron por última vez) los datos de demo. */
  seededAt: string
  products: Product[]
  orders: Order[]
  customers: Customer[]
}
