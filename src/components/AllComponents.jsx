// components/LevelUpOverlay.jsx
import React from 'react'

export function LevelUpOverlay({ data, onClose }) {
  return (
    <div className="overlay-backdrop">
      <div className="overlay-card">
        <span className="lu-emoji">{data.emoji}</span>
        <div className="lu-title">{data.title}</div>
        <div className="lu-sub">level {data.level} unlocked ✨</div>
        <div className="lu-msg">
          {data.msg}
          {data.reward && `\n\n${data.reward}`}
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
          let's go 🌸
        </button>
      </div>
    </div>
  )
}

// components/RecoveryOverlay.jsx
import gameData from '../data/gameData.json'

export function RecoveryOverlay({ store, onComplete, onClose }) {
  const quests = gameData.recoveryQuests
  const quest = quests[Math.floor(Math.random() * quests.length)]
  const msgs = [
    "hey, life happened. i saved your spot. here's a little quest to get back in it 🌸",
    "missing a day doesn't erase what you built. mochi kept things warm for you.",
    "you're back. that's what matters. 🌸",
  ]
  const msg = msgs[Math.floor(Math.random() * msgs.length)]

  return (
    <div className="overlay-backdrop">
      <div className="overlay-card">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
        <div className="serif" style={{ fontSize: 22, marginBottom: 8, color: 'var(--text)' }}>recovery quest</div>
        <div style={{ fontSize: 13, color: 'var(--text-s)', marginBottom: 16, lineHeight: 1.6 }}>{msg}</div>
        <div style={{
          fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1.5,
          background: 'var(--cream2)', borderRadius: 14, padding: 14, marginBottom: 4
        }}>
          {quest}
        </div>
        <button className="btn btn-lavender btn-full" style={{ marginTop: 16 }} onClick={onComplete}>
          i did it +35 XP ✨
        </button>
        <div
          style={{ marginTop: 10, fontSize: 12, color: 'var(--text-l)', cursor: 'pointer' }}
          onClick={onClose}
        >
          i'll come back to this
        </div>
      </div>
    </div>
  )
}

// components/ChallengeOverlay.jsx
export function ChallengeOverlay({ onComplete, onClose }) {
  const challenges = gameData.challenges
  const challenge = challenges[Math.floor(Math.random() * challenges.length)]

  return (
    <div className="overlay-backdrop">
      <div className="overlay-card">
        <div className="chal-cat" style={{
          display: 'inline-block', padding: '3px 14px', borderRadius: 50,
          fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5,
          background: 'var(--yellow)', color: '#7A5010', marginBottom: 14
        }}>
          {challenge.cat}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.5, color: 'var(--text)', marginBottom: 20 }}>
          {challenge.text}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onComplete}>
            done! +25 XP ✨
          </button>
          <button className="btn btn-ghost" onClick={onClose}>skip</button>
        </div>
      </div>
    </div>
  )
}

// components/ThemeModal.jsx
export function ThemeModal({ store, onClose }) {
  const { state, setTheme, checkThemeUnlocks } = store
  checkThemeUnlocks()

  return (
    <div className="overlay-backdrop bottom" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bottom-sheet">
        <div className="sheet-handle" />
        <div className="serif" style={{ fontSize: 22, marginBottom: 4, color: 'var(--text)' }}>Visual Themes 🎨</div>
        <div style={{ fontSize: 12, color: 'var(--text-s)' }}>unlock by hitting milestones</div>
        <div className="theme-grid">
          {gameData.themes.map(t => {
            const unlocked = state.unlockedThemes.includes(t.id)
            const active = state.activeTheme === t.id
            return (
              <div
                key={t.id}
                className={`theme-opt ${unlocked ? 'unlocked' : ''} ${active ? 'active-theme' : ''}`}
                onClick={() => unlocked && setTheme(t.id)}
              >
                <div
                  className="theme-swatch"
                  style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                />
                <div className="theme-name">{t.name}</div>
                <div className="theme-lock">
                  {unlocked ? (active ? '✓ active' : 'unlocked') : `🔒 ${t.unlock}`}
                </div>
              </div>
            )
          })}
        </div>
        <button className="btn btn-ghost btn-full" style={{ marginTop: 14 }} onClick={onClose}>close</button>
      </div>
    </div>
  )
}

