import { describe, expect, it } from 'vitest'
import { makeTask, toggleDone } from '../src/lib/tasks.js'
import { goalProgress, makeGoal, taskFraction } from '../src/lib/goals.js'

const goal = makeGoal({ id: 'g', title: 'Launch shop', startedAt: '2026-10-01', deadline: '2026-10-31' })
const step = (date, done) => {
  const t = makeTask({ title: 's', goalId: 'g', date })
  return done ? toggleDone(t, date) : t
}
const habit = (count, target) => {
  let t = makeTask({ title: 'h', goalId: 'g', date: '2026-10-01', repeat: 'daily', target })
  for (let i = 1; i <= count; i++) t = toggleDone(t, `2026-10-${String(i).padStart(2, '0')}`)
  return t
}

describe('goal progress', () => {
  it('habit counts completions against its target, capped at 100%', () => {
    expect(taskFraction(habit(10, 20))).toBe(0.5)
    expect(taskFraction(habit(25, 20))).toBe(1)
  })
  it('averages steps and habits', () => {
    const p = goalProgress(goal, [step('2026-10-05', true), step('2026-10-06', false), habit(10, 20)], '2026-10-16')
    // (1 + 0 + 0.5) / 3 = 50%
    expect(p.pct).toBe(50)
    expect(p.stepsDone).toBe(1)
    expect(p.steps).toHaveLength(2)
    expect(p.habits).toHaveLength(1)
  })
  it('ignores tasks linked to other goals', () => {
    const other = makeTask({ title: 'x', goalId: 'other', date: '2026-10-05' })
    expect(goalProgress(goal, [other]).total).toBe(0)
  })
  it('flags behind vs on track from the deadline', () => {
    // Oct 16 is ~50% of Oct 1 → Oct 31
    expect(goalProgress(goal, [habit(4, 20)], '2026-10-16').status).toBe('behind')
    expect(goalProgress(goal, [habit(9, 20)], '2026-10-16').status).toBe('on-track')
    expect(goalProgress(goal, [step('2026-10-05', false)], '2026-11-02').status).toBe('overdue')
  })
  it('is done when everything is complete, and empty with no tasks', () => {
    expect(goalProgress(goal, [step('2026-10-05', true)], '2026-11-02').status).toBe('done')
    expect(goalProgress(goal, [], '2026-10-16')).toMatchObject({ status: 'empty', pct: 0 })
  })
  it('uses the default target when none is set', () => {
    expect(taskFraction(habit(10, null))).toBe(0.5)
  })
})
