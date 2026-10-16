import { useEffect, useRef, useState } from 'react'
import { isNative, notificationPermission, requestNotificationPermission } from '../lib/native.js'
import { exportJSON, importJSON } from '../lib/storage.js'

function Toggle({ on, onChange, label }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <i />
    </button>
  )
}

export default function SettingsView({ ctx }) {
  const { data, setSettings, replaceAll } = ctx
  const s = data.settings
  const [perm, setPerm] = useState('prompt')
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState(null) // backup waiting for confirmation
  const fileRef = useRef(null)

  useEffect(() => { notificationPermission().then(setPerm) }, [])

  async function toggleNotifications(on) {
    if (!on) return setSettings({ notifications: false })
    const result = perm === 'granted' ? 'granted' : await requestNotificationPermission()
    setPerm(result)
    setSettings({ notifications: result === 'granted' })
    if (result !== 'granted') setMsg('Notifications are blocked. Turn them on in iPhone Settings → Daytrack → Notifications.')
    else setMsg('')
  }

  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(exportJSON(data))
      setMsg('Backup copied. Paste it into Notes or a file to keep it.')
    } catch {
      setMsg('Copying is blocked here. Use Export backup instead.')
    }
  }

  function download() {
    const blob = new Blob([exportJSON(data)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `daytrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const next = importJSON(await file.text())
      setPending(next)
      setMsg('')
    } catch (err) {
      setMsg(err.message || 'Could not read that file.')
    }
    e.target.value = ''
  }

  return (
    <div className="view">
      <div className="nav"><div className="nav-title"><h1>Settings</h1></div></div>

      <h2 className="section-title">Notifications</h2>
      <div className="card list">
        <div className="row">
          <div>
            <div>Reminders &amp; summaries</div>
            <div className="muted small">
              {perm === 'denied' ? (isNative ? 'Blocked in iPhone Settings' : 'Blocked by this browser') : isNative ? 'Delivered even when the app is closed' : 'In a browser, only while this tab is open'}
            </div>
          </div>
          <Toggle on={s.notifications} onChange={toggleNotifications} label="Notifications" />
        </div>
        <div className={`row ${!s.notifications ? 'dim' : ''}`}>
          <div>
            <div>Morning plan</div>
            <div className="muted small">What's on today</div>
          </div>
          <input type="time" value={s.morningTime} onChange={e => setSettings({ morningTime: e.target.value })} disabled={!s.notifications || !s.morningSummary} />
          <Toggle on={s.morningSummary} onChange={v => setSettings({ morningSummary: v })} label="Morning plan" />
        </div>
        <div className={`row ${!s.notifications ? 'dim' : ''}`}>
          <div>
            <div>Evening check-in</div>
            <div className="muted small">How much got done</div>
          </div>
          <input type="time" value={s.eveningTime} onChange={e => setSettings({ eveningTime: e.target.value })} disabled={!s.notifications || !s.eveningCheckin} />
          <Toggle on={s.eveningCheckin} onChange={v => setSettings({ eveningCheckin: v })} label="Evening check-in" />
        </div>
      </div>
      {msg && <p className="hint">{msg}</p>}

      <h2 className="section-title">Calendar</h2>
      <div className="card list">
        <div className="row">
          <div>Week starts on</div>
          <select value={s.weekStartsOn} onChange={e => setSettings({ weekStartsOn: Number(e.target.value) })}>
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </div>
      </div>

      <h2 className="section-title">Home-screen widget</h2>
      <div className="card pad small">
        {isNative
          ? <>Long-press your home screen → <b>+</b> → search <b>Daytrack</b>. Small shows today's ring, medium adds your next tasks, and there are lock-screen sizes too. It updates every time you change something here.</>
          : <>Widgets only work in the iPhone app build. See <code>IOS_SETUP.md</code> in the repo.</>}
      </div>

      <h2 className="section-title">Backup</h2>
      <div className="card list">
        <button className="row as-btn" onClick={download}>Export backup (.json)</button>
        <button className="row as-btn" onClick={copyBackup}>Copy backup to clipboard</button>
        <button className="row as-btn" onClick={() => fileRef.current?.click()}>Restore from backup…</button>
        {pending && (
          <div className="row confirm-row">
            <div>Replace your current plan with {pending.tasks.length} tasks from this backup?</div>
            <button className="pill" onClick={() => setPending(null)}>Cancel</button>
            <button className="pill danger" onClick={() => { replaceAll(pending); setPending(null); setMsg('Backup restored.') }}>Replace</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={upload} />
      </div>
      <p className="muted small center">Your plan is stored only on this device.</p>
    </div>
  )
}
