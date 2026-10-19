import type { AppData, Category, Customer, Order, OrderItem, OrderStatus, Product, StatusChange } from './types'

export const DAY = 86_400_000
const HOUR = 3_600_000

/** Generador pseudoaleatorio con semilla: los datos de demo son siempre los mismos. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SKU_PREFIX: Record<Category, string> = {
  Café: 'CAF',
  Cacao: 'CAC',
  Artesanía: 'ART',
  Hogar: 'HOG',
  Accesorios: 'ACC',
}

export function skuPrefix(category: Category): string {
  return SKU_PREFIX[category]
}

// [nombre, categoría, precio, stock, estado]
const CATALOG: [string, Category, number, number, Product['status']][] = [
  ['Café de altura molido 250 g', 'Café', 8.9, 64, 'activo'],
  ['Café en grano tueste medio 500 g', 'Café', 14.5, 38, 'activo'],
  ['Café en grano tueste oscuro 1 kg', 'Café', 26, 7, 'activo'],
  ['Café descafeinado molido 250 g', 'Café', 9.4, 22, 'activo'],
  ['Café de montaña origen único 250 g', 'Café', 11.9, 4, 'activo'],
  ['Cápsulas compatibles intenso (10 u.)', 'Café', 4.2, 120, 'activo'],
  ['Tableta de chocolate 70 % cacao 100 g', 'Cacao', 3.8, 85, 'activo'],
  ['Tableta de chocolate con leche 45 % 100 g', 'Cacao', 3.4, 0, 'activo'],
  ['Cacao en polvo puro 250 g', 'Cacao', 6.5, 41, 'activo'],
  ['Bombones de cacao y ron (caja 12 u.)', 'Cacao', 12.9, 18, 'activo'],
  ['Nibs de cacao tostado 200 g', 'Cacao', 7.2, 9, 'activo'],
  ['Cesta de yarey tejida a mano', 'Artesanía', 29, 12, 'activo'],
  ['Sombrero de guano', 'Artesanía', 22.5, 16, 'activo'],
  ['Figura tallada en caoba', 'Artesanía', 45, 3, 'activo'],
  ['Taza de cerámica esmaltada', 'Artesanía', 13.9, 47, 'activo'],
  ['Jarra de barro cocido', 'Artesanía', 27, 11, 'activo'],
  ['Mantel bordado 140 × 180 cm', 'Artesanía', 39, 6, 'activo'],
  ['Vela aromática de tabaco y vainilla', 'Hogar', 16.5, 29, 'activo'],
  ['Juego de 4 posavasos de madera', 'Hogar', 11, 33, 'activo'],
  ['Hamaca de algodón doble', 'Hogar', 64, 8, 'activo'],
  ['Cojín de lino estampado', 'Hogar', 21, 25, 'activo'],
  ['Cafetera italiana de aluminio 6 tazas', 'Hogar', 24.9, 19, 'activo'],
  ['Molinillo de café manual', 'Hogar', 34, 14, 'activo'],
  ['Bolso de yute', 'Accesorios', 19.9, 27, 'activo'],
  ['Abanico de madera pintado', 'Accesorios', 9.5, 52, 'activo'],
  ['Guayabera de lino', 'Accesorios', 49, 15, 'activo'],
  ['Pañuelo de algodón estampado', 'Accesorios', 14, 31, 'activo'],
  ['Llavero de semillas', 'Accesorios', 4.5, 0, 'activo'],
  ['Cuaderno con tapa de papel artesanal', 'Accesorios', 8, 44, 'borrador'],
  ['Set de tazas de espresso (4 u.)', 'Hogar', 28, 20, 'borrador'],
]

const FIRST_NAMES = [
  'Lucía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Diego', 'Sofía', 'Martín', 'Isabella', 'Javier',
  'Daniela', 'Andrés', 'Paula', 'Hugo', 'Carmen', 'Gabriel', 'Elena', 'Tomás', 'Mariana', 'Pablo',
  'Ana', 'Raúl', 'Natalia', 'Iker', 'Laura', 'Adrián', 'Julia', 'Sergio', 'Alba', 'Leonardo',
]
const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales', 'Ortiz', 'Castro', 'Vargas', 'Romero', 'Navarro',
  'Ruiz', 'Molina', 'Delgado', 'Herrera', 'Medina', 'Suárez', 'Castillo', 'Rojas', 'Iglesias', 'Peña',
]
const CITIES: [string, string][] = [
  ['Madrid', 'España'], ['Barcelona', 'España'], ['Valencia', 'España'], ['Sevilla', 'España'],
  ['Málaga', 'España'], ['Bilbao', 'España'], ['Ciudad de México', 'México'], ['Guadalajara', 'México'],
  ['Bogotá', 'Colombia'], ['Medellín', 'Colombia'], ['Buenos Aires', 'Argentina'], ['Santiago', 'Chile'],
  ['Lima', 'Perú'], ['Miami', 'EE. UU.'],
]

const round2 = (n: number) => Math.round(n * 100) / 100

export function startOfDay(t: number): number {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '')
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]
}

function buildHistory(rand: () => number, created: number, now: number, final: OrderStatus): StatusChange[] {
  const h: StatusChange[] = [{ status: 'pendiente', at: new Date(created).toISOString() }]
  if (final === 'pendiente') return h
  if (final === 'cancelado') {
    const at = Math.min(now, created + (2 + rand() * 20) * HOUR)
    h.push({ status: 'cancelado', at: new Date(at).toISOString() })
    return h
  }
  const steps: OrderStatus[] = ['pagado', 'enviado', 'entregado']
  const gaps = [0.2 + rand() * 1.5, 18 + rand() * 30, 30 + rand() * 60] // horas
  let t = created
  for (let i = 0; i < steps.length; i++) {
    t = Math.min(now, t + gaps[i] * HOUR)
    h.push({ status: steps[i], at: new Date(t).toISOString() })
    if (steps[i] === final) break
  }
  return h
}

function statusForAge(rand: () => number, ageHours: number): OrderStatus {
  const r = rand()
  if (ageHours < 24) return r < 0.04 ? 'cancelado' : r < 0.5 ? 'pendiente' : 'pagado'
  if (ageHours < 72) return r < 0.04 ? 'cancelado' : r < 0.4 ? 'pagado' : 'enviado'
  if (ageHours < 168) return r < 0.05 ? 'cancelado' : r < 0.4 ? 'enviado' : 'entregado'
  return r < 0.07 ? 'cancelado' : 'entregado'
}

/**
 * Genera una tienda de demostración completa: catálogo, clientes y
 * ~120 días de pedidos que terminan en `now`.
 */
