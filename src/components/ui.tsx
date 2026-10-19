import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { LuArrowDown, LuArrowUp, LuChevronLeft, LuChevronRight, LuChevronsUpDown, LuSearch, LuX } from 'react-icons/lu'
import type { OrderStatus } from '../data/types'
import { STATUS_LABEL } from '../lib/orderFlow'
import { stockLevel } from '../lib/stats'
import type { Page, Sort } from '../lib/table'

/* ---------- Badges ---------- */

const STATUS_TONE: Record<OrderStatus, string> = {
  pendiente: 'warn',
  pagado: 'info',
  enviado: 'accent',
  entregado: 'ok',
  cancelado: 'muted',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge tone-${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
}

export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock)
  const tone = level === 'agotado' ? 'bad' : level === 'bajo' ? 'warn' : 'neutral'
  const label = level === 'agotado' ? 'Agotado' : `${stock} u.`
  return <span className={`badge tone-${tone} num`}>{label}</span>
}

/* ---------- Campos ---------- */

export function SearchField({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  id: string
}) {
  return (
    <div className="search">
      <LuSearch aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="icon-btn" onClick={() => onChange('')} aria-label="Borrar búsqueda">
          <LuX aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export function Select<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="select" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Tablas ---------- */

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
}: {
  label: string
  sortKey: K
  sort: Sort<K>
  onSort: (k: K) => void
  align?: 'left' | 'right'
}) {
  const active = sort.key === sortKey
  const Icon = !active ? LuChevronsUpDown : sort.dir === 'asc' ? LuArrowUp : LuArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={align === 'right' ? 'num' : ''}
    >
      <button type="button" className={`th-sort${active ? ' is-active' : ''}`} onClick={() => onSort(sortKey)}>
        {label}
        <Icon aria-hidden="true" />
      </button>
    </th>
  )
}

export function Pagination<T>({ page, onPage, noun }: { page: Page<T>; onPage: (p: number) => void; noun: string }) {
  if (page.total === 0) return null
  const numbers = pageNumbers(page.page, page.pages)
  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="pagination-info num">
        {page.from}–{page.to} de {page.total} {noun}
      </span>
      <div className="pagination-pages">
        <button
          type="button"
          className="icon-btn"
          disabled={page.page === 1}
          onClick={() => onPage(page.page - 1)}
          aria-label="Página anterior"
        >
          <LuChevronLeft aria-hidden="true" />
        </button>
        {numbers.map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="pagination-gap">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`page-btn num${n === page.page ? ' is-on' : ''}`}
              aria-current={n === page.page ? 'page' : undefined}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          className="icon-btn"
          disabled={page.page === page.pages}
          onClick={() => onPage(page.page + 1)}
          aria-label="Página siguiente"
        >
          <LuChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export function pageNumbers(current: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const set = new Set([1, pages, current - 1, current, current + 1])
  const list = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

/* ---------- Confirmación en línea (sin diálogos del navegador) ---------- */

export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
  icon,
  className = 'btn btn-ghost-danger',
  iconOnly = false,
}: {
  label: string
  question: string
  confirmLabel: string
  onConfirm: () => void
  icon?: ReactNode
  className?: string
  iconOnly?: boolean
}) {
  const [asking, setAsking] = useState(false)
  const yesRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (asking) yesRef.current?.focus()
  }, [asking])

  if (!asking) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => setAsking(true)}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
      >
        {icon}
        {!iconOnly && label}
      </button>
    )
  }
  return (
    <span className="confirm" role="group" aria-label={question}>
      <span className="confirm-q">{question}</span>
      <button ref={yesRef} type="button" className="btn btn-danger btn-sm" onClick={() => { setAsking(false); onConfirm() }}>
        {confirmLabel}
      </button>
      <button type="button" className="btn btn-sm" onClick={() => setAsking(false)}>
        No
      </button>
    </span>
  )
}

/* ---------- Modal y panel lateral ---------- */

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

function useFocusOnOpen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.icon-btn)')
    ;(first ?? ref.current)?.focus()
    return () => previous?.focus?.()
  }, [])
  return ref
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()
  const ref = useFocusOnOpen<HTMLDivElement>()
  useEscape(onClose)
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <LuX aria-hidden="true" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const ref = useFocusOnOpen<HTMLElement>()
  useEscape(onClose)
  return (
    <div className="overlay overlay-drawer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <header className="drawer-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <div className="drawer-sub">{subtitle}</div>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar panel">
            <LuX aria-hidden="true" />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}

export function PageHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {meta && <p className="page-meta">{meta}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}
