import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from './hooks/useStore.js'
import { useTimer } from './hooks/useTimer.js'
import gameData from './data/gameData.json'

import HomeScreen     from './screens/HomeScreen.jsx'
import QuestsScreen   from './screens/QuestsScreen.jsx'
import MapScreen      from './screens/MapScreen.jsx'
import BadgesScreen   from './screens/BadgesScreen.jsx'
import RoadmapScreen  from './screens/RoadmapScreen.jsx'
import AnalyticsScreen from './screens/AnalyticsScreen.jsx'
import FocusScreen    from './screens/FocusScreen.jsx'
import JournalScreen  from './screens/JournalScreen.jsx'

import LevelUpOverlay  from './components/LevelUpOverlay.jsx'
import RecoveryOverlay from './components/RecoveryOverlay.jsx'
import ChallengeOverlay from './components/ChallengeOverlay.jsx'
import ThemeModal      from './components/ThemeModal.jsx'
import DevPanel        from './components/DevPanel.jsx'
import CPFloat         from './components/CPFloat.jsx'
import Confetti        from './components/Confetti.jsx'
import TimerOverlay    from './components/TimerOverlay.jsx'

const SCREENS = [
  { id: 'home',      icon: '🏠', label: 'home'    },
  { id: 'quests',    icon: '✨', label: 'quests'  },
  { id: 'map',       icon: '🗺️', label: 'map'     },
  { id: 'badges',    icon: '🏅', label: 'badges'  },
  { id: 'roadmap',   icon: '📍', label: 'roadmap' },
  { id: 'analytics', icon: '📊', label: 'stats'   },
  { id: 'focus',     icon: '⏱️', label: 'focus'   },
  { id: 'journal',   icon: '📓', label: 'journal' },
]

