import { useCallback, useEffect, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { EMPTY_DATA, loadData, saveData } from './lib/storage.js'
import { syncNotifications, syncWidget, isNative } from './lib/native.js'
import { makeTask, normaliseDate, toggleDone } from './lib/tasks.js'
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
    const clean = { ...fields, date: normaliseDate(fields.scope, fields.date, ws) }
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

  return { data, saveTask, deleteTask, toggle, moveTask, saveGoal, deleteGoal, setSettings, replaceAll }
}
