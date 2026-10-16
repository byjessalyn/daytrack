import { addDays, formatDay, startOfMonth, startOfWeek } from '../lib/dates.js'
import { inboxItems, itemsForDay, monthProgress, overdueItems, progress, weekProgress } from '../lib/tasks.js'
import { SCALES, affirmationFor, needsSupport } from '../lib/checkins.js'
import { Bar, Empty, TaskRow } from '../components/ui.jsx'

function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function SupportCard() {
  return (
    <section className="card pad support" role="note">
      <strong>You've had a few hard days.</strong>
      <p>Be gentle with yourself today, and consider telling someone you trust how you're doing.
        If you need to talk to someone now, call or text <b className="selectable">9-8-8</b> (Canada and US), any time.</p>
      <p className="muted small">Daytrack can't diagnose anything. This shows up when several recent check-ins were low.</p>
    </section>
  )
}

export default function TodayView({ ctx }) {
  const { tasks, checkins, settings, goalMap, today, toggle, toggleChecklistItem, openEditor, moveTask,
    scheduleTask, openCheckin, openSettings } = ctx
  const items = itemsForDay(tasks, today)
  const p = progress(items)
  const overdue = overdueItems(tasks, today)
  const inbox = inboxItems(tasks)
  const checkin = checkins[today]
  const rowProps = (it) => ({
    item: it, goal: goalMap[it.task.goalId],
    onToggle: () => toggle(it.task.id, it.key),
    onCheck: (cid) => toggleChecklistItem(it.task.id, it.key, cid),
    onOpen: () => openEditor(it.task),
  })

  return (
    <div className="view">
      <header className="today-head">
        <div>
          <h1 className="greeting">{greeting()}</h1>
          <div className="muted">{formatDay(today)}</div>
        </div>
        <button className="icon-btn gear" onClick={openSettings} aria-label="Settings">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </header>

      <p className="affirmation">{affirmationFor(today)}</p>

      <section className="card pad today-summary">
        <div className="bar-head">
          <strong>{p.total ? `${p.done} of ${p.total} done today` : 'Nothing planned today'}</strong>
          <span className="muted">{p.total ? `${p.pct}%` : ''}</span>
        </div>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${p.pct}%` }} /></div>
        <div className="summary-bars two">
          <Bar label="Week" p={weekProgress(tasks, startOfWeek(today, settings.weekStartsOn))} />
          <Bar label="Month" p={monthProgress(tasks, startOfMonth(today))} />
        </div>
      </section>

      {checkin ? (
        <button className="card pad checkin-done" onClick={openCheckin}>
          <div className="section-row"><strong>Today's check-in</strong><span className="link-btn small">Edit</span></div>
          <div className="checkin-chips">
            {SCALES.filter(s => checkin[s.id]).map(s => (
              <span key={s.id} className="chip plain static">
                <span aria-hidden="true">{s.icons[checkin[s.id] - 1]}</span> {s.label}: {s.options[checkin[s.id] - 1]}
              </span>
            ))}
          </div>
        </button>
      ) : (
        <button className="card pad checkin-prompt" onClick={openCheckin}>
          <span className="checkin-emoji" aria-hidden="true">🌷</span>
          <span>
            <strong>How are you today?</strong>
            <span className="muted small block">A 30-second check-in on mood, energy, stress and sleep.</span>
          </span>
        </button>
      )}

      {needsSupport(checkins, today) && <SupportCard />}

      {inbox.length > 0 && (
        <section>
          <h2 className="section-title">Inbox · {inbox.length}</h2>
          <div className="card list">
            {inbox.map(t => (
              <div key={t.id} className="inbox-row">
                <button className="task-body" onClick={() => openEditor(t)}>
                  <span className="task-title">{t.title}</span>
                </button>
                <div className="inbox-actions">
                  <button className="pill" onClick={() => scheduleTask(t.id, today)}>Today</button>
                  <button className="pill" onClick={() => scheduleTask(t.id, addDays(today, 1))}>Tmrw</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {overdue.length > 0 && (
        <section>
          <h2 className="section-title warn">Overdue · {overdue.length}</h2>
          <div className="card list">
            {overdue.map(it => (
              <TaskRow key={it.task.id} {...rowProps(it)}
                extra={<button className="pill" onClick={() => moveTask(it.task.id, today)}>Today</button>} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Today</h2>
        {items.length ? (
          <div className="card list">
            {items.map(it => <TaskRow key={it.task.id} {...rowProps(it)} />)}
          </div>
        ) : (
          <Empty>Nothing planned yet. Tap <b>+</b> to capture something, or sort your inbox.</Empty>
        )}
      </section>
    </div>
  )
}
