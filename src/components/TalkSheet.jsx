import { useEffect, useRef, useState } from 'react'
import { formatDay, formatTime } from '../lib/dates.js'
import { listColor } from '../lib/tasks.js'
import { SIZE_CYCLE, buildSortPrompt, normaliseProposals, resize, splitToInbox } from '../lib/sorter.js'

const SIZE_LABEL = { day: 'Day', week: 'Week', month: 'Month', goal: 'Goal' }

const ERROR_COPY = {
  rate_limited: 'Claude is busy or you have hit a usage limit. Try again in a bit.',
  session_expired: 'Sign in to Claude again, then try once more.',
  invalid_json: 'Claude\'s answer came back garbled. Tap Sort again.',
  refused: 'Claude couldn\'t sort that. Try rewording it.',
  empty_completion: 'Claude didn\'t return anything. Try saying a bit more.',
}

// Resolves to the sample function, or null where asking Claude isn't possible
// (the iPhone app, a plain browser, a declined permission).
function useSample() {
  const [state, setState] = useState({ ready: false, sample: null })
  useEffect(() => {
    let live = true
    const use = window.claude?.use
    if (!use) { setState({ ready: true, sample: null }); return }
    use('sample').then(s => live && setState({ ready: true, sample: s }))
      .catch(() => live && setState({ ready: true, sample: null }))
    return () => { live = false }
  }, [])
  return state
}

function sizeOf(p) { return p.kind === 'goal' ? 'goal' : p.scope }

