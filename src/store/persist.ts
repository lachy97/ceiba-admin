import { DAY, createDemoData, shiftData, startOfDay } from '../data/seed'
import type { AppData } from '../data/types'

export const STORAGE_KEY = 'ceiba-admin:data:v1'

function isAppData(x: unknown): x is AppData {
  const d = x as AppData
  return !!d && d.version === 1 && Array.isArray(d.products) && Array.isArray(d.orders) && Array.isArray(d.customers)
}

/**
 * Carga los datos guardados en este navegador o genera la demo.
 * Si los datos son de un día anterior, se desplazan para que el panel
 * muestre siempre actividad reciente.
 */
export function loadData(now: number = Date.now()): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isAppData(parsed)) {
        const days = Math.round((startOfDay(now) - startOfDay(Date.parse(parsed.seededAt))) / DAY)
        return days > 0 ? shiftData(parsed, days * DAY) : parsed
      }
    }
  } catch {
    // Almacenamiento bloqueado o datos corruptos: se usa la demo.
  }
  return createDemoData(now)
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Sin almacenamiento disponible: los cambios duran hasta recargar.
  }
}
