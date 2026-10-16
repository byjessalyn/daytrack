import { addMonths, dayOfWeek, formatMonth, monthDays, startOfMonth } from '../lib/dates.js'
import { dayProgress, goalsForMonth, monthProgress } from '../lib/tasks.js'
import { Bar, Empty, Nav, TaskRow } from '../components/ui.jsx'

export default function MonthView({ ctx }) {
  const { tasks, settings, date, setDate, today, toggle, openEditor, goToDay, newTask } = ctx
  const month = startOfMonth(date)
  const days = monthDays(month)
  const goals = goalsForMonth(tasks, month)
  const ws = settings.weekStartsOn
  const lead = (dayOfWeek(month) - ws + 7) % 7
  const headers = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 7 + ((i + ws) % 7)).toLocaleDateString(undefined, { weekday: 'narrow' }))

  return (
    <div className="view">
      <Nav
        title={formatMonth(month)}
        onPrev={() => setDate(addMonths(month, -1))}
        onNext={() => setDate(addMonths(month, 1))}
        onToday={() => setDate(today)}
        isCurrent={month === startOfMonth(today)}
      />

      <section className="card pad">
        <Bar label="Month progress" p={monthProgress(tasks, month)} />
      </section>

      <section className="card pad">
        <div className="cal">
          {headers.map((h, i) => <div key={i} className="cal-h">{h}</div>)}
          {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} />)}
          {days.map(k => {
            const p = dayProgress(tasks, k)
            const state = !p.total ? '' : p.done === p.total ? 'full' : p.done ? 'part' : 'none'
            return (
              <button
                key={k} className={`cal-d ${k === today ? 'is-today' : ''} ${k < today ? 'is-past' : ''}`}
                onClick={() => goToDay(k)}
                aria-label={`${k}: ${p.total ? `${p.done} of ${p.total} done` : 'no tasks'}`}
              >
                <span>{Number(k.slice(8))}</span>
                {p.total > 0 && (
                  <em className={`cal-dot ${state}`} style={{ '--p': `${p.pct}%` }}>{p.total}</em>
                )}
              </button>
            )
          })}
        </div>
        <div className="legend muted small">
          <span><em className="cal-dot none" /> to do</span>
          <span><em className="cal-dot part" style={{ '--p': '50%' }} /> started</span>
          <span><em className="cal-dot full" /> all done</span>
        </div>
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title">Month goals</h2>
          <button className="pill" onClick={() => newTask({ scope: 'month', date: month })}>+ Goal</button>
        </div>
        {goals.length ? (
          <div className="card list">
            {goals.map(it => <TaskRow key={it.task.id} item={it} onToggle={() => toggle(it.task.id, it.key)} onOpen={() => openEditor(it.task)} />)}
          </div>
        ) : <Empty>Bigger things to get done sometime this month go here.</Empty>}
      </section>
    </div>
  )
}
