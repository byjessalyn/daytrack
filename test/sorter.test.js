import { describe, expect, it } from 'vitest'
import { buildSortPrompt, normaliseProposals, resize, splitToInbox } from '../src/lib/sorter.js'

const today = '2026-10-16'
const goals = [{ id: 'g1', title: 'Launch sticker shop' }]

describe('sort prompt', () => {
  it('includes the date, the effort rules, existing goals and the text', () => {
    const p = buildSortPrompt('call mom', { today, weekStartsOn: 1, goals })
    expect(p).toContain('Friday 2026-10-16')
    expect(p).toContain('"week" task')
    expect(p).toContain('"Launch sticker shop"')
    expect(p).toContain('call mom')
  })
})

describe('normaliseProposals', () => {
  it('keeps valid tasks and fixes or drops bad fields', () => {
    const out = normaliseProposals([
      { type: 'task', title: '  Call   the dentist ', scope: 'day', date: '2026-10-17', time: '9:00', repeat: 'none', list: 'health' },
      { type: 'task', title: 'Finish deck', scope: 'week', date: 'next week', list: 'work' },
      { type: 'task', title: 'Old', scope: 'day', date: '2026-10-01', list: 'nope', repeat: 'hourly' },
      { type: 'task', title: 'Bad date', scope: 'month', date: '2026-02-31' },
      { title: '' }, null, 'string',
    ], { today, goals })
    expect(out.map(p => p.title)).toEqual(['Call the dentist', 'Finish deck', 'Old', 'Bad date'])
    expect(out[0]).toMatchObject({ scope: 'day', date: '2026-10-17', time: '', list: 'health' }) // 9:00 is not HH:MM
    expect(out[1]).toMatchObject({ scope: 'week', date: today, list: 'work' })
    expect(out[2]).toMatchObject({ date: today, list: 'personal', repeat: 'none' }) // past day moves to today
    expect(out[3].date).toBe(today)
  })
  it('only allows repeats and times on day tasks', () => {
    const [w] = normaliseProposals([{ type: 'task', title: 'Plan', scope: 'week', repeat: 'daily', time: '10:00' }], { today })
    expect(w).toMatchObject({ repeat: 'none', time: '' })
  })
  it('links to an existing goal by title, case-insensitively', () => {
    const [t] = normaliseProposals([{ type: 'task', title: 'Order samples', scope: 'day', goal: 'launch STICKER shop' }], { today, goals })
    expect(t.goalId).toBe('g1')
  })
  it('builds goals with steps, filling missing step dates and dropping past deadlines', () => {
    const [g] = normaliseProposals([{
      type: 'goal', title: 'Run a 5k', deadline: '2026-12-01', list: 'health',
      steps: [{ title: 'Buy shoes', date: '2026-10-18' }, { title: 'First run' }, 'Join a club', { title: '' }],
    }], { today })
    expect(g.kind).toBe('goal')
    expect(g.deadline).toBe('2026-12-01')
    expect(g.steps.map(s => s.title)).toEqual(['Buy shoes', 'First run', 'Join a club'])
    expect(g.steps[1].date >= today).toBe(true)
    const [late] = normaliseProposals([{ type: 'goal', title: 'x', deadline: '2025-01-01', steps: [] }], { today })
    expect(late.deadline).toBeNull()
  })
  it('accepts {items: [...]} and caps the list', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ type: 'task', title: `T${i}` }))
    expect(normaliseProposals({ items: many }, { today })).toHaveLength(40)
    expect(normaliseProposals('nonsense', { today })).toEqual([])
  })
})

describe('resize', () => {
  it('turns a task into a goal and back without losing the title', () => {
    const [t] = normaliseProposals([{ type: 'task', title: 'Write book', scope: 'month' }], { today })
    const g = resize(t, 'goal', today)
    expect(g).toMatchObject({ kind: 'goal', title: 'Write book', steps: [] })
    const d = resize(g, 'day', today)
    expect(d).toMatchObject({ kind: 'task', scope: 'day', date: today, repeat: 'none' })
  })
})

describe('splitToInbox', () => {
  it('splits dictation into lines and sentences', () => {
    expect(splitToInbox('Call mom. Buy milk; pay rent\n- walk dog\n\n1) email Sam'))
      .toEqual(['Call mom.', 'Buy milk', 'pay rent', 'walk dog', 'email Sam'])
  })
})

describe('sort prompt rules for ambiguous phrasing', () => {
  const p = buildSortPrompt('x', { today })
  it('covers deadlines, vague habits, one-off weekdays and undated goals', () => {
    expect(p).toContain('"By <day>" is a deadline: do it BEFORE then')
    expect(p).toContain('Vague habits to build')
    expect(p).toContain('A day name without "every"/"each"')
    expect(p).toContain('pace the steps about a week apart')
  })
})
