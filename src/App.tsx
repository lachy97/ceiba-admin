import { useEffect, useState } from 'react'
import { LuMenu } from 'react-icons/lu'
import { Logo, NAV, Sidebar } from './components/Sidebar'
import { ToastProvider, useToast } from './components/Toast'
import { useHashRoute } from './hooks/useHashRoute'
import { useTheme } from './hooks/useTheme'
import { Customers } from './pages/Customers'
import { Dashboard } from './pages/Dashboard'
import { Orders } from './pages/Orders'
import { Products } from './pages/Products'
import { StoreProvider, useStore } from './store/StoreContext'

function Shell() {
  const { segments, query, navigate } = useHashRoute()
  const { data, resetDemo } = useStore()
  const toast = useToast()
  const [theme, toggleTheme] = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const section = NAV.some((n) => n.key === segments[0]) ? segments[0] : ''
  const openOrder = section === 'pedidos' && segments[1] ? Number(segments[1]) : null
  const pending = data.orders.filter((o) => o.status === 'pendiente' || o.status === 'pagado').length

  const title = NAV.find((n) => n.key === section)?.label ?? 'Resumen'
  useEffect(() => {
    document.title = `${title} · Ceiba Admin`
    window.scrollTo?.(0, 0)
  }, [title])

  return (
    <div className="app">
      <a className="skip" href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('contenido')?.focus() }}>
        Saltar al contenido
      </a>
      <Sidebar
        current={section}
        badges={{ pedidos: pending }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onReset={() => {
          resetDemo()
          toast('Datos de demostración restablecidos')
        }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <LuMenu aria-hidden="true" />
          </button>
          <span className="topbar-brand">
            <Logo /> Ceiba
          </span>
        </header>
        <main id="contenido" tabIndex={-1}>
          {section === '' && <Dashboard />}
          {section === 'productos' && <Products query={query} />}
          {section === 'pedidos' && (
            <Orders query={query} openNumber={openOrder !== null && Number.isFinite(openOrder) ? openOrder : null} navigate={navigate} />
          )}
          {section === 'clientes' && <Customers />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  )
}
