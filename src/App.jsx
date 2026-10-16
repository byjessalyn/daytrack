import { useCallback, useEffect, useState } from 'react'
import { usePlanner } from './usePlanner.js'
import { todayKey } from './lib/dates.js'
import { onNotificationTap } from './lib/native.js'
import TaskEditor from './components/TaskEditor.jsx'
import GoalEditor from './components/GoalEditor.jsx'
import CaptureSheet from './components/CaptureSheet.jsx'
import CheckinSheet from './components/CheckinSheet.jsx'
import TodayView from './views/TodayView.jsx'
import PlanView from './views/PlanView.jsx'
import GoalsView from './views/GoalsView.jsx'
import LifeView from './views/LifeView.jsx'
import SettingsView from './views/SettingsView.jsx'

const TABS = [
  { id: 'today', label: 'Today', icon: 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 16a4 4 0 100-8 4 4 0 000 8z' },
  { id: 'plan', label: 'Plan', icon: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4' },
  { id: 'goals', label: 'Goals', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01' },
  { id: 'life', label: 'Life', icon: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z' },
]

function useToday() {
  const [today, setToday] = useState(todayKey())
  useEffect(() => {
    // Roll over at midnight and when the app is reopened on a new day.
    const tick = () => setToday(todayKey())
    const id = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [])
  return today
}

export default function App() {
  const planner = usePlanner()
  const today = useToday()
  const [tab, setTab] = useState('today')
  const [planMode, setPlanMode] = useState('day')
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  // If you were looking at "today" when the date rolled over, follow it.
  const [prevToday, setPrevToday] = useState(today)
  if (today !== prevToday) {
    setPrevToday(today)
    if (date === prevToday) setDate(today)
  }

  useEffect(() => onNotificationTap(({ date: d }) => {
    if (d) { setDate(d); setTab('plan'); setPlanMode('day') }
  }), [])

  const goToDay = useCallback((k) => { setDate(k); setTab('plan'); setPlanMode('day') }, [])

  if (!planner.data) return <div className="boot" />
  const { data } = planner

  const newTask = (fields = {}) => setEditing({
    title: '', notes: '', scope: 'day', date: tab === 'today' ? today : date,
    time: '', remind: null, repeat: 'none', list: 'personal', goalId: null, target: null,
    link: '', checklist: [], checks: {}, ...fields,
  })

  const newGoal = () => setEditingGoal({ title: '', notes: '', deadline: null, list: 'personal' })

  const ctx = {
    ...planner,
    tasks: data.tasks,
    goals: data.goals,
    checkins: data.checkins,
    goalMap: Object.fromEntries(data.goals.map(g => [g.id, g])),
    settings: data.settings,
    today, date, setDate, goToDay, newTask, planMode, setPlanMode,
    openEditor: (task) => setEditing({ ...task }),
    openGoalEditor: (goal) => setEditingGoal({ ...goal }),
    openCheckin: () => setCheckingIn(true),
    openSettings: () => setTab('settings'),
    closeSettings: () => setTab('today'),
  }

  // On Goals the + button makes a goal; everywhere else it opens quick capture.
  const onFab = () => (tab === 'goals' ? newGoal() : setCapturing(true))

  return (
    <div className="app">
      <main className="main">
        {tab === 'today' && <TodayView ctx={ctx} />}
        {tab === 'plan' && <PlanView ctx={ctx} />}
        {tab === 'goals' && <GoalsView ctx={ctx} />}
        {tab === 'life' && <LifeView ctx={ctx} />}
        {tab === 'settings' && <SettingsView ctx={ctx} />}
      </main>

      {tab !== 'settings' && (
        <button className="fab" aria-label={tab === 'goals' ? 'Add goal' : 'Capture'} onClick={onFab}>
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
        </button>
      )}

      <nav className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" width="22" height="22"><path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {capturing && (
        <CaptureSheet
          onCapture={planner.capture}
          onDetails={(title) => { setCapturing(false); newTask({ title }) }}
          onNewGoal={() => { setCapturing(false); newGoal() }}
          onClose={() => setCapturing(false)}
        />
      )}

      {checkingIn && (
        <CheckinSheet
          initial={data.checkins[today]}
          onClose={() => setCheckingIn(false)}
          onSave={(c) => { planner.saveCheckin(today, c); setCheckingIn(false) }}
        />
      )}

      {editing && (
        <TaskEditor
          initial={editing}
          goals={data.goals}
          notificationsOn={data.settings.notifications}
          onClose={() => setEditing(null)}
          onSave={(t) => { planner.saveTask(t); setEditing(null) }}
          onDelete={(id) => { planner.deleteTask(id); setEditing(null) }}
        />
      )}

      {editingGoal && (
        <GoalEditor
          initial={editingGoal}
          linkedCount={data.tasks.filter(t => t.goalId === editingGoal.id).length}
          onClose={() => setEditingGoal(null)}
          onSave={(g) => { planner.saveGoal(g); setEditingGoal(null) }}
          onDelete={(id) => { planner.deleteGoal(id); setEditingGoal(null) }}
        />
      )}
    </div>
  )
}
