import { useEffect, useRef, useState } from 'react'
import { LISTS, REMINDERS, REPEATS, newId } from '../lib/tasks.js'
import { todayKey } from '../lib/dates.js'
import { DEFAULT_HABIT_TARGET } from '../lib/goals.js'

const SCOPES = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

export default function TaskEditor({ initial, goals = [], onSave, onDelete, onClose, notificationsOn }) {
  const [t, setT] = useState(initial)
  const titleRef = useRef(null)
  const isNew = !initial.id
  const set = (patch) => setT(prev => ({ ...prev, ...patch }))
  const [newItem, setNewItem] = useState('')
  const checklist = t.checklist || []

  function addItem() {
    const text = newItem.trim()
    if (!text) return
    set({ checklist: [...checklist, { id: newId(), text }] })
    setNewItem('')
  }

  useEffect(() => {
    if (isNew) titleRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNew, onClose])

  function submit(e) {
    e.preventDefault()
    if (!t.title.trim()) return
    onSave({ ...t, title: t.title.trim(), notes: t.notes.trim(), link: normaliseLink(t.link) })
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
              className={t.scope === s.id ? 'on' : ''} onClick={() => set({ scope: s.id, date: t.date || todayKey() })}
            >{s.label}</button>
          ))}
        </div>

        {t.scope === 'inbox' && <p className="hint">Inbox items have no date. Pick Day, Week or Month when you're ready to plan it.</p>}

        {t.scope !== 'inbox' && <div className="field-grid">
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
        </div>}
        {t.scope === 'day' && !t.time && <p className="hint">Add a time to set a reminder.</p>}
        {t.scope === 'day' && t.time && t.remind != null && !notificationsOn && (
          <p className="hint">Turn on notifications in Settings to get this reminder.</p>
        )}

        {goals.length > 0 && (
          <div className="field-grid">
            <label className="field">
              <span>Counts toward goal</span>
              <select value={t.goalId || ''} onChange={e => set({ goalId: e.target.value || null })}>
                <option value="">No goal</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </label>
            {t.goalId && t.scope === 'day' && t.repeat !== 'none' && (
              <label className="field">
                <span>Habit target (times)</span>
                <input
                  type="number" inputMode="numeric" min="1" max="365"
                  value={t.target ?? DEFAULT_HABIT_TARGET}
                  onChange={e => set({ target: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })}
                />
              </label>
            )}
          </div>
        )}
        {t.goalId && t.scope === 'day' && t.repeat === 'none' && (
          <p className="hint">One-off task: counts as a step toward the goal. Set it to repeat to make it a habit.</p>
        )}

        <div className="field">
          <span>Checklist</span>
          {checklist.length > 0 && (
            <ul className="cl-edit">
              {checklist.map((it, i) => (
                <li key={it.id}>
                  <input
                    id={`cl-${it.id}`} value={it.text} aria-label={`Checklist item ${i + 1}`}
                    onChange={e => set({ checklist: checklist.map(c => (c.id === it.id ? { ...c, text: e.target.value } : c)) })}
                  />
                  <button type="button" className="icon-btn small-icon" aria-label={`Remove "${it.text}"`}
                    onClick={() => set({ checklist: checklist.filter(c => c.id !== it.id) })}>×</button>
                </li>
              ))}
            </ul>
          )}
          <div className="cl-add">
            <input
              id="cl-new" placeholder="Add an item" value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
            />
            <button type="button" className="pill" onClick={addItem} disabled={!newItem.trim()}>Add</button>
          </div>
        </div>

        <label className="field">
          <span>Link</span>
          <input id="task-link" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://" value={t.link || ''} onChange={e => set({ link: e.target.value })} />
        </label>

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

function normaliseLink(raw) {
  const v = (raw || '').trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}
