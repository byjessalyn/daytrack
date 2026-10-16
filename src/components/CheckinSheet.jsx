import { useEffect, useState } from 'react'
import { FEELINGS, SCALES } from '../lib/checkins.js'

export default function CheckinSheet({ initial, onSave, onClose }) {
  const [c, setC] = useState({ mood: null, energy: null, stress: null, sleep: null, feelings: [], note: '', gratitude: '', ...initial })
  const set = (patch) => setC(prev => ({ ...prev, ...patch }))
  const ready = c.mood != null

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleFeeling(f) {
    set({ feelings: c.feelings.includes(f) ? c.feelings.filter(x => x !== f) : [...c.feelings, f] })
  }

  function submit(e) {
    e.preventDefault()
    if (!ready) return
    onSave({ ...c, note: c.note.trim(), gratitude: c.gratitude.trim() })
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={e => e.stopPropagation()} onSubmit={submit} aria-label="Daily check-in">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
          <strong>Check-in</strong>
          <button type="submit" className="link-btn strong" disabled={!ready}>Save</button>
        </div>

        {SCALES.map(s => (
          <fieldset key={s.id} className="scale">
            <legend>{s.question}</legend>
            <div className="scale-row">
              {s.options.map((label, i) => {
                const v = i + 1
                return (
                  <button
                    type="button" key={label} className={`scale-btn ${c[s.id] === v ? 'on' : ''}`}
                    aria-pressed={c[s.id] === v} onClick={() => set({ [s.id]: c[s.id] === v ? null : v })}
                  >
                    <span className="scale-icon" aria-hidden="true">{s.icons[i]}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}

        <fieldset className="scale">
          <legend>Anything you're feeling? <span className="muted">(optional)</span></legend>
          <div className="chips">
            {FEELINGS.map(f => (
              <button type="button" key={f} className={`chip plain ${c.feelings.includes(f) ? 'on' : ''}`}
                aria-pressed={c.feelings.includes(f)} onClick={() => toggleFeeling(f)}>{f}</button>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>What's on your mind? <span className="muted">(optional)</span></span>
          <textarea id="checkin-note" className="notes-input" rows={2} value={c.note} onChange={e => set({ note: e.target.value })} />
        </label>
        <label className="field">
          <span>One good thing today <span className="muted">(optional)</span></span>
          <input id="checkin-gratitude" value={c.gratitude} onChange={e => set({ gratitude: e.target.value })} maxLength={140} />
        </label>
        {!ready && <p className="hint">Pick your mood to save. Everything else is optional.</p>}
      </form>
    </div>
  )
}
