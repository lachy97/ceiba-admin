import { useEffect, useMemo, useState } from 'react'
import { LuFilterX, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import { useToast } from '../components/Toast'
import { ConfirmButton, EmptyState, PageHeader, Pagination, SearchField, Select, SortHeader, StockBadge } from '../components/ui'
import { CATEGORIES, type Category, type Product, type ProductStatus } from '../data/types'
import { integer, money, percent } from '../lib/format'
import { margin } from '../lib/stats'
import {
  DEFAULT_PRODUCT_QUERY,
  paginate,
  queryProducts,
  toggleSort,
  type ProductQuery,
  type ProductSortKey,
  type StockFilter,
} from '../lib/table'
import { useStore } from '../store/StoreContext'
import { ProductForm } from './ProductForm'

const PAGE_SIZE = 10

export function Products({ query: routeQuery }: { query: URLSearchParams }) {
  const { data, dispatch } = useStore()
  const toast = useToast()
  const [q, setQ] = useState<ProductQuery>(DEFAULT_PRODUCT_QUERY)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  // Permite enlazar a "#/productos?stock=bajo" desde el resumen.
  const stockParam = routeQuery.get('stock')
  useEffect(() => {
    if (stockParam === 'bajo' || stockParam === 'agotado') {
      setQ((cur) => ({ ...cur, stock: stockParam }))
      setPage(1)
    }
  }, [stockParam])

  const update = (patch: Partial<ProductQuery>) => {
    setQ((cur) => ({ ...cur, ...patch }))
    setPage(1)
  }

  const results = useMemo(() => queryProducts(data.products, q), [data.products, q])
  const current = paginate(results, page, PAGE_SIZE)
  const filtersOn = q.search || q.category !== 'todas' || q.status !== 'todos' || q.stock !== 'todos'
  const onSort = (k: ProductSortKey) => setQ((cur) => ({ ...cur, sort: toggleSort(cur.sort, k, k === 'name' || k === 'category' ? 'asc' : 'desc') }))

  const save = (p: Product) => {
    const isNew = !data.products.some((x) => x.id === p.id)
    dispatch({ type: 'product/save', product: p })
    setEditing(null)
    toast(isNew ? `Producto "${p.name}" creado` : 'Cambios guardados')
  }

  const remove = (p: Product) => {
    dispatch({ type: 'product/delete', id: p.id })
    toast(`Producto "${p.name}" eliminado`)
  }

  return (
    <div className="page">
      <PageHeader
        title="Productos"
        meta={
          <>
            <span className="num">{integer(data.products.length)}</span> productos en el catálogo
          </>
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <LuPlus aria-hidden="true" /> Nuevo producto
          </button>
        }
      />

      <section className="card card-flush">
        <div className="toolbar">
          <SearchField id="product-search" value={q.search} onChange={(search) => update({ search })} placeholder="Buscar por nombre o SKU" />
          <Select<Category | 'todas'>
            id="product-category"
            label="Categoría"
            value={q.category}
            onChange={(category) => update({ category })}
            options={[{ value: 'todas', label: 'Todas las categorías' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <Select<ProductStatus | 'todos'>
            id="product-status"
            label="Estado"
            value={q.status}
            onChange={(status) => update({ status })}
            options={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'activo', label: 'Activos' },
              { value: 'borrador', label: 'Borradores' },
            ]}
          />
          <Select<StockFilter>
            id="product-stock"
            label="Stock"
            value={q.stock}
            onChange={(stock) => update({ stock })}
            options={[
              { value: 'todos', label: 'Cualquier stock' },
              { value: 'bajo', label: 'Stock bajo (≤ 10)' },
              { value: 'agotado', label: 'Agotados' },
            ]}
          />
        </div>

        {results.length === 0 ? (
          <EmptyState title="Ningún producto coincide con los filtros">
            <button type="button" className="btn" onClick={() => update({ ...DEFAULT_PRODUCT_QUERY, sort: q.sort })}>
              <LuFilterX aria-hidden="true" /> Limpiar filtros
            </button>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <SortHeader label="Producto" sortKey="name" sort={q.sort} onSort={onSort} />
                  <SortHeader label="Categoría" sortKey="category" sort={q.sort} onSort={onSort} />
                  <SortHeader label="Precio" sortKey="price" sort={q.sort} onSort={onSort} align="right" />
                  <SortHeader label="Margen" sortKey="margin" sort={q.sort} onSort={onSort} align="right" />
                  <SortHeader label="Stock" sortKey="stock" sort={q.sort} onSort={onSort} align="right" />
                  <th scope="col">Estado</th>
                  <th scope="col" className="actions-col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-main">{p.name}</div>
                      <div className="cell-sub mono">{p.sku}</div>
                    </td>
                    <td>{p.category}</td>
                    <td className="num">{money(p.price)}</td>
                    <td className="num">{percent(margin(p))}</td>
                    <td className="num">
                      <StockBadge stock={p.stock} />
                    </td>
                    <td>
                      <span className={`pill ${p.status === 'activo' ? 'pill-on' : 'pill-off'}`}>
                        {p.status === 'activo' ? 'Activo' : 'Borrador'}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="icon-btn" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`} title="Editar">
                        <LuPencil aria-hidden="true" />
                      </button>
                      <ConfirmButton
                        label={`Eliminar ${p.name}`}
                        question="¿Eliminar?"
                        confirmLabel="Eliminar"
                        onConfirm={() => remove(p)}
                        icon={<LuTrash2 aria-hidden="true" />}
                        className="icon-btn icon-btn-danger"
                        iconOnly
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtersOn && results.length > 0 && (
          <p className="filter-note">
            <span className="num">{integer(results.length)}</span> resultados con los filtros actuales ·{' '}
            <button type="button" className="link-btn" onClick={() => update({ ...DEFAULT_PRODUCT_QUERY, sort: q.sort })}>
              Limpiar filtros
            </button>
          </p>
        )}
        <Pagination page={current} onPage={setPage} noun="productos" />
      </section>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          products={data.products}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
