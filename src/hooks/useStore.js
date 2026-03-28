import { useState, useEffect, useCallback } from 'react'
import gameData from '../data/gameData.json'

const STORAGE_KEY = 'bjql_v1'
const RECOVERY_KEY = 'bjql_recovery_count'

const DEFAULT_STATE = {
  currentDay: 1,
  xp: 0,
  streak: 0,
  lastDate: null,
  completedTasks: {},   // { [day]: { morning, evening, content, q0..q4 } }
  badges: {},           // { [badgeId]: dateString }
  journalEntries: [],   // [{ dayNum, date, prompt, text }]
  xpHistory: {},        // { [dateString]: xpEarned }
  habitHistory: {},     // { [dateString]: count }
  blockerCount: 0,
  photoCount: 0,
  activeTheme: 'default',
  unlockedThemes: ['default'],
  todayMood: null,
  todayJournalDone: false,
  todayBlockerDone: false,
  challengeDoneToday: false,
  recoveryDone: false,
  roadmapTasks: {},     // { [phase_idx]: boolean }
  focusBlocks: null,    // null = use defaults from gameData
  quoteIndex: 0,
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) }
  } catch (e) {}
  return { ...DEFAULT_STATE }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {}
}

// ── Level helpers ──────────────────────────────────────
export function getLevel(xp) {
  let current = gameData.levels[0]
  for (const l of gameData.levels) {
    if (xp >= l.xp) current = l
    else break
  }
  return current
}
export function getNextLevel(xp) {
  const cur = getLevel(xp)
  const idx = gameData.levels.findIndex(l => l.level === cur.level)
  return gameData.levels[idx + 1] || null
}
export function getLevelProgress(xp) {
  const cur = getLevel(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  return Math.min(100, Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100))
}

// ── Date helpers ───────────────────────────────────────
export function todayStr() {
  return new Date().toDateString()
}
export function yesterdayStr() {
  return new Date(Date.now() - 86400000).toDateString()
}