export default function App() {
  const store = useStore()
  const timer = useTimer()

  const [screen, setScreen]         = useState('home')
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [showChallenge, setShowChallenge] = useState(false)
  const [showTheme, setShowTheme]   = useState(false)
  const [showDev, setShowDev]       = useState(false)
  const [cpFloats, setCpFloats]     = useState([])
  const [showConfetti, setShowConfetti] = useState(false)
  const prevXpRef = useRef(store.state.xp)
  const prevLevelRef = useRef(store.level.level)

  // Apply theme to document
  useEffect(() => {
    const t = store.state.activeTheme
    document.documentElement.dataset.theme = t === 'default' ? '' : t
  }, [store.state.activeTheme])

  // Watch for level-up
  useEffect(() => {
    const newLevel = store.level.level
    if (newLevel > prevLevelRef.current) {
      const def = gameData.levels.find(l => l.level === newLevel)
      const msg = gameData.levelMessages[String(newLevel)] || 'you leveled up! mochi is so proud. 🌸'
      const reward = gameData.realWorldRewards[String(newLevel)]
      setLevelUpData({ ...def, msg, reward })
      setShowLevelUp(true)
      setShowConfetti(true)
      playChime()
    }
    prevLevelRef.current = newLevel
  }, [store.level.level])

  // Watch for streak-based recovery (shown after streak reset on new session)
  useEffect(() => {
    const { streak, lastDate, recoveryDone } = store.state
    if (streak === 0 && lastDate && !recoveryDone) {
      // small delay so app renders first
      const t = setTimeout(() => setShowRecovery(true), 1500)
      return () => clearTimeout(t)
    }
  }, []) // only on mount

  // XP float helper exposed to children
  const spawnFloat = useCallback((text) => {
    const id = Date.now() + Math.random()
    setCpFloats(prev => [...prev, { id, text }])
    setTimeout(() => setCpFloats(prev => prev.filter(f => f.id !== id)), 1800)
  }, [])

  // Wrapped addXP that also shows float
  const addXPWithFloat = useCallback((amt, label) => {
    store.addXP(amt)
    spawnFloat(label || `+${amt} XP ✨`)
  }, [store, spawnFloat])

  function playChime() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      ;[523, 659, 784, 1047].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain()
        o.connect(g); g.connect(ac.destination)
        o.frequency.value = f; o.type = 'sine'
        const t = ac.currentTime + i * 0.15
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.12, t + 0.05)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
        o.start(t); o.stop(t + 0.5)
      })
    } catch (e) {}
  }

  const ctx = {
    store,
    timer,
    screen,
    setScreen,
    addXP: addXPWithFloat,
    spawnFloat,
    openChallenge: () => setShowChallenge(true),
    openTheme:     () => setShowTheme(true),
    openDev:       () => setShowDev(prev => !prev),
  }

  const screenProps = { ctx }

  return (
    <div className="app-shell">
      {/* Settings button */}
      {!timer.timerState.active && (
        <button className="settings-btn" onClick={() => setShowTheme(true)}>🎨</button>
      )}

      {/* Focus Add button — shown only on focus screen */}
      {screen === 'focus' && !timer.timerState.active && (
        <button
          className="focus-add-btn"
          style={{ position: 'fixed', top: 14, right: 16, zIndex: 202 }}
          onClick={() => ctx.store._openFbForm?.()}
        />
      )}

      {/* Screen content */}
      <div className="screen-content">
        {screen === 'home'      && <HomeScreen      {...screenProps} />}
        {screen === 'quests'    && <QuestsScreen    {...screenProps} />}
        {screen === 'map'       && <MapScreen        {...screenProps} />}
        {screen === 'badges'    && <BadgesScreen    {...screenProps} />}
        {screen === 'roadmap'   && <RoadmapScreen   {...screenProps} />}
        {screen === 'analytics' && <AnalyticsScreen {...screenProps} />}
        {screen === 'focus'     && <FocusScreen     {...screenProps} />}
        {screen === 'journal'   && <JournalScreen   {...screenProps} />}
      </div>

      {/* Bottom Nav */}
      {!timer.timerState.active && (
        <nav className="bottom-nav">
          {SCREENS.map(s => (
            <div
              key={s.id}
              className={`nav-item ${screen === s.id ? 'active' : ''}`}
              onClick={() => setScreen(s.id)}
            >
              <span className="nav-icon">{s.icon}</span>
              <span className="nav-label">{s.label}</span>
            </div>
          ))}
        </nav>
      )}

      {/* Timer overlay */}
      {timer.timerState.active && (
        <TimerOverlay timer={timer} onXP={() => addXPWithFloat(50, '+50 XP 🌸 focus complete!')} />
      )}

      {/* Floating overlays */}
      {showLevelUp && levelUpData && (
        <LevelUpOverlay
          data={levelUpData}
          onClose={() => { setShowLevelUp(false); setShowConfetti(false) }}
        />
      )}
      {showRecovery && (
        <RecoveryOverlay
          store={store}
          onComplete={() => {
            addXPWithFloat(35, '+35 XP 🌸 recovery quest!')
            store.setRecoveryDone()
            store.incrementRecovery()
            const count = store.recoveryCount + 1
            if (count >= 3) store.awardBadge('recovery_queen')
            setShowRecovery(false)
          }}
          onClose={() => setShowRecovery(false)}
        />
      )}
      {showChallenge && (
        <ChallengeOverlay
          onComplete={() => {
            if (!store.state.challengeDoneToday) {
              addXPWithFloat(25, '+25 XP ✨ challenge done!')
              store.setChallengeDone()
            }
            store.incrementBlocker()
            setShowChallenge(false)
          }}
          onClose={() => setShowChallenge(false)}
        />
      )}
      {showTheme && (
        <ThemeModal
          store={store}
          onClose={() => setShowTheme(false)}
        />
      )}
      {showDev && (
        <DevPanel
          store={store}
          addXP={addXPWithFloat}
          onClose={() => setShowDev(false)}
        />
      )}

      {/* CP Floats */}
      {cpFloats.map(f => <CPFloat key={f.id} text={f.text} />)}

      {/* Confetti */}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  )
}
