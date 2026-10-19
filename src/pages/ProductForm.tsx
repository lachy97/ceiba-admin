import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/ui'
import { CATEGORIES, type Category, type Product } from '../data/types'
import { percent } from '../lib/format'
import {
  draftToProduct,
  emptyDraft,
  hasErrors,
  parseDecimal,
  productToDraft,
  suggestSku,
  validateProduct,
  type ProductDraft,
  type ProductErrors,
} from '../lib/validation'
import { newProductId } from '../store/reducer'

export function ProductForm({
  product,
  products,
  onSave,
  onClose,
}: {
  product: Product | null
  products: Product[]
  onSave: (p: Product) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<ProductDraft>(() => (product ? productToDraft(product) : emptyDraft()))
  const [touched, setTouched] = useState<Partial<Record<keyof ProductDraft, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  // El SKU se propone automáticamente hasta que el usuario lo escribe a mano.
  const [skuAuto, setSkuAuto] = useState(!product)

  const errors: ProductErrors = useMemo(() => validateProduct(draft, products, product?.id), [draft, products, product])
  const show = (k: keyof ProductDraft) => (submitted || touched[k] ? errors[k] : undefined)

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const blur = (k: keyof ProductDraft) => setTouched((t) => ({ ...t, [k]: true }))

  const onCategory = (c: Category | '') => {
    setDraft((d) => ({
      ...d,
      category: c,
      sku: c && (skuAuto || !d.sku) ? suggestSku(c, products) : d.sku,
    }))
  }

  const price = parseDecimal(draft.price)
  const cost = parseDecimal(draft.cost)
  const marginPreview = price > 0 && cost >= 0 && cost <= price ? (price - cost) / price : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors(errors)) return
    const base = product ?? { id: newProductId(products), createdAt: new Date().toISOString() }
    onSave(draftToProduct(draft, base))
  }

  const field = (k: keyof ProductDraft) => ({
    id: `pf-${k}`,
    'aria-invalid': show(k) ? true : undefined,
    'aria-describedby': show(k) ? `pf-${k}-err` : undefined,
    onBlur: () => blur(k),
  })
  const err = (k: keyof ProductDraft) =>
    show(k) ? (
      <p className="field-error" id={`pf-${k}-err`}>
        {show(k)}
      </p>
    ) : null

  return (
    <Modal
      title={product ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="product-form" className="btn btn-primary">
            {product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </>
      }
    >
      <form id="product-form" className="form" onSubmit={submit} noValidate>
        <div className="field span-2">
          <label htmlFor="pf-name">Nombre</label>
          <input {...field('name')} value={draft.name} onChange={(e) => set('name', e.target.value)} maxLength={90} />
          {err('name')}
        </div>

        <div className="field">
          <label htmlFor="pf-category">Categoría</label>
          <select {...field('category')} value={draft.category} onChange={(e) => onCategory(e.target.value as Category | '')}>
            <option value="">Elige una categoría</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {err('category')}
        </div>

        <div className="field">
          <label htmlFor="pf-sku">SKU</label>
          <input
            {...field('sku')}
            className="mono"
            value={draft.sku}
            placeholder="CAF-007"
            onChange={(e) => {
              setSkuAuto(false)
              set('sku', e.target.value.toUpperCase())
            }}
            maxLength={7}
          />
          {err('sku')}
        </div>

        <div className="field">
          <label htmlFor="pf-price">Precio de venta (€)</label>
          <input {...field('price')} inputMode="decimal" value={draft.price} placeholder="12,50" onChange={(e) => set('price', e.target.value)} />
          {err('price')}
        </div>

        <div className="field">
          <label htmlFor="pf-cost">Coste unitario (€)</label>
          <input {...field('cost')} inputMode="decimal" value={draft.cost} placeholder="5,20" onChange={(e) => set('cost', e.target.value)} />
          {err('cost')}
          {!show('cost') && marginPreview !== null && (
            <p className="field-hint">
              Margen bruto: <strong className="num">{percent(marginPreview)}</strong>
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="pf-stock">Stock (unidades)</label>
          <input {...field('stock')} inputMode="numeric" value={draft.stock} placeholder="0" onChange={(e) => set('stock', e.target.value)} />
          {err('stock')}
        </div>

        <fieldset className="field">
          <legend>Estado</legend>
          <div className="radio-row">
            <label className="radio">
              <input type="radio" name="pf-status" id="pf-status-activo" checked={draft.status === 'activo'} onChange={() => set('status', 'activo')} />
              Activo
            </label>
            <label className="radio">
              <input type="radio" name="pf-status" id="pf-status-borrador" checked={draft.status === 'borrador'} onChange={() => set('status', 'borrador')} />
              Borrador
            </label>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