export default function TalkSheet({ today, settings, goals, onAdd, onInbox, onClose }) {
  const { ready, sample } = useSample()
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('input') // input | thinking | review
  const [proposals, setProposals] = useState([])
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const ctlRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); ctlRef.current?.abort() }
  }, [onClose])

  const canSort = ready && sample && !unavailable

  async function sort() {
    const body = text.trim()
    if (!body || !sample) return
    setError('')
    setPhase('thinking')
    const ctl = new AbortController()
    ctlRef.current = ctl
    try {
      const raw = await sample.json(buildSortPrompt(body, { today, weekStartsOn: settings.weekStartsOn, goals }), {
        signal: ctl.signal, modelTier: 'quick', cache: false,
      })
      const items = normaliseProposals(raw, { today, goals })
      if (!items.length) { setError('Nothing to add came back. Try saying it another way.'); setPhase('input'); return }
      setProposals(items)
      setPhase('review')
    } catch (e) {
      setPhase('input')
      if (e?.code === 'cancelled') return
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e?.code)) {
        setUnavailable(true)
        return
      }
      setError(ERROR_COPY[e?.code] || 'Something went wrong reaching Claude. Try again.')
    }
  }

  function saveToInbox() {
    const lines = splitToInbox(text)
    if (!lines.length) return
    onInbox(lines)
  }

  const update = (i, patch) => setProposals(ps => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const cycleSize = (i) => setProposals(ps => ps.map((p, j) => {
    if (j !== i) return p
    const next = SIZE_CYCLE[(SIZE_CYCLE.indexOf(sizeOf(p)) + 1) % SIZE_CYCLE.length]
    return resize(p, next, today)
  }))
  const chosen = proposals.filter(p => p.include)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet talk" onClick={e => e.stopPropagation()} role="dialog" aria-label="Talk it out">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
          <strong>Talk it out</strong>
          {phase === 'review'
            ? <button type="button" className="link-btn strong" disabled={!chosen.length} onClick={() => onAdd(chosen)}>Add {chosen.length}</button>
            : <span className="link-btn placeholder" aria-hidden="true">Cancel</span>}
        </div>

        {phase !== 'review' && (
          <>
            <p className="hint talk-hint">
              Tap the <b>🎤</b> on your keyboard and say everything on your plate: errands, deadlines, big goals.
              {canSort ? ' Claude sorts it into day, week and month tasks and goals by how big each one is.' : ''}
            </p>
            <textarea
              ref={boxRef} id="talk-input" className="notes-input talk-input" rows={6}
              placeholder="e.g. Call the dentist tomorrow, finish the client deck this week, gym every weekday morning, and I want to launch my sticker shop by December…"
              value={text} onChange={e => setText(e.target.value)} disabled={phase === 'thinking'}
            />
            {error && <p className="hint error-text" role="alert">{error}</p>}
            {ready && !canSort && (
              <p className="hint">
                {unavailable
                  ? 'Claude sorting is turned off for this page. You can still save each line to your inbox.'
                  : 'Claude sorting only works on the test page inside Claude. Each line or sentence can still go to your inbox.'}
              </p>
            )}
            <div className="talk-actions">
              {phase === 'thinking' ? (
                <>
                  <span className="thinking" role="status">Sorting… this takes a few seconds</span>
                  <button type="button" className="pill" onClick={() => ctlRef.current?.abort()}>Stop</button>
                </>
              ) : (
                <>
                  {canSort && <button type="button" className="pill solid" disabled={!text.trim()} onClick={sort}>✨ Sort it for me</button>}
                  <button type="button" className="pill" disabled={!text.trim()} onClick={saveToInbox}>Save lines to inbox</button>
                </>
              )}
            </div>
            {canSort && <p className="muted small">What you type is sent to Claude to sort it, and uses your Claude usage.</p>}
          </>
        )}

        {phase === 'review' && (
          <>
            <p className="hint">Untick anything you don't want. Tap the size to change it. Nothing is added until you tap <b>Add</b>.</p>
            <ul className="proposals">
              {proposals.map((p, i) => (
                <li key={i} className={`proposal ${p.include ? '' : 'off'}`} style={{ '--c': listColor(p.list) }}>
                  <button className={`mini-check ${p.include ? 'on' : ''}`} aria-pressed={p.include}
                    aria-label={p.include ? `Skip "${p.title}"` : `Include "${p.title}"`} onClick={() => update(i, { include: !p.include })}>
                    <i>{p.include && '✓'}</i>
                  </button>
                  <div className="proposal-body">
                    <input className="proposal-title" value={p.title} aria-label="Title" onChange={e => update(i, { title: e.target.value })} />
                    <div className="proposal-meta">
                      <button className={`size-chip s-${sizeOf(p)}`} onClick={() => cycleSize(i)} aria-label={`Size: ${SIZE_LABEL[sizeOf(p)]}. Tap to change.`}>
                        {SIZE_LABEL[sizeOf(p)]}
                      </button>
                      {p.kind === 'task' && (
                        <span className="muted small">
                          {p.scope === 'day' && formatDay(p.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                          {p.scope === 'week' && `week of ${formatDay(p.date, { month: 'short', day: 'numeric' })}`}
                          {p.scope === 'month' && formatDay(p.date, { month: 'long' })}
                          {p.time && ` · ${formatTime(p.time)}`}
                          {p.repeat !== 'none' && ` · ↻ ${p.repeat}`}
                          {p.checklist.length > 0 && ` · ☑ ${p.checklist.length}`}
                          {p.goalId && ' · ◎ goal'}
                        </span>
                      )}
                      {p.kind === 'goal' && (
                        <span className="muted small">
                          {p.steps.length} step{p.steps.length === 1 ? '' : 's'}{p.deadline ? ` · by ${formatDay(p.deadline, { month: 'short', day: 'numeric' })}` : ''}
                        </span>
                      )}
                    </div>
                    {p.why && <span className="proposal-why">{p.why}</span>}
                    {p.kind === 'goal' && p.steps.length > 0 && (
                      <ul className="proposal-steps">
                        {p.steps.map((st, k) => (
                          <li key={k}><span className="muted small">{formatDay(st.date, { month: 'short', day: 'numeric' })}</span> {st.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="talk-actions">
              <button type="button" className="pill" onClick={() => setPhase('input')}>Back to edit</button>
              <button type="button" className="pill solid" disabled={!chosen.length} onClick={() => onAdd(chosen)}>Add {chosen.length} to my plan</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
