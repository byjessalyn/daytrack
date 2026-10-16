import { useState } from 'react'
import { checklistProgress, isChecked, listColor } from '../lib/tasks.js'
import { formatTime } from '../lib/dates.js'

export function Ring({ pct, size = 88, stroke = 9, label, sub }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} className="ring-fill" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-label">
        <strong>{label ?? `${pct}%`}</strong>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
}

export function Bar({ label, p }) {
  return (
    <div className="bar">
      <div className="bar-head">
        <span>{label}</span>
        <span className="muted">{p.total ? `${p.done}/${p.total}` : 'nothing yet'}</span>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${p.pct}%` }} /></div>
    </div>
  )
}

export function TaskRow({ item, onToggle, onOpen, onCheck, extra, goal }) {
  const { task, done, key } = item
  const [open, setOpen] = useState(false)
  const cl = checklistProgress(task, key)
  return (
    <div className="task-wrap">
    <div className={`task ${done ? 'is-done' : ''}`}>
      <button
        className="check"
        style={{ '--c': listColor(task.list) }}
        aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        aria-pressed={done}
        onClick={onToggle}
      >
        {done && <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      <button className="task-body" onClick={onOpen}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.time && <span>{formatTime(task.time)}</span>}
          {task.repeat !== 'none' && task.scope === 'day' && <span title="Repeats">↻</span>}
          {task.remind != null && task.time && <span title="Reminder set">🔔</span>}
          {cl && <span className="cl-count">☑ {cl.done}/{cl.total}</span>}
          {goal && <span className="goal-tag ellipsis" style={{ '--c': listColor(goal.list) }}>◎ {goal.title}</span>}
          {task.notes && <span className="ellipsis">{task.notes}</span>}
        </span>
      </button>
      {task.link && (
        <a className="icon-btn small-icon" href={task.link} target="_blank" rel="noreferrer" aria-label={`Open link for "${task.title}"`}>↗</a>
      )}
      {cl && onCheck && (
        <button className="icon-btn small-icon" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? 'Hide checklist' : 'Show checklist'}>
          {open ? '▴' : '▾'}
        </button>
      )}
      {extra}
    </div>
    {open && cl && onCheck && (
      <ul className="checklist">
        {task.checklist.map(it => {
          const on = isChecked(task, key, it.id)
          return (
            <li key={it.id}>
              <button className={`mini-check ${on ? 'on' : ''}`} onClick={() => onCheck(it.id)} aria-pressed={on}>
                <i>{on && '✓'}</i><span>{it.text}</span>
              </button>
            </li>
          )
        })}
      </ul>
    )}
    </div>
  )
}

export function Nav({ title, sub, onPrev, onNext, onToday, isCurrent }) {
  return (
    <div className="nav">
      <button className="icon-btn" onClick={onPrev} aria-label="Previous">‹</button>
      <div className="nav-title">
        <h1>{title}</h1>
        {sub && <div className="muted small">{sub}</div>}
        {!isCurrent && <button className="link-btn small today-link" onClick={onToday}>Back to today</button>}
      </div>
      <button className="icon-btn" onClick={onNext} aria-label="Next">›</button>
    </div>
  )
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>
}
