// The data the iOS home-screen widget renders. The widget can't run JS, so the
// app precomputes a few days ahead; the widget picks the entry for "today" and
// keeps working across midnight even if the app isn't opened.
import { addDays, addMonths, startOfMonth, startOfWeek, todayKey } from './dates.js'
import { dayProgress, itemsForDay, listColor, monthProgress, weekProgress } from './tasks.js'

export const SNAPSHOT_VERSION = 1

export function buildSnapshot(tasks, settings, now = new Date(), daysAhead = 7) {
  const today = todayKey(now)
  const ws = settings.weekStartsOn ?? 1

  const days = []
  for (let i = 0; i <= daysAhead; i++) {
    const key = addDays(today, i)
    const p = dayProgress(tasks, key)
    const items = itemsForDay(tasks, key).slice(0, 8).map(it => ({
      title: it.task.title,
      time: it.task.time || '',
      done: it.done,
      color: listColor(it.task.list),
    }))
    days.push({ date: key, done: p.done, total: p.total, items })
  }

  const thisWeek = startOfWeek(today, ws)
  const weeks = [thisWeek, addDays(thisWeek, 7)].map(start => {
    const p = weekProgress(tasks, start)
    return { start, end: addDays(start, 6), done: p.done, total: p.total }
  })

  const thisMonth = startOfMonth(today)
  const months = [thisMonth, addMonths(thisMonth, 1)].map(m => {
    const p = monthProgress(tasks, m)
    return { month: m.slice(0, 7), done: p.done, total: p.total }
  })

  return { version: SNAPSHOT_VERSION, generatedAt: now.toISOString(), days, weeks, months }
}
