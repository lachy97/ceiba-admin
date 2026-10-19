const LOCALE = 'es-ES'

const eur = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', useGrouping: 'always' })
const eurCompact = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
})
const int = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0, useGrouping: 'always' })
const pct = new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const fullDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const money = (n: number) => eur.format(n)
export const moneyRound = (n: number) => eurCompact.format(n)
export const integer = (n: number) => int.format(n)
export const percent = (ratio: number) => pct.format(ratio)

export const shortDate = (iso: string | number) => dayMonth.format(new Date(iso)).replace('.', '')
export const longDate = (iso: string | number) => fullDate.format(new Date(iso)).replace('.', '')
export const dateAndTime = (iso: string | number) => dateTime.format(new Date(iso)).replace('.', '')

/** "+12,4 %" o "−3 %" para variaciones respecto al período anterior. */
export function signedPercent(ratio: number): string {
  const sign = ratio > 0 ? '+' : ratio < 0 ? '−' : ''
  return sign + pct.format(Math.abs(ratio)).replace(/ /g, ' ')
}

export const orderNumber = (n: number) => `#${n}`

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
