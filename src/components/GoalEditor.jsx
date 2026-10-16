import { useEffect, useRef, useState } from 'react'
import { LISTS } from '../lib/tasks.js'

export default function GoalEditor({ initial, linkedCount, onSave, onDelete, onClose }) {
  const [g, setG] = useState(initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleRef = useRef(null)
  const isNew = !initial.id
  const set = (patch) => setG(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    if (isNew) titleRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNew, onClose])

  function submit(e) {
    e.preventDefault()
    if (!g.title.trim()) return
    onSave({ ...g, title: g.title.trim(), notes: g.notes.trim() })
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={e => e.stopPropagation()} onSubmit={submit} aria-label={isNew ? 'New goal' : 'Edit goal'}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
          <strong>{isNew ? 'New goal' : 'Edit goal'}</strong>
          <button type="submit" className="link-btn strong" disabled={!g.title.trim()}>Save</button>
        </div>

        <input
          ref={titleRef} id="goal-title" className="title-input" placeholder="What do you want to achieve?"
          value={g.title} onChange={e => set({ title: e.target.value })} maxLength={120}
        />
        <textarea
          id="goal-notes" className="notes-input" placeholder="Why it matters (optional)" rows={2}
          value={g.notes} onChange={e => set({ notes: e.target.value })}
        />

        <div className="field-grid">
          <label className="field">
            <span>Deadline (optional)</span>
            <input id="goal-deadline" type="date" value={g.deadline || ''} onChange={e => set({ deadline: e.target.value || null })} />
          </label>
        </div>

        <div className="field">
          <span>Colour</span>
          <div className="chips">
            {LISTS.map(l => (
              <button
                type="button" key={l.id} className={`chip ${g.list === l.id ? 'on' : ''}`}
                style={{ '--c': l.color }} onClick={() => set({ list: l.id })} aria-pressed={g.list === l.id}
              ><i />{l.label}</button>
            ))}
          </div>
        </div>

        {isNew && <p className="hint">After saving, add steps (one-off tasks) and habits (repeating tasks) to it.</p>}

        {!isNew && !confirmDelete && (
          <button type="button" className="danger-btn" onClick={() => setConfirmDelete(true)}>Delete goal</button>
        )}
        {confirmDelete && (
          <div className="confirm-box">
            <p>Delete this goal? {linkedCount ? `Its ${linkedCount} task${linkedCount === 1 ? '' : 's'} will stay in your plan.` : ''}</p>
            <div className="confirm-actions">
              <button type="button" className="pill" onClick={() => setConfirmDelete(false)}>Keep it</button>
              <button type="button" className="pill danger" onClick={() => onDelete(g.id)}>Delete</button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
