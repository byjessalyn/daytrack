import { useEffect, useRef, useState } from 'react'
import { LISTS, REMINDERS, REPEATS } from '../lib/tasks.js'

const SCOPES = [
  { id: 'day', label: 'Day task' },
  { id: 'week', label: 'Week goal' },
  { id: 'month', label: 'Month goal' },
]

export default function TaskEditor({ initial, onSave, onDelete, onClose, notificationsOn }) {
  const [t, setT] = useState(initial)
  const titleRef = useRef(null)
  const isNew = !initial.id
  const set = (patch) => setT(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    if (isNew) titleRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNew, onClose])

  function submit(e) {
    e.preventDefault()
    if (!t.title.trim()) return
    onSave({ ...t, title: t.title.trim(), notes: t.notes.trim() })
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={e => e.stopPropagation()} onSubmit={submit} aria-label={isNew ? 'New task' : 'Edit task'}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
          <strong>{isNew ? 'New' : 'Edit'}</strong>
          <button type="submit" className="link-btn strong" disabled={!t.title.trim()}>Save</button>
        </div>

        <input
          ref={titleRef} className="title-input" placeholder="What do you need to do?"
          value={t.title} onChange={e => set({ title: e.target.value })} maxLength={120}
        />
        <textarea
          className="notes-input" placeholder="Notes" rows={2}
          value={t.notes} onChange={e => set({ notes: e.target.value })}
        />

        <div className="segmented" role="tablist">
          {SCOPES.map(s => (
            <button
              type="button" key={s.id} role="tab" aria-selected={t.scope === s.id}
              className={t.scope === s.id ? 'on' : ''} onClick={() => set({ scope: s.id })}
            >{s.label}</button>
          ))}
        </div>

        <div className="field-grid">
          <label className="field">
            <span>{t.scope === 'day' ? 'Date' : t.scope === 'week' ? 'Any day in the week' : 'Any day in the month'}</span>
            <input type="date" value={t.date} onChange={e => e.target.value && set({ date: e.target.value })} required />
          </label>

          {t.scope === 'day' && (
            <>
              <label className="field">
                <span>Time</span>
                <input type="time" value={t.time} onChange={e => set({ time: e.target.value })} />
              </label>
              <label className="field">
                <span>Repeat</span>
                <select value={t.repeat} onChange={e => set({ repeat: e.target.value })}>
                  {REPEATS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Reminder</span>
                <select
                  value={t.remind ?? ''} disabled={!t.time}
                  onChange={e => set({ remind: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  {REMINDERS.map(r => <option key={r.label} value={r.value ?? ''}>{r.label}</option>)}
                </select>
              </label>
            </>
          )}
        </div>
        {t.scope === 'day' && !t.time && <p className="hint">Add a time to set a reminder.</p>}
        {t.scope === 'day' && t.time && t.remind != null && !notificationsOn && (
          <p className="hint">Turn on notifications in Settings to get this reminder.</p>
        )}

        <div className="field">
          <span>List</span>
          <div className="chips">
            {LISTS.map(l => (
              <button
                type="button" key={l.id} className={`chip ${t.list === l.id ? 'on' : ''}`}
                style={{ '--c': l.color }} onClick={() => set({ list: l.id })} aria-pressed={t.list === l.id}
              ><i />{l.label}</button>
            ))}
          </div>
        </div>

        {!isNew && (
          <button type="button" className="danger-btn" onClick={() => onDelete(t.id)}>
            Delete{t.repeat !== 'none' ? ' (all repeats)' : ''}
          </button>
        )}
      </form>
    </div>
  )
}
