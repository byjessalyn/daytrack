import { describe, expect, it } from 'vitest'
import { checklistProgress, inboxItems, itemsForDay, makeTask, overdueItems, toggleCheck } from '../src/lib/tasks.js'
import { AFFIRMATIONS, affirmationFor, average, checkinStreak, needsSupport, recentCheckins } from '../src/lib/checkins.js'
import { planNotifications } from '../src/lib/schedule.js'

const items = [{ id: 'a', text: 'Passport' }, { id: 'b', text: 'Charger' }]

describe('checklists', () => {
  it('tracks ticks per occurrence, so repeating checklists reset each day', () => {
    let t = makeTask({ title: 'Morning routine', date: '2026-10-12', repeat: 'daily', checklist: items })
    t = toggleCheck(t, '2026-10-16', 'a')
    expect(checklistProgress(t, '2026-10-16')).toEqual({ done: 1, total: 2 })
    expect(checklistProgress(t, '2026-10-17')).toEqual({ done: 0, total: 2 })
  })
  it('completes the task when every item is ticked and reopens it when one is unticked', () => {
    let t = makeTask({ title: 'Pack', date: '2026-10-16', checklist: items })
    t = toggleCheck(toggleCheck(t, '2026-10-16', 'a'), '2026-10-16', 'b')
    expect(t.done['2026-10-16']).toBe(true)
    t = toggleCheck(t, '2026-10-16', 'b')
    expect(t.done['2026-10-16']).toBeUndefined()
  })
  it('ignores ticks for items that were deleted', () => {
    let t = makeTask({ title: 'Pack', date: '2026-10-16', checklist: items })
    t = toggleCheck(t, '2026-10-16', 'a')
    t = { ...t, checklist: [items[1]] }
    expect(checklistProgress(t, '2026-10-16')).toEqual({ done: 0, total: 1 })
  })
  it('returns null for tasks without a checklist', () => {
    expect(checklistProgress(makeTask({ title: 'x' }), '2026-10-16')).toBeNull()
  })
})

describe('inbox', () => {
  const inbox = makeTask({ title: 'Call dentist', scope: 'inbox', date: null })
  it('lists inbox items and keeps them out of days, overdue and reminders', () => {
    expect(inboxItems([inbox]).map(t => t.title)).toEqual(['Call dentist'])
    expect(itemsForDay([inbox], '2026-10-16')).toEqual([])
    expect(overdueItems([inbox], '2026-10-16')).toEqual([])
    const plan = planNotifications([inbox], { morningSummary: false, eveningCheckin: false }, new Date(2026, 9, 16, 8), 3)
    expect(plan).toEqual([])
  })
})

describe('check-ins', () => {
  const c = (mood, stress = 2) => ({ mood, energy: 3, stress, sleep: 3, feelings: [] })
  it('counts a streak back from today, or from yesterday if today is not done yet', () => {
    const data = { '2026-10-14': c(4), '2026-10-15': c(4) }
    expect(checkinStreak(data, '2026-10-16')).toBe(2)
    expect(checkinStreak({ ...data, '2026-10-16': c(3) }, '2026-10-16')).toBe(3)
    expect(checkinStreak({ '2026-10-13': c(4) }, '2026-10-16')).toBe(0)
  })
  it('suggests support after 3 hard days within a week, not for older ones', () => {
    expect(needsSupport({ '2026-10-14': c(2), '2026-10-15': c(1), '2026-10-16': c(4, 5) }, '2026-10-16')).toBe(true)
    expect(needsSupport({ '2026-10-14': c(2), '2026-10-15': c(1), '2026-10-16': c(4) }, '2026-10-16')).toBe(false)
    expect(needsSupport({ '2026-10-01': c(1), '2026-10-02': c(1), '2026-10-03': c(1) }, '2026-10-16')).toBe(false)
  })
  it('averages only recorded values and returns 14 days oldest first', () => {
    const days = recentCheckins({ '2026-10-16': c(5), '2026-10-10': c(3) }, '2026-10-16')
    expect(days).toHaveLength(14)
    expect(days[0].key).toBe('2026-10-03')
    expect(average(days.map(d => d.entry), 'mood')).toBe(4)
  })
  it('picks a stable affirmation per day that changes day to day', () => {
    expect(affirmationFor('2026-10-16')).toBe(affirmationFor('2026-10-16'))
    expect(affirmationFor('2026-10-16')).not.toBe(affirmationFor('2026-10-17'))
    expect(AFFIRMATIONS).toContain(affirmationFor('2026-12-31'))
  })
})
