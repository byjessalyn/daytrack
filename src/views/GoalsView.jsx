import { useState } from 'react'
import { formatDay } from '../lib/dates.js'
import { listColor, occursOn } from '../lib/tasks.js'
import { goalProgress, habitCount, habitTarget, taskFraction } from '../lib/goals.js'
import { Empty, Ring, TaskRow } from '../components/ui.jsx'

const STATUS = {
  'empty':    { label: 'No steps yet', tone: 'muted' },
  'active':   { label: 'In progress',  tone: 'info' },
  'on-track': { label: 'On track',     tone: 'good' },
  'behind':   { label: 'Behind',       tone: 'warn' },
  'overdue':  { label: 'Past deadline', tone: 'bad' },
  'done':     { label: 'Complete',     tone: 'good' },
}

function dueText(goal, p) {
  if (!goal.deadline) return null
  const date = formatDay(goal.deadline, { month: 'short', day: 'numeric' })
  if (p.status === 'done') return `Due ${date}`
  if (p.daysLeft == null) return `Due ${date}`
  if (p.daysLeft < 0) return `Was due ${date}`
  if (p.daysLeft === 0) return 'Due today'
  return `${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'} left · ${date}`
}

export default function GoalsView({ ctx }) {
  const { tasks, goals, today, toggle, openEditor, newTask, openGoalEditor } = ctx
  const [openId, setOpenId] = useState(goals.length === 1 ? goals[0].id : null)

  const sorted = goals
    .map(g => ({ goal: g, p: goalProgress(g, tasks, today) }))
    .sort((a, b) => (a.p.status === 'done') - (b.p.status === 'done') || (a.goal.deadline || '9999').localeCompare(b.goal.deadline || '9999'))

  return (
    <div className="view">
      <div className="nav">
        <div className="nav-title"><h1>Goals</h1></div>
      </div>

      {!goals.length && (
        <Empty>
          Break a big goal into <b>steps</b> (one-off tasks) and <b>habits</b> (repeating tasks).
          Each one you finish moves the goal forward. Tap <b>+</b> to create your first goal.
        </Empty>
      )}

      {sorted.map(({ goal, p }) => {
        const open = openId === goal.id
        const s = STATUS[p.status]
        return (
          <section key={goal.id} className={`card goal ${open ? 'is-open' : ''}`} style={{ '--c': listColor(goal.list) }}>
            <button className="goal-head" onClick={() => setOpenId(open ? null : goal.id)} aria-expanded={open}>
              <Ring pct={p.pct} size={60} stroke={7} />
              <div className="goal-head-text">
                <strong>{goal.title}</strong>
                <span className="goal-meta">
                  <span className={`status ${s.tone}`}>{s.label}</span>
                  {dueText(goal, p) && <span className="muted">{dueText(goal, p)}</span>}
                </span>
                <span className="muted small">
                  {p.steps.length > 0 && `${p.stepsDone}/${p.steps.length} steps`}
                  {p.steps.length > 0 && p.habits.length > 0 && ' · '}
                  {p.habits.length > 0 && `${p.habits.length} habit${p.habits.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <span className="chev" aria-hidden="true">{open ? '−' : '+'}</span>
            </button>

            {open && (
              <div className="goal-body">
                {goal.notes && <p className="goal-notes">{goal.notes}</p>}

                <div className="section-row">
                  <h2 className="section-title">Steps</h2>
                  <button className="pill" onClick={() => newTask({ goalId: goal.id, list: goal.list })}>+ Step</button>
                </div>
                {p.steps.length ? (
                  <div className="list inset">
                    {[...p.steps].sort((a, b) => a.date.localeCompare(b.date)).map(t => (
                      <TaskRow
                        key={t.id}
                        item={{ task: t, key: t.date, done: taskFraction(t) === 1 }}
                        onToggle={() => toggle(t.id, t.date)}
                        onOpen={() => openEditor(t)}
                        extra={<span className="muted small nowrap">{formatDay(t.date, { month: 'short', day: 'numeric' })}</span>}
                      />
                    ))}
                  </div>
                ) : <p className="hint">One-off things to get done, like "Order sticker samples".</p>}

                <div className="section-row">
                  <h2 className="section-title">Habits</h2>
                  <button className="pill" onClick={() => newTask({ goalId: goal.id, list: goal.list, repeat: 'daily', target: 20 })}>+ Habit</button>
                </div>
                {p.habits.length ? (
                  <div className="list inset">
                    {p.habits.map(t => {
                      const count = habitCount(t)
                      const target = habitTarget(t)
                      const dueToday = occursOn(t, today)
                      const doneToday = !!t.done?.[today]
                      return (
                        <div key={t.id} className="habit">
                          <TaskRow
                            item={{ task: t, key: today, done: doneToday }}
                            onToggle={() => dueToday && toggle(t.id, today)}
                            onOpen={() => openEditor(t)}
                            extra={!dueToday && <span className="muted small nowrap">not today</span>}
                          />
                          <div className="habit-bar">
                            <div className="bar-track thin"><div className="bar-fill" style={{ width: `${Math.min(100, (count / target) * 100)}%` }} /></div>
                            <span className="muted small nowrap">{Math.min(count, target)}/{target}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="hint">Repeating work, like "Draw for 30 minutes" every weekday, done a set number of times.</p>}

                <button className="link-btn small" onClick={() => openGoalEditor(goal)}>Edit goal</button>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
