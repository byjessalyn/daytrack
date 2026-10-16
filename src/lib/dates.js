// All dates in the app are local-time "YYYY-MM-DD" strings ("keys").
// Working with keys instead of Date objects avoids timezone/DST drift.

const pad = (n) => String(n).padStart(2, '0')

export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(now = new Date()) {
  return toKey(now)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function addMonths(key, n) {
  const d = fromKey(key)
  return toKey(new Date(d.getFullYear(), d.getMonth() + n, 1))
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// weekStartsOn: 0 = Sunday, 1 = Monday
export function startOfWeek(key, weekStartsOn = 1) {
  const d = fromKey(key)
  const diff = (d.getDay() - weekStartsOn + 7) % 7
  return addDays(key, -diff)
}

export function weekDays(weekStartKey) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartKey, i))
}

export function startOfMonth(key) {
  return key.slice(0, 8) + '01'
}

export function monthDays(monthKey) {
  const d = fromKey(monthKey)
  const n = daysInMonth(d.getFullYear(), d.getMonth())
  return Array.from({ length: n }, (_, i) => addDays(monthKey, i))
}

export function dayOfWeek(key) {
  return fromKey(key).getDay()
}

export function diffDays(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000)
}

export function formatDay(key, opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return fromKey(key).toLocaleDateString(undefined, opts)
}

export function formatMonth(key) {
  return fromKey(key).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatWeek(weekStartKey) {
  const end = addDays(weekStartKey, 6)
  const a = fromKey(weekStartKey)
  const b = fromKey(end)
  const sameMonth = a.getMonth() === b.getMonth()
  const left = a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const right = b.toLocaleDateString(undefined, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${left} – ${right}`
}

export function formatTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// Date at a given day key + "HH:MM", in local time.
export function atTime(key, hhmm) {
  const d = fromKey(key)
  const [h, m] = (hhmm || '00:00').split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}
