import { useCallback, useSyncExternalStore } from 'react'

/**
 * Router mínimo basado en el hash (#/pedidos/1042?estado=pagado).
 * Funciona en GitHub Pages sin configuración extra en el servidor.
 */
export interface Route {
  /** Segmentos de la ruta: "#/pedidos/1042" → ["pedidos", "1042"] */
  segments: string[]
  query: URLSearchParams
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  const [path = '', search = ''] = clean.split('?')
  return {
    segments: path.split('/').filter(Boolean).map(decodeURIComponent),
    query: new URLSearchParams(search),
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const getHash = () => window.location.hash

export function navigate(to: string): void {
  const target = to.startsWith('#') ? to : `#${to}`
  if (window.location.hash !== target) window.location.hash = target
}

export function useHashRoute(): Route & { navigate: (to: string) => void } {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const go = useCallback((to: string) => navigate(to), [])
  return { ...parseHash(hash), navigate: go }
}
