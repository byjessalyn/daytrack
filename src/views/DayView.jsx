import { addDays, formatDay, startOfMonth, startOfWeek } from '../lib/dates.js'
import { itemsForDay, monthProgress, overdueItems, progress, weekProgress } from '../lib/tasks.js'
import { Bar, Empty, Nav, Ring, TaskRow } from '../components/ui.jsx'

export default function DayView({ ctx }) {
  const { tasks, settings, goalMap, date, setDate, today, toggle, openEditor, moveTask } = ctx
  const items = itemsForDay(tasks, date)
  const p = progress(items)
  const isToday = date === today
  const overdue = isToday ? overdueItems(tasks, today) : []
  const relative = isToday ? 'Today' : date === addDays(today, 1) ? 'Tomorrow' : date === addDays(today, -1) ? 'Yesterday' : null

  return (
    <div className="view">
      <Nav
        title={relative || formatDay(date, { weekday: 'long' })}
        sub={formatDay(date, { month: 'long', day: 'numeric', year: 'numeric' })}
        onPrev={() => setDate(addDays(date, -1))}
        onNext={() => setDate(addDays(date, 1))}
        onToday={() => setDate(today)}
        isCurrent={isToday}
      />

      <section className="card summary">
        <Ring pct={p.pct} label={p.total ? `${p.done}/${p.total}` : '–'} sub={p.total ? 'done' : 'no tasks'} />
        <div className="summary-bars">
          <Bar label="This week" p={weekProgress(tasks, startOfWeek(date, settings.weekStartsOn))} />
          <Bar label="This month" p={monthProgress(tasks, startOfMonth(date))} />
        </div>
      </section>

      {overdue.length > 0 && (
        <section>
          <h2 className="section-title warn">Overdue · {overdue.length}</h2>
          <div className="card list">
            {overdue.map(it => (
              <TaskRow
                key={it.task.id} item={it} goal={goalMap[it.task.goalId]}
                onToggle={() => toggle(it.task.id, it.key)}
                onOpen={() => openEditor(it.task)}
                extra={<button className="pill" onClick={() => moveTask(it.task.id, today)}>Move to today</button>}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Tasks</h2>
        {items.length ? (
          <div className="card list">
            {items.map(it => (
              <TaskRow key={it.task.id} item={it} goal={goalMap[it.task.goalId]} onToggle={() => toggle(it.task.id, it.key)} onOpen={() => openEditor(it.task)} />
            ))}
          </div>
        ) : (
          <Empty>Nothing planned{isToday ? ' for today' : ''}. Tap <b>+</b> to add a task.</Empty>
        )}
      </section>
    </div>
  )
}
