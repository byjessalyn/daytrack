// Pure planning of which notifications should exist. Kept separate from the
// Capacitor plugin so it can be unit-tested.
import { addDays, atTime, formatTime, todayKey } from './dates.js'
import { itemsForDay } from './tasks.js'

// iOS keeps at most 64 pending local notifications per app.
export const IOS_PENDING_LIMIT = 64

export function planNotifications(tasks, settings, now = new Date(), horizonDays = 14) {
  const out = []
  const today = todayKey(now)

  for (let i = 0; i <= horizonDays; i++) {
    const key = addDays(today, i)
    const items = itemsForDay(tasks, key)
    const open = items.filter(it => !it.done)

    if (settings.morningSummary && settings.morningTime) {
      const at = atTime(key, settings.morningTime)
      if (at > now) {
        let body
        if (!items.length) body = 'Nothing planned yet. Open Daytrack to plan your day.'
        else {
          const first = open.find(it => it.task.time) || open[0]
          body = `${items.length} task${items.length === 1 ? '' : 's'} today.`
          if (first) body += ` First up: ${first.task.title}${first.task.time ? ` at ${formatTime(first.task.time)}` : ''}.`
        }
        out.push({ at, title: 'Good morning ☀️', body, date: key, kind: 'morning' })
      }
    }

    for (const it of open) {
      const t = it.task
      if (t.remind == null || !t.time) continue
      const at = new Date(atTime(key, t.time).getTime() - t.remind * 60000)
      if (at <= now) continue
      const when = t.remind === 0 ? 'Now' : `${formatTime(t.time)}`
      out.push({ at, title: t.title, body: `${when}${t.notes ? ' · ' + t.notes : ''}`, date: key, kind: 'task', taskId: t.id })
    }

    if (settings.eveningCheckin && settings.eveningTime && items.length) {
      const at = atTime(key, settings.eveningTime)
      if (at > now) {
        // Computed from the state at the time of scheduling; rescheduled on every change.
        const left = open.length
        const body = left
          ? `${items.length - left} of ${items.length} done. ${left} left. Finish one more or move it to tomorrow.`
          : `All ${items.length} done. Nice work. 🎉`
        out.push({ at, title: 'Evening check-in', body, date: key, kind: 'evening' })
      }
    }
  }

  out.sort((a, b) => a.at - b.at)
  return out.slice(0, IOS_PENDING_LIMIT).map((n, i) => ({ ...n, id: i + 1 }))
}
