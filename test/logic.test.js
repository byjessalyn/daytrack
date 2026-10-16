import { describe, expect, it } from 'vitest'
import { addDays, startOfWeek, monthDays, addMonths } from '../src/lib/dates.js'
import {
  makeTask, occursOn, itemsForDay, dayProgress, weekProgress, monthProgress,
  overdueItems, toggleDone, normaliseDate,
} from '../src/lib/tasks.js'
import { planNotifications, IOS_PENDING_LIMIT } from '../src/lib/schedule.js'
import { buildSnapshot } from '../src/lib/snapshot.js'

const t = (f) => makeTask({ title: 'x', ...f })

describe('dates', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01')
  })
  it('survives DST changes', () => {
    // US DST starts 2026-03-08; key math must not skip or repeat a day.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
  })
  it('finds week start for Monday and Sunday weeks', () => {
    // 2026-10-16 is a Friday
    expect(startOfWeek('2026-10-16', 1)).toBe('2026-10-12')
    expect(startOfWeek('2026-10-16', 0)).toBe('2026-10-11')
    expect(startOfWeek('2026-10-12', 1)).toBe('2026-10-12')
  })
  it('lists month days', () => {
    expect(monthDays('2028-02-01')).toHaveLength(29)
  })
})

describe('recurrence', () => {
  it('one-off', () => {
    const task = t({ date: '2026-10-16' })
    expect(occursOn(task, '2026-10-16')).toBe(true)
    expect(occursOn(task, '2026-10-17')).toBe(false)
  })
  it('never occurs before the start date', () => {
    expect(occursOn(t({ date: '2026-10-16', repeat: 'daily' }), '2026-10-15')).toBe(false)
  })
  it('weekdays', () => {
    const task = t({ date: '2026-10-12', repeat: 'weekdays' })
    expect(occursOn(task, '2026-10-16')).toBe(true)  // Fri
    expect(occursOn(task, '2026-10-17')).toBe(false) // Sat
    expect(occursOn(task, '2026-10-19')).toBe(true)  // Mon
  })
  it('weekly', () => {
    const task = t({ date: '2026-10-16', repeat: 'weekly' })
    expect(occursOn(task, '2026-10-23')).toBe(true)
    expect(occursOn(task, '2026-10-22')).toBe(false)
  })
  it('monthly clamps to short months', () => {
    const task = t({ date: '2026-01-31', repeat: 'monthly' })
    expect(occursOn(task, '2026-02-28')).toBe(true)
    expect(occursOn(task, '2026-04-30')).toBe(true)
    expect(occursOn(task, '2026-04-29')).toBe(false)
    expect(occursOn(task, '2026-05-31')).toBe(true)
  })
  it('week/month goals never appear as day items', () => {
    expect(occursOn(t({ scope: 'week', date: '2026-10-12' }), '2026-10-12')).toBe(false)
  })
})

describe('progress', () => {
  const daily = t({ date: '2026-10-12', repeat: 'daily' })
  const once = t({ date: '2026-10-16', time: '09:00' })
  const goal = t({ scope: 'week', date: '2026-10-12' })
  const mgoal = t({ scope: 'month', date: '2026-10-01' })

  it('tracks completion per occurrence for repeating tasks', () => {
    const d = toggleDone(daily, '2026-10-14')
    expect(dayProgress([d], '2026-10-14')).toEqual({ done: 1, total: 1, pct: 100 })
    expect(dayProgress([d], '2026-10-15')).toEqual({ done: 0, total: 1, pct: 0 })
    expect(toggleDone(d, '2026-10-14').done).toEqual({})
  })
  it('sorts timed items first', () => {
    const untimed = t({ date: '2026-10-16', createdAt: 1 })
    const items = itemsForDay([untimed, daily, once], '2026-10-16')
    expect(items[0].task).toBe(once)
  })
  it('week = 7 daily occurrences + goals', () => {
    const p = weekProgress([daily, once, toggleDone(goal, '2026-10-12')], '2026-10-12')
    expect(p.total).toBe(9)
    expect(p.done).toBe(1)
  })
  it('month counts days in month + month goals', () => {
    // daily starts Oct 12 → 20 occurrences in October, + once + month goal
    const p = monthProgress([daily, once, mgoal], '2026-10-01')
    expect(p.total).toBe(22)
  })
  it('empty is 0%, not NaN', () => {
    expect(dayProgress([], '2026-10-16').pct).toBe(0)
  })
  it('normalises goal dates to period start', () => {
    expect(normaliseDate('week', '2026-10-16', 1)).toBe('2026-10-12')
    expect(normaliseDate('month', '2026-10-16', 1)).toBe('2026-10-01')
    expect(normaliseDate('day', '2026-10-16', 1)).toBe('2026-10-16')
  })
})

