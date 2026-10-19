import type { IconType } from 'react-icons'
import { LuLayoutDashboard, LuMoon, LuPackage, LuReceipt, LuRotateCcw, LuSun, LuUsers, LuX } from 'react-icons/lu'
import type { Theme } from '../hooks/useTheme'
import { ConfirmButton } from './ui'

export interface NavItem {
  key: string
  href: string
  label: string
  icon: IconType
  badge?: number
}

export const NAV: Omit<NavItem, 'badge'>[] = [
  { key: '', href: '#/', label: 'Resumen', icon: LuLayoutDashboard },
  { key: 'productos', href: '#/productos', label: 'Productos', icon: LuPackage },
  { key: 'pedidos', href: '#/pedidos', label: 'Pedidos', icon: LuReceipt },
  { key: 'clientes', href: '#/clientes', label: 'Clientes', icon: LuUsers },
]

export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" />
      <path d="M16 26V14M16 18c-3 0-6-2-7-5 3-1 6 0 7 2 1-2 4-3 7-2-1 3-4 5-7 5Z" />
    </svg>
  )
}

export function Sidebar({
  current,
  badges,
  theme,
  onToggleTheme,
  onReset,
  open,
  onClose,
}: {
  current: string
  badges: Record<string, number | undefined>
  theme: Theme
  onToggleTheme: () => void
  onReset: () => void
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      <div className={`sidebar-scrim${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Navegación principal">
        <div className="brand">
          <Logo />
          <div>
            <strong>Ceiba</strong>
            <span>Panel de tienda</span>
          </div>
          <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <LuX aria-hidden="true" />
          </button>
        </div>

        <nav className="nav">
          {NAV.map(({ key, href, label, icon: Icon }) => {
            const badge = badges[key]
            return (
              <a
                key={key}
                href={href}
                className={`nav-link${current === key ? ' is-active' : ''}`}
                aria-current={current === key ? 'page' : undefined}
                onClick={onClose}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {badge ? (
                  <span className="nav-badge num" aria-label={`${badge} pendientes`}>
                    {badge}
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>

        <div className="sidebar-foot">
          <button type="button" className="btn btn-quiet" onClick={onToggleTheme}>
            {theme === 'dark' ? <LuSun aria-hidden="true" /> : <LuMoon aria-hidden="true" />}
            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </button>
          <ConfirmButton
            label="Restablecer demo"
            question="¿Volver a los datos de ejemplo?"
            confirmLabel="Restablecer"
            onConfirm={onReset}
            icon={<LuRotateCcw aria-hidden="true" />}
            className="btn btn-quiet"
          />
          <p className="demo-note">Datos de demostración generados en tu navegador.</p>
        </div>
      </aside>
    </>
  )
}
