import {
  addDays, dayOfWeek, daysInMonth, fromKey, monthDays, startOfMonth, startOfWeek, weekDays,
} from './dates.js'

/*
 Task shape:
 {
   id: string,
   title: string,
   notes: string,
   scope: 'day' | 'week' | 'month' | 'inbox',   // inbox: captured, not scheduled yet (date null)
   date: 'YYYY-MM-DD',      // day: the day (or first day of a repeat)
                            // week: first day of the week, month: first day of the month
   time: 'HH:MM' | '',      // day scope only
   remind: number | null,   // minutes before `time`; needs a time
   repeat: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly',  // day scope only
   list: string,            // id from LISTS
   goalId: string | null,   // goal this task counts toward
   target: number | null,   // repeating tasks: completions needed for the goal
   done: { [occurrenceKey]: true },  // occurrence key = the day (day) or `date` (week/month)
   link: string,            // optional URL
   checklist: [{ id, text }],
   checks: { [occurrenceKey]: [itemId] },  // ticked checklist items, per occurrence so repeats reset
   createdAt: number,
 }
*/

// Colours come from the byjessalyn palette (rose, blue, gold, brown scales).
export const LISTS = [
  { id: 'personal', label: 'Personal', color: '#cb7190' },
  { id: 'work',     label: 'Work',     color: '#3d6eb3' },
  { id: 'health',   label: 'Health',   color: '#9ab4d7' },
  { id: 'home',     label: 'Home',     color: '#cd9b4e' },
  { id: 'errands',  label: 'Errands',  color: '#916f5f' },
]

export const REPEATS = [
  { id: 'none',     label: 'Does not repeat' },
  { id: 'daily',    label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { id: 'weekly',   label: 'Every week' },
  { id: 'monthly',  label: 'Every month' },
]

export const REMINDERS = [
  { value: null, label: 'No reminder' },
  { value: 0,    label: 'At time of task' },
  { value: 5,    label: '5 min before' },
  { value: 15,   label: '15 min before' },
  { value: 30,   label: '30 min before' },
  { value: 60,   label: '1 hour before' },
  { value: 1440, label: '1 day before' },
]

export function listColor(id) {
  return (LISTS.find(l => l.id === id) || LISTS[0]).color
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function makeTask(fields) {
  return {
    id: newId(),
    title: '',
    notes: '',
    scope: 'day',
    date: null,
    time: '',
    remind: null,
    repeat: 'none',
    list: 'personal',
    goalId: null,           // links the task to a goal (see goals.js)
    link: '',
    checklist: [],
    checks: {},
    target: null,           // habits: how many completions count toward the goal
    done: {},
    createdAt: Date.now(),
    ...fields,
  }
}

// Does a day-scoped task have an occurrence on `key`?
export function occursOn(task, key) {
  if (task.scope !== 'day' || !task.date) return false
  if (key < task.date) return false
  switch (task.repeat) {
    case 'daily':    return true
    case 'weekdays': { const d = dayOfWeek(key); return d >= 1 && d <= 5 }
    case 'weekly':   return dayOfWeek(key) === dayOfWeek(task.date)
    case 'monthly': {
      // Repeats on the same day-of-month; clamps to the last day for short months.
      const start = fromKey(task.date).getDate()
      const d = fromKey(key)
      const last = daysInMonth(d.getFullYear(), d.getMonth())
      return d.getDate() === Math.min(start, last)
    }
    default:         return key === task.date
  }
}

export function isDone(task, occurrenceKey) {
  return !!task.done?.[occurrenceKey]
}

function byTime(a, b) {
  // Timed items first, in time order; untimed after, in creation order.
  if (a.task.time && b.task.time) return a.task.time.localeCompare(b.task.time)
  if (a.task.time) return -1
  if (b.task.time) return 1
  return a.task.createdAt - b.task.createdAt
}

// Occurrences for a single day: [{ task, key, done }]
export function itemsForDay(tasks, key) {
  return tasks
    .filter(t => occursOn(t, key))
    .map(t => ({ task: t, key, done: isDone(t, key) }))
    .sort(byTime)
}

export function goalsForWeek(tasks, weekStartKey) {
  return tasks
    .filter(t => t.scope === 'week' && t.date === weekStartKey)
    .map(t => ({ task: t, key: weekStartKey, done: isDone(t, weekStartKey) }))
}

export function goalsForMonth(tasks, monthKey) {
  return tasks
    .filter(t => t.scope === 'month' && t.date === monthKey)
    .map(t => ({ task: t, key: monthKey, done: isDone(t, monthKey) }))
}

// Unfinished one-off day tasks before `todayKey` (repeating tasks don't carry over).
export function overdueItems(tasks, todayKey, lookbackDays = 30) {
  const from = addDays(todayKey, -lookbackDays)
  return tasks
    .filter(t => t.scope === 'day' && t.repeat === 'none' && t.date < todayKey && t.date >= from && !isDone(t, t.date))
    .map(t => ({ task: t, key: t.date, done: false }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export function progress(items) {
  const total = items.length
  const done = items.filter(i => i.done).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

export function dayProgress(tasks, key) {
  return progress(itemsForDay(tasks, key))
}

// Week = every daily occurrence in the week + the week's goals.
export function weekProgress(tasks, weekStartKey) {
  const items = weekDays(weekStartKey).flatMap(k => itemsForDay(tasks, k))
  return progress([...items, ...goalsForWeek(tasks, weekStartKey)])
}

// Month = every daily occurrence in the month + the month's goals.
export function monthProgress(tasks, monthKey) {
  const items = monthDays(monthKey).flatMap(k => itemsForDay(tasks, k))
  return progress([...items, ...goalsForMonth(tasks, monthKey)])
}

export function toggleDone(task, occurrenceKey) {
  const done = { ...task.done }
  if (done[occurrenceKey]) delete done[occurrenceKey]
  else done[occurrenceKey] = true
  return { ...task, done }
}

// Normalise a task's `date` to the start of its scope period.
export function normaliseDate(scope, key, weekStartsOn) {
  if (scope === 'week') return startOfWeek(key, weekStartsOn)
  if (scope === 'month') return startOfMonth(key)
  return key
}

// ── Checklists ─────────────────────────────────────────
export function checklistProgress(task, key) {
  const items = task.checklist || []
  if (!items.length) return null
  const ticked = new Set(task.checks?.[key] || [])
  const done = items.filter(i => ticked.has(i.id)).length
  return { done, total: items.length }
}

export function isChecked(task, key, itemId) {
  return (task.checks?.[key] || []).includes(itemId)
}

// Ticking the last item also completes the task; unticking one reopens it.
export function toggleCheck(task, key, itemId) {
  const current = new Set(task.checks?.[key] || [])
  if (current.has(itemId)) current.delete(itemId)
  else current.add(itemId)
  const ids = (task.checklist || []).map(i => i.id).filter(id => current.has(id))
  const checks = { ...task.checks, [key]: ids }
  const allDone = ids.length === (task.checklist || []).length
  const done = { ...task.done }
  if (allDone) done[key] = true
  else delete done[key]
  return { ...task, checks, done }
}

export function inboxItems(tasks) {
  return tasks
    .filter(t => t.scope === 'inbox')
    .sort((a, b) => a.createdAt - b.createdAt)
}