// ── Main hook ──────────────────────────────────────────
export function useStore() {
  const [state, setStateRaw] = useState(loadState)

  // Persist on every change
  useEffect(() => {
    saveState(state)
  }, [state])

  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      return next
    })
  }, [])

  // ── Streak check (run once on mount) ─────────────────
  useEffect(() => {
    const today = todayStr()
    if (state.lastDate === today) return

    setState(prev => {
      let streak = prev.streak
      if (prev.lastDate === yesterdayStr()) {
        streak = streak + 1
      } else if (prev.lastDate && prev.lastDate !== today) {
        streak = 0
      }
      return {
        ...prev,
        streak,
        lastDate: today,
        todayMood: null,
        challengeDoneToday: false,
        todayJournalDone: false,
        todayBlockerDone: false,
        recoveryDone: false,
      }
    })
  }, []) // eslint-disable-line

  // ── Award badge ───────────────────────────────────────
  const awardBadge = useCallback((id) => {
    setState(prev => {
      if (prev.badges[id]) return prev
      return { ...prev, badges: { ...prev.badges, [id]: new Date().toLocaleDateString('en-CA') } }
    })
  }, [setState])

  // ── Add XP ────────────────────────────────────────────
  const addXP = useCallback((amount) => {
    const today = todayStr()
    setState(prev => ({
      ...prev,
      xp: prev.xp + amount,
      xpHistory: { ...prev.xpHistory, [today]: (prev.xpHistory[today] || 0) + amount },
    }))
  }, [setState])

  // ── Check task (90-day plan) ───────────────────────────
  const checkTask = useCallback((day, type, xpAmt) => {
    setState(prev => {
      const tasks = prev.completedTasks[day] || {}
      if (tasks[type]) return prev
      return {
        ...prev,
        completedTasks: {
          ...prev.completedTasks,
          [day]: { ...tasks, [type]: true },
        },
      }
    })
    addXP(xpAmt)
  }, [setState, addXP])

  // ── Check habit quest ─────────────────────────────────
  const checkHabit = useCallback((day, questIdx, xpAmt) => {
    setState(prev => {
      const tasks = prev.completedTasks[day] || {}
      const key = `q${questIdx}`
      if (tasks[key]) return prev
      const today = todayStr()
      return {
        ...prev,
        completedTasks: {
          ...prev.completedTasks,
          [day]: { ...tasks, [key]: true },
        },
        habitHistory: {
          ...prev.habitHistory,
          [today]: (prev.habitHistory[today] || 0) + 1,
        },
      }
    })
    addXP(xpAmt)
    awardBadge('first_step')
  }, [setState, addXP, awardBadge])

  // ── Submit journal ────────────────────────────────────
  const submitJournal = useCallback((prompt, text, xpAmt = 15) => {
    setState(prev => ({
      ...prev,
      journalEntries: [
        ...prev.journalEntries,
        { dayNum: prev.currentDay, date: new Date().toLocaleDateString('en-CA'), prompt, text },
      ],
      todayJournalDone: true,
    }))
    addXP(xpAmt)
  }, [setState, addXP])

  // ── Submit blocker ────────────────────────────────────
  const submitBlocker = useCallback(() => {
    setState(prev => ({
      ...prev,
      blockerCount: (prev.blockerCount || 0) + 1,
      todayBlockerDone: true,
    }))
    addXP(10)
  }, [setState, addXP])

  // ── Toggle roadmap task ───────────────────────────────
  const toggleRoadmapTask = useCallback((phase, idx) => {
    setState(prev => {
      const key = `${phase}_${idx}`
      const wasOn = prev.roadmapTasks[key]
      return { ...prev, roadmapTasks: { ...prev.roadmapTasks, [key]: !wasOn } }
    })
    addXP(15)
  }, [setState, addXP])

  // ── Focus blocks ─────────────────────────────────────
  const getFocusBlocks = useCallback(() => {
    return state.focusBlocks || gameData.defaultFocusBlocks
  }, [state.focusBlocks])

  const addFocusBlock = useCallback((block) => {
    setState(prev => {
      const current = prev.focusBlocks || gameData.defaultFocusBlocks
      return { ...prev, focusBlocks: [...current, { ...block, id: Date.now() }] }
    })
  }, [setState])

  const deleteFocusBlock = useCallback((id) => {
    setState(prev => {
      const current = prev.focusBlocks || gameData.defaultFocusBlocks
      return { ...prev, focusBlocks: current.filter(b => b.id !== id) }
    })
  }, [setState])

  // ── Theme ─────────────────────────────────────────────
  const setTheme = useCallback((id) => {
    setState(prev => ({ ...prev, activeTheme: id }))
  }, [setState])

  const checkThemeUnlocks = useCallback(() => {
    setState(prev => {
      const unlocked = [...prev.unlockedThemes]
      const add = (id) => { if (!unlocked.includes(id)) unlocked.push(id) }
      if (prev.currentDay >= 30) add('soft-studio')
      if (prev.streak >= 7) add('midnight-kawaii')
      if (getLevel(prev.xp).level >= 4) add('blossom')
      if (getLevel(prev.xp).level >= 7) add('neon-mochi')
      return { ...prev, unlockedThemes: unlocked }
    })
  }, [setState])

  // ── Dev helpers ───────────────────────────────────────
  const devAdvanceDay = useCallback((n = 1) => {
    setState(prev => ({
      ...prev,
      currentDay: Math.max(1, Math.min(90, prev.currentDay + n)),
    }))
  }, [setState])

  const devAddXP = useCallback((n) => addXP(n), [addXP])

  const devUnlockAll = useCallback(() => {
    setState(prev => {
      const badges = {}
      gameData.badges.forEach(b => { badges[b.id] = new Date().toLocaleDateString('en-CA') })
      return {
        ...prev,
        badges,
        unlockedThemes: gameData.themes.map(t => t.id),
        xp: 4500,
        streak: 30,
      }
    })
  }, [setState])

  const devReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(RECOVERY_KEY)
    setStateRaw({ ...DEFAULT_STATE })
  }, [])

  // ── Misc setters ──────────────────────────────────────
  const setMood = useCallback((mood) => setState(prev => ({ ...prev, todayMood: mood })), [setState])
  const setChallengeDone = useCallback(() => setState(prev => ({ ...prev, challengeDoneToday: true })), [setState])
  const setRecoveryDone = useCallback(() => setState(prev => ({ ...prev, recoveryDone: true })), [setState])
  const cycleQuote = useCallback(() => setState(prev => ({ ...prev, quoteIndex: (prev.quoteIndex + 1) % gameData.quotes.length })), [setState])
  const incrementBlocker = useCallback(() => setState(prev => ({ ...prev, blockerCount: (prev.blockerCount || 0) + 1 })), [setState])
  const incrementRecovery = useCallback(() => {
    const count = parseInt(localStorage.getItem(RECOVERY_KEY) || '0') + 1
    localStorage.setItem(RECOVERY_KEY, count)
    return count
  }, [])

  return {
    state,
    // computed
    level: getLevel(state.xp),
    nextLevel: getNextLevel(state.xp),
    levelProgress: getLevelProgress(state.xp),
    focusBlocks: getFocusBlocks(),
    recoveryCount: parseInt(localStorage.getItem(RECOVERY_KEY) || '0'),
    // actions
    addXP,
    checkTask,
    checkHabit,
    submitJournal,
    submitBlocker,
    toggleRoadmapTask,
    awardBadge,
    addFocusBlock,
    deleteFocusBlock,
    setTheme,
    checkThemeUnlocks,
    setMood,
    setChallengeDone,
    setRecoveryDone,
    cycleQuote,
    incrementBlocker,
    incrementRecovery,
    // dev
    devAdvanceDay,
    devAddXP,
    devUnlockAll,
    devReset,
  }
}
