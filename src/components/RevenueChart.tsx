import { useMemo, useState, type PointerEvent } from 'react'
import { useElementWidth } from '../hooks/useElementWidth'
import { integer, money, moneyRound, shortDate } from '../lib/format'
import { niceTicks, type DayPoint } from '../lib/stats'

const HEIGHT = 240
const PAD = { top: 16, right: 12, bottom: 28, left: 56 }

/** Gráfico de área de ingresos diarios, dibujado en SVG sin librerías. */
export function RevenueChart({ points }: { points: DayPoint[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>(640)
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    const innerW = Math.max(10, width - PAD.left - PAD.right)
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const max = Math.max(1, ...points.map((p) => p.revenue))
    const ticks = niceTicks(max, 4)
    const top = ticks[ticks.length - 1] || 1
    const step = points.length > 1 ? innerW / (points.length - 1) : 0
    const x = (i: number) => PAD.left + i * step
    const y = (v: number) => PAD.top + innerH - (v / top) * innerH
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join('')
    const area = `${line}L${x(points.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
    const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 64))))
    return { innerW, innerH, ticks, x, y, line, area, step, labelEvery }
  }, [points, width])

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = geo.step ? Math.round(px / geo.step) : 0
    setHover(Math.min(points.length - 1, Math.max(0, i)))
  }

  const h = hover !== null ? points[hover] : null
  const total = points.reduce((s, p) => s + p.revenue, 0)

  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Ingresos diarios de los últimos ${points.length} días: ${money(total)} en total`}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="chart-grad-top" />
            <stop offset="100%" className="chart-grad-bottom" />
          </linearGradient>
        </defs>
        {geo.ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={geo.y(t)} y2={geo.y(t)} />
            <text className="chart-axis" x={PAD.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end">
              {moneyRound(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const last = points.length - 1
          // Etiqueta cada N días y siempre el último ("Hoy"), sin que se solapen.
          const show = i === last || (i % geo.labelEvery === 0 && last - i >= geo.labelEvery * 0.75)
          return show ? (
            <text
              key={p.day}
              className="chart-axis"
              x={geo.x(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            >
              {i === last ? 'Hoy' : shortDate(p.day)}
            </text>
          ) : null
        })}
        <path className="chart-area" d={geo.area} fill="url(#rev-fill)" />
        <path className="chart-line" d={geo.line} />
        {points.length > 0 && (
          <circle
            className="chart-end"
            cx={geo.x(points.length - 1)}
            cy={geo.y(points[points.length - 1].revenue)}
            r={4}
          />
        )}
        {h && hover !== null && (
          <g>
            <line className="chart-hover" x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.top} y2={PAD.top + geo.innerH} />
            <circle className="chart-dot" cx={geo.x(hover)} cy={geo.y(h.revenue)} r={5} />
          </g>
        )}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={geo.innerW}
          height={geo.innerH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {h && hover !== null && (
        <div
          className="chart-tip"
          style={{
            left: Math.min(Math.max(geo.x(hover), 80), width - 80),
            top: Math.max(0, geo.y(h.revenue) - 64),
          }}
        >
          <strong className="num">{money(h.revenue)}</strong>
          <span>
            {shortDate(h.day)} · {integer(h.orders)} {h.orders === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
      )}
    </div>
  )
}