// components/DevPanel.jsx
export function DevPanel({ store, addXP, onClose }) {
  const { state, devAdvanceDay, devAddXP, devUnlockAll, devReset, level } = store
  return (
    <div className="dev-panel">
      <h3>🔧 dev panel</h3>
      <button onClick={() => devAdvanceDay(1)}>+1 day</button>
      <button onClick={() => devAdvanceDay(-1)}>-1 day</button>
      <button onClick={() => devAddXP(200)}>+200 XP</button>
      <button onClick={() => devAddXP(1000)}>+1000 XP</button>
      <button onClick={devUnlockAll}>unlock all</button>
      <button className="dev-reset" onClick={devReset}>⚠ reset</button>
      <button onClick={onClose}>✕</button>
      <div className="dev-info">
        day {state.currentDay} | {state.xp} XP | streak {state.streak} | lvl {level.level}
      </div>
    </div>
  )
}

// components/CPFloat.jsx
export function CPFloat({ text }) {
  return (
    <div
      className="cp-float"
      style={{ left: '50%', top: '35%', transform: 'translateX(-50%)' }}
    >
      {text}
    </div>
  )
}

// components/Confetti.jsx
import { useEffect, useRef as useRefC } from 'react'

export function Confetti({ onDone }) {
  const canvasRef = useRefC(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    const cols = ['#F4A0A0','#A8D8EA','#FFE5A0','#DDD0F0','#C2EDD8','#FFD6E8']
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 3,
      c: cols[Math.floor(Math.random() * cols.length)],
      s: Math.random() * 3 + 1.5,
      a: Math.random() * 360,
      sp: Math.random() * 6 - 3,
    }))
    let raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      particles.forEach(p => {
        p.y += p.s; p.a += p.sp
        if (p.y < canvas.height) alive = true
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.a * Math.PI / 180)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (alive) raf = requestAnimationFrame(draw)
      else onDone?.()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return <canvas ref={canvasRef} className="confetti-canvas" />
}

// components/TimerOverlay.jsx
export function TimerOverlay({ timer, onXP }) {
  const { timerState, toggle, reset, skip, close, formatTime, progress } = timer
  const circ = 553
  const offset = circ * (1 - progress)

  const timerMsgs = [
    "mochi is here. focus mode activated. you've got this 🌸",
    "protecting your creative time. mochi approves ✨",
    "this is your time. everything else can wait. 🌸",
  ]

  useEffect(() => {
    if (timerState.done) onXP?.()
  }, [timerState.done]) // eslint-disable-line

  const mins = Math.floor(timerState.remaining / 60)

  return (
    <div className="timer-overlay">
      <button className="timer-back" onClick={close}>← back</button>
      <div className="timer-label">focus session</div>
      <div className="timer-name">{timerState.blockName}</div>

      <div className="timer-ring-wrap">
        <svg className="timer-ring-svg" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F4A0A0" />
              <stop offset="100%" stopColor="#A8D8EA" />
            </linearGradient>
          </defs>
          <circle className="timer-ring-bg" cx="100" cy="100" r="88" />
          <circle
            className="timer-ring-fill"
            cx="100" cy="100" r="88"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="timer-time-box">
          <div className="timer-num">{formatTime(timerState.remaining)}</div>
          <div className="timer-sublbl">
            {timerState.done ? 'done! ✨' : mins > 0 ? `${mins} min remaining` : 'almost done!'}
          </div>
        </div>
      </div>

      <div className="timer-controls">
        <button className="timer-btn" onClick={reset}>↺</button>
        <button className={`timer-btn play`} onClick={toggle}>
          {timerState.running ? '⏸' : '▶'}
        </button>
        <button className="timer-btn" onClick={skip}>⏭</button>
      </div>

      <div className="timer-mochi">
        {timerState.done
          ? 'focus session complete!! you showed up and did it. 🌸 +50 XP'
          : timerMsgs[0]}
      </div>
    </div>
  )
}
