import React, { useRef } from 'react'
import gameData from '../data/gameData.json'
import days from '../data/days.json'

const DAY_THEMES = gameData.dayThemes
const MOODS = [
  { mood: 'Blooming', icon: '🌸' },
  { mood: 'Cozy',     icon: '☕' },
  { mood: 'Focused',  icon: '🎯' },
  { mood: 'Wilting',  icon: '🥀' },
  { mood: 'Stormy',   icon: '🌧️' },
]

export default function HomeScreen({ ctx }) {
  const { store, setScreen, addXP, openChallenge } = ctx
  const { state, level, nextLevel, levelProgress, cycleQuote, setMood } = store
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef(null)

  const now = new Date()
  const dow = now.getDay()
  const theme = DAY_THEMES[dow]
  const dateStr = now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })
  const dayData = days[state.currentDay - 1] || days[0]
  const pct = Math.max(1, Math.round((state.currentDay / 90) * 100))
  const phaseNames = ['', 'Foundation 🌱', 'Building 🌸', 'Scaling ✨']

  // Ring circle math
  const r = 32, circ = 2 * Math.PI * r
  const offset = circ - (circ * levelProgress) / 100

  // Habit quests preview (first 3)
  const quests = gameData.habitQuests[dow] || gameData.habitQuests[1]
  const tasks = state.completedTasks[state.currentDay] || {}

  // Day tap → dev panel
  function handleDayTap() {
    tapCountRef.current++
    clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0 }, 700)
    if (tapCountRef.current >= 3) { tapCountRef.current = 0; ctx.openDev() }
  }

  function quickCheck(i) {
    const key = `q${i}`
    if (tasks[key]) return
    store.checkHabit(state.currentDay, i, quests[i].xp)
    addXP(0, `+${quests[i].xp} XP ✨`) // xp already added by store
  }

  return (
    <div className="fade-in">
      {/* Hero header */}
      <div className="hero-band">
        <div className="greeting-eyebrow">✨ byjessalyn</div>
        <div className="greeting-name">Hi, Jessalyn! 🌺</div>
        <div className="greeting-date">{dateStr}</div>
        <div className="theme-chip">{theme.icon} {theme.label}</div>
      </div>

      {/* Quote chip */}
      <div className="quote-chip" onClick={cycleQuote}>
        <div className="quote-text">"{gameData.quotes[state.quoteIndex % gameData.quotes.length]}"</div>
        <div className="quote-hint">tap to change ✨</div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        {/* Level ring */}
        <div className="ring-card">
          <svg className="ring-svg" viewBox="0 0 80 80">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F4A0A0" />
                <stop offset="100%" stopColor="#A8D8EA" />
              </linearGradient>
            </defs>
            <circle className="ring-bg" cx="40" cy="40" r={r} />
            <circle
              className="ring-fill"
              cx="40" cy="40" r={r}
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="ring-label">LEVEL</div>
          <div className="ring-num">{level.level}</div>
          <div className="ring-sub">
            {nextLevel ? `${state.xp}/${nextLevel.xp}` : `${state.xp} XP`}
          </div>
        </div>

        {/* Streak + XP chips */}
        <div className="stat-col">
          <div className="stat-chip streak-anim">
            <span className="stat-icon">🔥</span>
            <div>
              <div className="stat-val">{state.streak}</div>
              <div className="stat-lbl">DAY STREAK</div>
            </div>
          </div>
          <div className="stat-chip">
            <span className="stat-icon">⚡</span>
            <div>
              <div className="stat-val">{state.xp}</div>
              <div className="stat-lbl">TOTAL XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Day progress */}
      <div className="day-progress-card">
        <div className="dp-top">
          <div className="dp-day" onClick={handleDayTap}>Day {state.currentDay} of 90</div>
          <div className="dp-pct">{pct}% complete</div>
        </div>
        <div className="dp-bar">
          <div className="dp-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="dp-phase">{phaseNames[dayData.phase] || `Phase ${dayData.phase}`}</div>
      </div>

      {/* Mood check-in */}
      <div className="mood-wrap">
        <div className="mood-label">
          How are you feeling? {state.todayMood && <span style={{ color: 'var(--text-s)', fontWeight: 600 }}>— {state.todayMood}</span>}
        </div>
        <div className="mood-row">
          {MOODS.map(m => (
            <div
              key={m.mood}
              className={`mood-btn ${state.todayMood === m.mood ? 'selected' : ''}`}
              onClick={() => setMood(m.mood)}
            >
              <span className="mood-icon">{m.icon}</span>
              <span className="mood-text">{m.mood}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quest preview */}
      <div className="quest-preview">
        <div className="qp-header">
          <div className="qp-title">{theme.icon} Today's {quests.length} Quests</div>
          <div className="qp-open" onClick={() => setScreen('quests')}>Open →</div>
        </div>
        {quests.slice(0, 3).map((q, i) => {
          const done = tasks[`q${i}`]
          return (
            <div key={i} className="qp-item">
              <div
                className={`qp-check ${done ? 'done' : ''}`}
                onClick={() => quickCheck(i)}
              >
                {done ? '✓' : ''}
              </div>
              <div className={`qp-text ${done ? 'done' : ''}`}>{q.icon} {q.text}</div>
              <div className="qp-xp">+{q.xp}</div>
            </div>
          )
        })}
        {quests.length > 3 && (
          <div className="qp-more">+{quests.length - 3} more quests today</div>
        )}
      </div>

      {/* Action tiles */}
      <div className="home-tiles">
        <div className="home-tile ht-pink" onClick={() => setScreen('quests')}>
          <div className="ht-icon">✨</div>
          <div className="ht-title">Daily Quests</div>
          <div className="ht-sub">Complete today's habits</div>
        </div>
        <div className="home-tile ht-blue" onClick={() => setScreen('analytics')}>
          <div className="ht-icon">📊</div>
          <div className="ht-title">Analytics</div>
          <div className="ht-sub">Track your growth</div>
        </div>
        <div className="home-tile ht-yellow" onClick={() => setScreen('focus')}>
          <div className="ht-icon">⏱️</div>
          <div className="ht-title">Focus Blocks</div>
          <div className="ht-sub">Protect creative time</div>
        </div>
        <div className="home-tile ht-lavender" onClick={() => setScreen('roadmap')}>
          <div className="ht-icon">🗺️</div>
          <div className="ht-title">Roadmap</div>
          <div className="ht-sub">Long-term goals</div>
        </div>
      </div>

      <div className="spacer" />
    </div>
  )
}
