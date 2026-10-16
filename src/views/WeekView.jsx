import { addDays, formatDay, formatWeek, startOfWeek, weekDays } from '../lib/dates.js'
import { goalsForWeek, itemsForDay, listColor, progress, weekProgress } from '../lib/tasks.js'
import { Bar, Empty, Nav, TaskRow } from '../components/ui.jsx'

export default function WeekView({ ctx }) {
  const { tasks, settings, date, setDate, today, toggle, openEditor, goToDay, newTask } = ctx
  const start = startOfWeek(date, settings.weekStartsOn)
  const goals = goalsForWeek(tasks, start)
  const isCurrent = start === startOfWeek(today, settings.weekStartsOn)

  return (
    <div className="view">
      <Nav
        title={isCurrent ? 'This week' : formatWeek(start)}
        sub={isCurrent ? formatWeek(start) : null}
        onPrev={() => setDate(addDays(start, -7))}
        onNext={() => setDate(addDays(start, 7))}
        onToday={() => setDate(today)}
        isCurrent={isCurrent}
      />

      <section className="card pad">
        <Bar label="Week progress" p={weekProgress(tasks, start)} />
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title">Week goals</h2>
          <button className="pill" onClick={() => newTask({ scope: 'week', date: start })}>+ Goal</button>
        </div>
        {goals.length ? (
          <div className="card list">
            {goals.map(it => <TaskRow key={it.task.id} item={it} onToggle={() => toggle(it.task.id, it.key)} onOpen={() => openEditor(it.task)} />)}
          </div>
        ) : <Empty>Bigger things to get done sometime this week go here.</Empty>}
      </section>

      <section>
        <h2 className="section-title">Days</h2>
        <div className="week-days">
          {weekDays(start).map(k => {
            const items = itemsForDay(tasks, k)
            const p = progress(items)
            return (
              <button key={k} className={`day-card ${k === today ? 'is-today' : ''}`} onClick={() => goToDay(k)}>
                <div className="day-card-head">
                  <span><b>{formatDay(k, { weekday: 'short' })}</b> {formatDay(k, { day: 'numeric' })}</span>
                  <span className="muted small">{p.total ? `${p.done}/${p.total}` : ''}</span>
                </div>
                {p.total > 0 && <div className="bar-track thin"><div className="bar-fill" style={{ width: `${p.pct}%` }} /></div>}
                <ul>
                  {items.slice(0, 4).map(it => (
                    <li key={it.task.id} className={it.done ? 'is-done' : ''}>
                      <i style={{ background: listColor(it.task.list) }} />{it.task.title}
                    </li>
                  ))}
                  {items.length > 4 && <li className="muted">+{items.length - 4} more</li>}
                  {!items.length && <li className="muted">Free</li>}
                </ul>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
