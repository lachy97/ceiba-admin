import { useMemo, useState } from 'react'
import { Drawer, EmptyState, PageHeader, Pagination, SearchField, SortHeader, StatusBadge } from '../components/ui'
import type { Customer } from '../data/types'
import { initials, integer, longDate, money, orderNumber, shortDate } from '../lib/format'
import { customerStats, orderTotal, type CustomerStats } from '../lib/stats'
import { normalize, paginate, sortBy, toggleSort, type Sort } from '../lib/table'
import { useStore } from '../store/StoreContext'

const PAGE_SIZE = 12
type CustomerSortKey = 'name' | 'orders' | 'spent' | 'last'

const EMPTY_STATS: CustomerStats = { orders: 0, spent: 0, lastOrderAt: null }

export function Customers() {
  const { data } = useStore()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort<CustomerSortKey>>({ key: 'spent', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<Customer | null>(null)

  const stats = useMemo(() => customerStats(data.orders), [data.orders])
  const rows = useMemo(() => {
    const term = normalize(search)
    const filtered = data.customers.filter((c) => !term || normalize(`${c.name} ${c.email} ${c.city} ${c.country}`).includes(term))
    const get = {
      name: (c: Customer) => c.name,
      orders: (c: Customer) => stats.get(c.id)?.orders ?? 0,
      spent: (c: Customer) => stats.get(c.id)?.spent ?? 0,
      last: (c: Customer) => stats.get(c.id)?.lastOrderAt ?? '',
    }[sort.key]
    return sortBy(filtered, get, sort.dir)
  }, [data.customers, search, sort, stats])

  const current = paginate(rows, page, PAGE_SIZE)
  const onSort = (k: CustomerSortKey) => setSort((s) => toggleSort(s, k, k === 'name' ? 'asc' : 'desc'))
  const withOrders = data.customers.filter((c) => stats.has(c.id)).length

  return (
    <div className="page">
      <PageHeader
        title="Clientes"
        meta={
          <>
            <span className="num">{integer(data.customers.length)}</span> clientes registrados ·{' '}
            <span className="num">{integer(withOrders)}</span> con al menos un pedido
          </>
        }
      />

      <section className="card card-flush">
        <div className="toolbar">
          <SearchField
            id="customer-search"
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Buscar por nombre, email o ciudad"
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Ningún cliente coincide con la búsqueda" />
        ) : (
          <div className="table-wrap">
            <table className="table table-click">
              <thead>
                <tr>
                  <SortHeader label="Cliente" sortKey="name" sort={sort} onSort={onSort} />
                  <th scope="col">Ubicación</th>
                  <SortHeader label="Pedidos" sortKey="orders" sort={sort} onSort={onSort} align="right" />
                  <SortHeader label="Total gastado" sortKey="spent" sort={sort} onSort={onSort} align="right" />
                  <SortHeader label="Último pedido" sortKey="last" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody>
                {current.items.map((c) => {
                  const s = stats.get(c.id) ?? EMPTY_STATS
                  return (
                    <tr key={c.id} onClick={() => setOpen(c)}>
                      <td>
                        <button type="button" className="person" onClick={(e) => { e.stopPropagation(); setOpen(c) }}>
                          <span className="avatar" aria-hidden="true">
                            {initials(c.name)}
                          </span>
                          <span>
                            <span className="cell-main">{c.name}</span>
                            <span className="cell-sub">{c.email}</span>
                          </span>
                        </button>
                      </td>
                      <td>
                        {c.city}, {c.country}
                      </td>
                      <td className="num">{integer(s.orders)}</td>
                      <td className="num">{money(s.spent)}</td>
                      <td className="nowrap">{s.lastOrderAt ? shortDate(s.lastOrderAt) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} onPage={setPage} noun="clientes" />
      </section>

      {open && <CustomerDrawer customer={open} stats={stats.get(open.id) ?? EMPTY_STATS} onClose={() => setOpen(null)} />}
    </div>
  )
}

function CustomerDrawer({ customer, stats, onClose }: { customer: Customer; stats: CustomerStats; onClose: () => void }) {
  const { data } = useStore()
  const orders = data.orders.filter((o) => o.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <Drawer title={customer.name} subtitle={<span>Cliente desde el {longDate(customer.createdAt)}</span>} onClose={onClose}>
      <section className="drawer-section">
        <div className="stat-row">
          <div>
            <span className="stat-label">Pedidos</span>
            <strong className="num">{integer(stats.orders)}</strong>
          </div>
          <div>
            <span className="stat-label">Total gastado</span>
            <strong className="num">{money(stats.spent)}</strong>
          </div>
          <div>
            <span className="stat-label">Ticket medio</span>
            <strong className="num">{money(stats.orders ? stats.spent / stats.orders : 0)}</strong>
          </div>
        </div>
        <div className="customer-box">
          <span>{customer.email}</span>
          <span>
            {customer.city}, {customer.country}
          </span>
        </div>
      </section>
      <section className="drawer-section">
        <h3>Pedidos</h3>
        {orders.length === 0 ? (
          <p className="muted">Este cliente todavía no ha hecho ningún pedido.</p>
        ) : (
          <ul className="mini-list">
            {orders.map((o) => (
              <li key={o.id}>
                <a className="mini-link" href={`#/pedidos/${o.number}`}>
                  <div>
                    <span className="mini-title mono">{orderNumber(o.number)}</span>
                    <span className="mini-sub">
                      {shortDate(o.createdAt)} · <span className="num">{money(orderTotal(o))}</span>
                    </span>
                  </div>
                  <StatusBadge status={o.status} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Drawer>
  )
}