export function createDemoData(now: number = Date.now(), seed = 20261015, orderDays = 120): AppData {
  const rand = mulberry32(seed)
  const today = startOfDay(now)

  const products: Product[] = CATALOG.map(([name, category, price, stock, status], i) => {
    const sameCat = CATALOG.slice(0, i + 1).filter((c) => c[1] === category).length
    return {
      id: `prd_${String(i + 1).padStart(3, '0')}`,
      sku: `${SKU_PREFIX[category]}-${String(sameCat).padStart(3, '0')}`,
      name,
      category,
      price,
      cost: round2(price * (0.38 + rand() * 0.22)),
      stock,
      status,
      createdAt: new Date(today - (200 + Math.floor(rand() * 300)) * DAY).toISOString(),
    }
  })

  const customers: Customer[] = Array.from({ length: 80 }, (_, i) => {
    const first = pick(rand, FIRST_NAMES)
    const last = pick(rand, LAST_NAMES)
    const [city, country] = pick(rand, CITIES)
    const created = today - Math.floor(rand() * 365) * DAY + Math.floor(rand() * 14) * HOUR + 8 * HOUR
    return {
      id: `cus_${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${slug(first)}.${slug(last)}${i + 1}@example.com`,
      city,
      country,
      createdAt: new Date(created).toISOString(),
    }
  })

  const sellable = products.filter((p) => p.status === 'activo')
  const raw: Omit<Order, 'id' | 'number'>[] = []

  for (let d = orderDays - 1; d >= 0; d--) {
    const dayStart = today - d * DAY
    const weekday = new Date(dayStart).getDay()
    const weekFactor = weekday === 0 || weekday === 6 ? 1.3 : weekday === 1 ? 0.85 : 1
    const trend = 1 + 0.55 * (1 - d / orderDays)
    const count = Math.floor(3.1 * trend * weekFactor + rand() * 2.6)

    for (let k = 0; k < count; k++) {
      const created = dayStart + (8 + rand() * 15) * HOUR
      if (created > now) continue
      const eligible = customers.filter((c) => Date.parse(c.createdAt) <= created)
      if (eligible.length === 0) continue
      const customer = pick(rand, eligible)

      const lines = 1 + Math.floor(rand() * rand() * 3.5)
      const items: OrderItem[] = []
      for (let l = 0; l < lines; l++) {
        const p = pick(rand, sellable)
        if (items.some((it) => it.productId === p.id)) continue
        const qty = rand() < 0.72 ? 1 : rand() < 0.75 ? 2 : 3
        items.push({ productId: p.id, name: p.name, qty, unitPrice: p.price })
      }
      const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0)
      const status = statusForAge(rand, (now - created) / HOUR)
      raw.push({
        customerId: customer.id,
        createdAt: new Date(created).toISOString(),
        status,
        items,
        shipping: subtotal >= 60 ? 0 : 4.95,
        history: buildHistory(rand, created, now, status),
      })
    }
  }

  raw.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  const orders: Order[] = raw.map((o, i) => ({ ...o, id: `ord_${1001 + i}`, number: 1001 + i }))

  return { version: 1, seededAt: new Date(now).toISOString(), products, orders, customers }
}

/** Desplaza todas las fechas de los datos para que la demo parezca siempre actual. */
export function shiftData(data: AppData, deltaMs: number): AppData {
  const s = (iso: string) => new Date(Date.parse(iso) + deltaMs).toISOString()
  return {
    ...data,
    seededAt: s(data.seededAt),
    products: data.products.map((p) => ({ ...p, createdAt: s(p.createdAt) })),
    customers: data.customers.map((c) => ({ ...c, createdAt: s(c.createdAt) })),
    orders: data.orders.map((o) => ({
      ...o,
      createdAt: s(o.createdAt),
      history: o.history.map((h) => ({ ...h, at: s(h.at) })),
    })),
  }
}
