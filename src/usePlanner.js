import { useCallback, useEffect, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { EMPTY_DATA, loadData, saveData } from './lib/storage.js'
import { syncNotifications, syncWidget, isNative } from './lib/native.js'
import { makeTask, newId, normaliseDate, toggleCheck, toggleDone } from './lib/tasks.js'
import { makeGoal } from './lib/goals.js'

export function usePlanner() {
  const [data, setData] = useState(null) // null while loading
  const dataRef = useRef(EMPTY_DATA)

  useEffect(() => {
    loadData().then(d => { dataRef.current = d; setData(d) })
  }, [])

  // Persist immediately (the app can be killed at any moment), but debounce the
  // heavier notification/widget sync so rapid taps batch up.
  useEffect(() => {
    if (!data) return
    dataRef.current = data
    saveData(data)
    const t = setTimeout(() => {
      syncNotifications(data.tasks, data.settings)
      syncWidget(data.tasks, data.settings)
    }, 400)
    return () => clearTimeout(t)
  }, [data])

  // Re-plan when the app comes back to the foreground: a new day may have
  // started, so the notification window and widget data need to roll forward.
  useEffect(() => {
    if (!isNative) return
    // Also flush when going to the background, in case a debounced sync is pending.
    const handle = CapApp.addListener('appStateChange', () => {
      const d = dataRef.current
      syncNotifications(d.tasks, d.settings)
      syncWidget(d.tasks, d.settings)
    })
    return () => { handle.then(h => h.remove()) }
  }, [])

  const update = useCallback((fn) => setData(prev => fn(prev)), [])

  const saveTask = useCallback((fields) => update(d => {
    const ws = d.settings.weekStartsOn
    const clean = { ...fields, date: fields.scope === 'inbox' ? null : normaliseDate(fields.scope, fields.date, ws) }
    if (clean.scope !== 'day') Object.assign(clean, { time: '', remind: null, repeat: 'none' })
    if (!clean.time) clean.remind = null
    const exists = d.tasks.some(t => t.id === clean.id)
    const tasks = exists
      ? d.tasks.map(t => (t.id === clean.id ? { ...t, ...clean } : t))
      : [...d.tasks, makeTask(clean)]
    return { ...d, tasks }
  }), [update])

  const deleteTask = useCallback((id) => update(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) })), [update])

  const toggle = useCallback((id, key) => update(d => ({
    ...d, tasks: d.tasks.map(t => (t.id === id ? toggleDone(t, key) : t)),
  })), [update])

  // Move a one-off task to another day (used for overdue → today).
  const moveTask = useCallback((id, key) => update(d => ({
    ...d, tasks: d.tasks.map(t => (t.id === id ? { ...t, date: key, done: {} } : t)),
  })), [update])

  // Quick capture: a title only, sorted later.
  const capture = useCallback((titles) => update(d => ({
    ...d,
    tasks: [...d.tasks, ...[].concat(titles).map(title => makeTask({ title, scope: 'inbox', date: null }))],
  })), [update])

  // Give an inbox item a day (or move any task to another day).
  const scheduleTask = useCallback((id, key) => update(d => ({
    ...d, tasks: d.tasks.map(t => (t.id === id ? { ...t, scope: 'day', date: key, done: {}, checks: {} } : t)),
  })), [update])

  const toggleChecklistItem = useCallback((id, key, itemId) => update(d => ({
    ...d, tasks: d.tasks.map(t => (t.id === id ? toggleCheck(t, key, itemId) : t)),
  })), [update])

  // Add the approved results of "Talk it out" in one update.
  const addProposals = useCallback((proposals) => update(d => {
    const ws = d.settings.weekStartsOn
    const tasks = [...d.tasks]
    const goals = [...d.goals]
    for (const p of proposals) {
      if (p.kind === 'goal') {
        const goal = makeGoal({ title: p.title, list: p.list, deadline: p.deadline })
        goals.push(goal)
        for (const st of p.steps) tasks.push(makeTask({ title: st.title, date: st.date, list: p.list, goalId: goal.id }))
      } else {
        tasks.push(makeTask({
          title: p.title, scope: p.scope, date: normaliseDate(p.scope, p.date, ws), time: p.time,
          repeat: p.repeat, list: p.list, goalId: p.goalId,
          checklist: p.checklist.map(text => ({ id: newId(), text })),
        }))
      }
    }
    return { ...d, tasks, goals }
  }), [update])

  const saveCheckin = useCallback((key, entry) => update(d => ({
    ...d, checkins: { ...d.checkins, [key]: { ...entry, at: Date.now() } },
  })), [update])

  const saveGoal = useCallback((fields) => update(d => {
    const exists = d.goals.some(g => g.id === fields.id)
    const goals = exists
      ? d.goals.map(g => (g.id === fields.id ? { ...g, ...fields } : g))
      : [...d.goals, makeGoal(fields)]
    return { ...d, goals }
  }), [update])

  // Deleting a goal keeps its tasks; they just stop counting toward anything.
  const deleteGoal = useCallback((id) => update(d => ({
    ...d,
    goals: d.goals.filter(g => g.id !== id),
    tasks: d.tasks.map(t => (t.goalId === id ? { ...t, goalId: null } : t)),
  })), [update])

  const setSettings = useCallback((patch) => update(d => ({ ...d, settings: { ...d.settings, ...patch } })), [update])

  const replaceAll = useCallback((next) => setData(next), [])

  return {
    data, saveTask, deleteTask, toggle, moveTask, capture, scheduleTask, toggleChecklistItem,
    addProposals, saveCheckin, saveGoal, deleteGoal, setSettings, replaceAll,
  }
}
