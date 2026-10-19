import { useMemo, useState } from 'react'
import { LuArrowRight, LuTriangleAlert } from 'react-icons/lu'
import { RevenueChart } from '../components/RevenueChart'
import { EmptyState, PageHeader, Segmented, StatusBadge, StockBadge } from '../components/ui'
import { ORDER_STATUSES } from '../data/types'
import { dateAndTime, integer, money, orderNumber, signedPercent } from '../lib/format'
import { STATUS_LABEL } from '../lib/orderFlow'
import { computeKpis, dailySeries, lowStock, orderTotal, statusBreakdown, topProducts, type Metric } from '../lib/stats'
import { useStore } from '../store/StoreContext'

const PERIODS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

function KpiCard({ label, metric, format }: { label: string; metric: Metric; format: (n: number) => string }) {
  const { change } = metric
  const tone = change === null || Math.abs(change) < 0.005 ? 'flat' : change > 0 ? 'up' : 'down'
  return (
    <article className="kpi">
      <h2 className="kpi-label">{label}</h2>
      <p className="kpi-value num">{format(metric.value)}</p>
      <p className={`kpi-delta delta-${tone}`}>
        {change === null ? 'Sin datos del período anterior' : (
          <>
            <span className="num">{signedPercent(change)}</span> vs. período anterior
          </>
        )}
      </p>
    </article>
  )
}

export function Dashboard() {
  const { data, customersById } = useStore()
  const [days, setDays] = useState(30)

  const view = useMemo(() => {
    const now = Date.now()
    const kpis = computeKpis(data.orders, data.customers, days, now)
    const series = dailySeries(data.orders, days, now)
    const statuses = statusBreakdown(data.orders, days, now)
    const top = topProducts(data.orders, days, now, 5)
    const low = lowStock(data.products).slice(0, 5)
    const recent = [...data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
    return { kpis, series, statuses, top, low, recent }
  }, [data, days])

  const statusMax = Math.max(1, ...Object.values(view.statuses))
  const statusTotal = Object.values(view.statuses).reduce((a, b) => a + b, 0)
  const topMax = Math.max(1, ...view.top.map((t) => t.revenue))

  return (
    <div className="page">
      <PageHeader
        title="Resumen"
        meta="Actividad de la tienda online Ceiba"
        actions={<Segmented label="Período" value={days} options={PERIODS} onChange={setDays} />}
      />

      <section className="kpis" aria-label="Indicadores clave">
        <KpiCard label="Ingresos" metric={view.kpis.revenue} format={money} />
        <KpiCard label="Pedidos" metric={view.kpis.orders} format={integer} />
        <KpiCard label="Ticket medio" metric={view.kpis.averageOrder} format={money} />
        <KpiCard label="Clientes nuevos" metric={view.kpis.newCustomers} format={integer} />
      </section>

      <div className="grid-2-1">
        <section className="card">
          <header className="card-head">
            <h2>Ingresos por día</h2>
            <span className="card-meta">Sin pedidos cancelados</span>
          </header>
          <RevenueChart points={view.series} />
        </section>

        <section className="card">
          <header className="card-head">
            <h2>Pedidos por estado</h2>
            <span className="card-meta num">{integer(statusTotal)} en total</span>
          </header>
          <ul className="bars">
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <a className="bar-row" href={`#/pedidos?estado=${s}`}>
                  <span className="bar-label">{STATUS_LABEL[s]}</span>
                  <span className="bar-track">
                    <span className={`bar-fill fill-${s}`} style={{ width: `${(view.statuses[s] / statusMax) * 100}%` }} />
                  </span>
                  <span className="bar-value num">{integer(view.statuses[s])}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid-3">
        <section className="card">
          <header className="card-head">
            <h2>Más vendidos</h2>
            <span className="card-meta">Por ingresos</span>
          </header>
          {view.top.length === 0 ? (
            <EmptyState title="Sin ventas en este período" />
          ) : (
            <ol className="top-list">
              {view.top.map((t) => (
                <li key={t.productId}>
                  <div className="top-row">
                    <span className="top-name">{t.name}</span>
                    <span className="num">{money(t.revenue)}</span>
                  </div>
                  <div className="top-bar">
                    <span style={{ width: `${(t.revenue / topMax) * 100}%` }} />
                  </div>
                  <span className="top-units num">{integer(t.units)} u. vendidas</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card">
          <header className="card-head">
            <h2>
              <LuTriangleAlert aria-hidden="true" className="head-icon warn" /> Stock bajo
            </h2>
            <a className="link" href="#/productos?stock=bajo">
              Ver todos <LuArrowRight aria-hidden="true" />
            </a>
          </header>
          {view.low.length === 0 ? (
            <EmptyState title="Todo el catálogo tiene stock suficiente" />
          ) : (
            <ul className="mini-list">
              {view.low.map((p) => (
                <li key={p.id}>
                  <div>
                    <span className="mini-title">{p.name}</span>
                    <span className="mini-sub mono">{p.sku}</span>
                  </div>
                  <StockBadge stock={p.stock} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card-head">
            <h2>Últimos pedidos</h2>
            <a className="link" href="#/pedidos">
              Ver todos <LuArrowRight aria-hidden="true" />
            </a>
          </header>
          <ul className="mini-list">
            {view.recent.map((o) => (
              <li key={o.id}>
                <a className="mini-link" href={`#/pedidos/${o.number}`}>
                  <div>
                    <span className="mini-title">
                      <span className="mono">{orderNumber(o.number)}</span> · {customersById.get(o.customerId)?.name ?? 'Cliente'}
                    </span>
                    <span className="mini-sub">
                      {dateAndTime(o.createdAt)} · <span className="num">{money(orderTotal(o))}</span>
                    </span>
                  </div>
                  <StatusBadge status={o.status} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
