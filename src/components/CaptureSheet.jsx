import { useEffect, useRef, useState } from 'react'

// One-tap capture: type it, save it to the inbox, sort it later.
export default function CaptureSheet({ onCapture, onDetails, onNewGoal, onClose }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    const title = text.trim()
    if (!title) return
    onCapture(title)
    setText('')
    setSaved(n => n + 1)
    inputRef.current?.focus()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet capture" onClick={e => e.stopPropagation()} onSubmit={submit} aria-label="Quick capture">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>Done</button>
          <strong>Capture</strong>
          <span className="link-btn placeholder" aria-hidden="true">Done</span>
        </div>
        <div className="capture-row">
          <input
            ref={inputRef} id="capture-input" className="title-input" placeholder="What's on your mind?"
            value={text} onChange={e => setText(e.target.value)} maxLength={120} enterKeyHint="done"
          />
          <button type="submit" className="pill solid" disabled={!text.trim()}>Save</button>
        </div>
        <p className="hint">
          {saved ? `Saved ${saved} to your inbox. Keep going, or tap Done.` : 'Saves to your inbox. Give it a day later from Today.'}
        </p>
        <div className="capture-actions">
          <button type="button" className="pill" onClick={() => onDetails(text.trim())}>Add with details…</button>
          <button type="button" className="pill" onClick={onNewGoal}>New goal…</button>
        </div>
      </form>
    </div>
  )
}