describe('overdue', () => {
  it('only includes unfinished one-off past tasks', () => {
    const late = t({ date: '2026-10-14' })
    const doneLate = toggleDone(t({ date: '2026-10-13' }), '2026-10-13')
    const rep = t({ date: '2026-10-01', repeat: 'daily' })
    const future = t({ date: '2026-10-20' })
    const items = overdueItems([late, doneLate, rep, future], '2026-10-16')
    expect(items.map(i => i.task)).toEqual([late])
  })
})

describe('notifications plan', () => {
  const settings = { morningSummary: true, morningTime: '08:00', eveningCheckin: true, eveningTime: '20:00' }
  const now = new Date(2026, 9, 16, 10, 0) // Fri 10:00

  it('schedules task reminders with offset and skips past ones', () => {
    const past = t({ title: 'past', date: '2026-10-16', time: '09:00', remind: 0 })
    const soon = t({ title: 'soon', date: '2026-10-16', time: '11:00', remind: 15 })
    const plan = planNotifications([past, soon], settings, now, 0)
    const task = plan.filter(n => n.kind === 'task')
    expect(task.map(n => n.title)).toEqual(['soon'])
    expect(task[0].at).toEqual(new Date(2026, 9, 16, 10, 45))
    // morning already passed today; evening still ahead
    expect(plan.map(n => n.kind)).toEqual(['task', 'evening'])
  })
  it('no reminder for done tasks or tasks without time', () => {
    const done = toggleDone(t({ date: '2026-10-16', time: '11:00', remind: 0 }), '2026-10-16')
    const noTime = t({ date: '2026-10-16', remind: 0 })
    const plan = planNotifications([done, noTime], { ...settings, eveningCheckin: false }, now, 0)
    expect(plan).toEqual([])
  })
  it('stays under the iOS pending limit with unique ids', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      t({ date: '2026-10-16', time: `1${i % 10}:30`, remind: 0, repeat: 'daily' }))
    const plan = planNotifications(many, settings, now, 14)
    expect(plan.length).toBe(IOS_PENDING_LIMIT)
    expect(new Set(plan.map(n => n.id)).size).toBe(plan.length)
    // soonest first, so trimming drops the far future
    expect(plan[0].at <= plan[plan.length - 1].at).toBe(true)
  })
  it('morning summary names the first timed task', () => {
    const task = t({ title: 'Dentist', date: '2026-10-17', time: '09:30' })
    const plan = planNotifications([task], { ...settings, eveningCheckin: false }, now, 1)
    const m = plan.find(n => n.kind === 'morning' && n.date === '2026-10-17')
    expect(m.body).toContain('1 task today')
    expect(m.body).toContain('Dentist')
  })
})

describe('widget snapshot', () => {
  it('contains today + 7 days, 2 weeks, 2 months', () => {
    const now = new Date(2026, 9, 16, 10, 0)
    const task = t({ title: 'Gym', date: '2026-10-16', time: '18:00', repeat: 'daily' })
    const s = buildSnapshot([toggleDone(task, '2026-10-16')], { weekStartsOn: 1 }, now)
    expect(s.days).toHaveLength(8)
    expect(s.days[0]).toMatchObject({ date: '2026-10-16', done: 1, total: 1 })
    expect(s.days[0].items[0]).toMatchObject({ title: 'Gym', time: '18:00', done: true })
    expect(s.weeks[0]).toMatchObject({ start: '2026-10-12', end: '2026-10-18', done: 1, total: 3 })
    expect(s.months.map(m => m.month)).toEqual(['2026-10', '2026-11'])
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})
