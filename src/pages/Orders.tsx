import { useEffect, useMemo, useState } from 'react'
import { LuCreditCard, LuMail, LuMapPin, LuPackageCheck, LuTruck, LuCircleX, LuClock } from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { useToast } from '../components/Toast'
import { ConfirmButton, Drawer, EmptyState, PageHeader, Pagination, SearchField, StatusBadge } from '../components/ui'
import { ORDER_STATUSES, type Order, type OrderStatus } from '../data/types'
import { dateAndTime, integer, longDate, money, orderNumber } from '../lib/format'
import { ACTION_LABEL, STATUS_LABEL, nextStatuses } from '../lib/orderFlow'
import { orderSubtotal, orderTotal, orderUnits } from '../lib/stats'
import { countByStatus, paginate, queryOrders, type OrderQuery } from '../lib/table'
import { useStore } from '../store/StoreContext'

const PAGE_SIZE = 12

const STATUS_ICON: Record<OrderStatus, IconType> = {
  pendiente: LuClock,
  pagado: LuCreditCard,
  enviado: LuTruck,
  entregado: LuPackageCheck,
  cancelado: LuCircleX,
}

export function Orders({
  query: routeQuery,
  openNumber,
  navigate,
}: {
  query: URLSearchParams
  openNumber: number | null
  navigate: (to: string) => void
}) {
  const { data, customersById } = useStore()
  const [q, setQ] = useState<OrderQuery>({ search: '', status: 'todos' })
  const [page, setPage] = useState(1)

  const statusParam = routeQuery.get('estado')
  useEffect(() => {
    if (statusParam && (ORDER_STATUSES as readonly string[]).includes(statusParam)) {
      setQ((cur) => ({ ...cur, status: statusParam as OrderStatus }))
      setPage(1)
    }
  }, [statusParam])

  const counts = useMemo(() => countByStatus(data.orders), [data.orders])
  const results = useMemo(() => queryOrders(data.orders, customersById, q), [data.orders, customersById, q])
  const current = paginate(results, page, PAGE_SIZE)
  const open = openNumber !== null ? data.orders.find((o) => o.number === openNumber) ?? null : null

  const setStatus = (status: OrderStatus | 'todos') => {
    setQ((cur) => ({ ...cur, status }))
    setPage(1)
  }

  return (
    <div className="page">
      <PageHeader
        title="Pedidos"
        meta={
          <>
            <span className="num">{integer(counts.pendiente + counts.pagado)}</span> pedidos por preparar
          </>
        }
      />

      <section className="card card-flush">
        <div className="tabs" role="tablist" aria-label="Filtrar por estado">
          {(['todos', ...ORDER_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={q.status === s}
              className={`tab${q.status === s ? ' is-on' : ''}`}
              onClick={() => setStatus(s)}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
              <span className="tab-count num">{integer(counts[s])}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <SearchField
            id="order-search"
            value={q.search}
            onChange={(search) => {
              setQ((cur) => ({ ...cur, search }))
              setPage(1)
            }}
            placeholder="Buscar por nº de pedido, cliente o email"
          />
        </div>

        {results.length === 0 ? (
          <EmptyState title="No hay pedidos que coincidan">
            <button type="button" className="btn" onClick={() => setQ({ search: '', status: 'todos' })}>
              Ver todos los pedidos
            </button>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table-click">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col" className="num">
                    Artículos
                  </th>
                  <th scope="col" className="num">
                    Total
                  </th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((o) => {
                  const c = customersById.get(o.customerId)
                  return (
                    <tr key={o.id} onClick={() => navigate(`/pedidos/${o.number}`)}>
                      <td>
                        <a className="mono row-link" href={`#/pedidos/${o.number}`} onClick={(e) => e.stopPropagation()}>
                          {orderNumber(o.number)}
                        </a>
                      </td>
                      <td className="nowrap">{dateAndTime(o.createdAt)}</td>
                      <td>
                        <div className="cell-main">{c?.name ?? 'Cliente eliminado'}</div>
                        <div className="cell-sub">{c ? `${c.city}, ${c.country}` : ''}</div>
                      </td>
                      <td className="num">{integer(orderUnits(o))}</td>
                      <td className="num">{money(orderTotal(o))}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} onPage={setPage} noun="pedidos" />
      </section>

      {openNumber !== null && (
        <OrderDrawer order={open} number={openNumber} onClose={() => navigate('/pedidos')} />
      )}
    </div>
  )
}

function OrderDrawer({ order, number, onClose }: { order: Order | null; number: number; onClose: () => void }) {
  const { dispatch, customersById } = useStore()
  const toast = useToast()

  if (!order) {
    return (
      <Drawer title={`Pedido ${orderNumber(number)}`} onClose={onClose}>
        <EmptyState title="Este pedido no existe en los datos actuales." />
      </Drawer>
    )
  }

  const c = customersById.get(order.customerId)
  const next = nextStatuses(order.status)
  const advance = (status: OrderStatus) => {
    dispatch({ type: 'order/setStatus', id: order.id, status, at: new Date().toISOString() })
    toast(`Pedido ${orderNumber(order.number)}: ${STATUS_LABEL[status].toLowerCase()}`)
  }

  return (
    <Drawer
      title={
        <>
          Pedido <span className="mono">{orderNumber(order.number)}</span>
        </>
      }
      subtitle={
        <>
          <StatusBadge status={order.status} /> <span>Realizado el {longDate(order.createdAt)}</span>
        </>
      }
      onClose={onClose}
    >
      {next.length > 0 && (
        <div className="drawer-actions">
          {next
            .filter((s) => s !== 'cancelado')
            .map((s) => (
              <button key={s} type="button" className="btn btn-primary" onClick={() => advance(s)}>
                {ACTION_LABEL[s]}
              </button>
            ))}
          {next.includes('cancelado') && (
            <ConfirmButton
              label="Cancelar pedido"
              question="¿Cancelar este pedido?"
              confirmLabel="Sí, cancelar"
              onConfirm={() => advance('cancelado')}
            />
          )}
        </div>
      )}

      <section className="drawer-section">
        <h3>Cliente</h3>
        {c ? (
          <div className="customer-box">
            <strong>{c.name}</strong>
            <span>
              <LuMail aria-hidden="true" /> {c.email}
            </span>
            <span>
              <LuMapPin aria-hidden="true" /> {c.city}, {c.country}
            </span>
          </div>
        ) : (
          <p className="muted">Cliente eliminado</p>
        )}
      </section>

      <section className="drawer-section">
        <h3>Artículos</h3>
        <table className="lines">
          <tbody>
            {order.items.map((it) => (
              <tr key={it.productId}>
                <td>
                  {it.name}
                  <div className="cell-sub num">
                    {integer(it.qty)} × {money(it.unitPrice)}
                  </div>
                </td>
                <td className="num">{money(it.qty * it.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Subtotal</th>
              <td className="num">{money(orderSubtotal(order))}</td>
            </tr>
            <tr>
              <th scope="row">Envío</th>
              <td className="num">{order.shipping ? money(order.shipping) : 'Gratis'}</td>
            </tr>
            <tr className="lines-total">
              <th scope="row">Total</th>
              <td className="num">{money(orderTotal(order))}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="drawer-section">
        <h3>Historial</h3>
        <ol className="timeline">
          {[...order.history].reverse().map((h, i) => {
            const Icon = STATUS_ICON[h.status]
            return (
              <li key={`${h.status}-${i}`} className={`tl-${h.status}`}>
                <span className="tl-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <strong>{STATUS_LABEL[h.status]}</strong>
                  <span className="cell-sub">{dateAndTime(h.at)}</span>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </Drawer>
  )
}
