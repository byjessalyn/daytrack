import { diffDays, todayKey } from './dates.js'
import { newId } from './tasks.js'

/*
 Goal shape:
 {
   id, title, notes,
   deadline: 'YYYY-MM-DD' | null,
   list: string,            // colour, same ids as task lists
   startedAt: 'YYYY-MM-DD', // used to judge "on track" against the deadline
   createdAt: number,
 }

 Tasks link to a goal with `goalId`. A one-off task (or week/month goal) is a
 step: worth 1 when done. A repeating task is a habit: worth doneCount / target,
 capped at 1, so "Draw 30 min, 20 times" is half done after 10 days.
*/

export const DEFAULT_HABIT_TARGET = 20

export function makeGoal(fields) {
  return {
    id: newId(),
    title: '',
    notes: '',
    deadline: null,
    list: 'personal',
    startedAt: todayKey(),
    createdAt: Date.now(),
    ...fields,
  }
}

export function isHabit(task) {
  return task.scope === 'day' && task.repeat !== 'none'
}

export function habitCount(task) {
  return Object.keys(task.done || {}).length
}

export function habitTarget(task) {
  return Math.max(1, Number(task.target) || DEFAULT_HABIT_TARGET)
}

// 0..1 contribution of one linked task.
export function taskFraction(task) {
  if (isHabit(task)) return Math.min(1, habitCount(task) / habitTarget(task))
  return task.done?.[task.date] ? 1 : 0
}

export function linkedTasks(tasks, goalId) {
  return tasks.filter(t => t.goalId === goalId)
}

export function goalProgress(goal, tasks, today = todayKey()) {
  const linked = linkedTasks(tasks, goal.id)
  const steps = linked.filter(t => !isHabit(t))
  const habits = linked.filter(isHabit)
  const fraction = linked.length ? linked.reduce((s, t) => s + taskFraction(t), 0) / linked.length : 0
  const pct = Math.round(fraction * 100)
  const stepsDone = steps.filter(t => taskFraction(t) === 1).length

  let status = 'empty'
  let daysLeft = null
  if (linked.length) {
    status = pct === 100 ? 'done' : 'active'
    if (goal.deadline && pct < 100) {
      daysLeft = diffDays(today, goal.deadline)
      if (daysLeft < 0) status = 'overdue'
      else {
        // Expected progress if work were spread evenly from start to deadline.
        const span = Math.max(1, diffDays(goal.startedAt || today, goal.deadline))
        const elapsed = Math.min(span, Math.max(0, diffDays(goal.startedAt || today, today)))
        const expected = (elapsed / span) * 100
        status = pct + 10 < expected ? 'behind' : 'on-track'
      }
    }
  }

  return { pct, status, daysLeft, steps, habits, stepsDone, total: linked.length }
}
