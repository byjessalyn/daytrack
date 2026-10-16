import { useCallback, useEffect, useState } from 'react'
import { usePlanner } from './usePlanner.js'
import { todayKey } from './lib/dates.js'
import { onNotificationTap } from './lib/native.js'
import TaskEditor from './components/TaskEditor.jsx'
import DayView from './views/DayView.jsx'
import WeekView from './views/WeekView.jsx'
import MonthView from './views/MonthView.jsx'
import SettingsView from './views/SettingsView.jsx'
import GoalsView from './views/GoalsView.jsx'
import GoalEditor from './components/GoalEditor.jsx'

const TABS = [
  { id: 'day', label: 'Day', icon: 'M4 6h16M4 12h16M4 18h10' },
  { id: 'week', label: 'Week', icon: 'M4 5h16v15H4zM4 10h16M9 5v15M14 5v15' },
  { id: 'month', label: 'Month', icon: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4' },
  { id: 'goals', label: 'Goals', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01' },
  { id: 'settings', label: 'Settings', icon: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4' },
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
  const [tab, setTab] = useState('day')
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)

  // If you were looking at "today" when the date rolled over, follow it.
  const [prevToday, setPrevToday] = useState(today)
  if (today !== prevToday) {
    setPrevToday(today)
    if (date === prevToday) setDate(today)
  }

  useEffect(() => onNotificationTap(({ date: d }) => {
    if (d) { setDate(d); setTab('day') }
  }), [])

  const goToDay = useCallback((k) => { setDate(k); setTab('day') }, [])

  if (!planner.data) return <div className="boot" />
  const { data } = planner

  const newTask = (fields = {}) => setEditing({
    title: '', notes: '', scope: 'day',
    date, time: '', remind: null, repeat: 'none', list: 'personal', goalId: null, target: null, ...fields,
  })

  const newGoal = () => setEditingGoal({ title: '', notes: '', deadline: null, list: 'personal' })

  const ctx = {
    ...planner,
    tasks: data.tasks,
    goals: data.goals,
    goalMap: Object.fromEntries(data.goals.map(g => [g.id, g])),
    openGoalEditor: (goal) => setEditingGoal({ ...goal }),
    settings: data.settings,
    today, date, setDate, goToDay, newTask,
    openEditor: (task) => setEditing({ ...task }),
  }

  return (
    <div className="app">
      <main className="main">
        {tab === 'day' && <DayView ctx={ctx} />}
        {tab === 'week' && <WeekView ctx={ctx} />}
        {tab === 'month' && <MonthView ctx={ctx} />}
        {tab === 'goals' && <GoalsView ctx={ctx} />}
        {tab === 'settings' && <SettingsView ctx={ctx} />}
      </main>

      {tab !== 'settings' && (
        <button className="fab" aria-label={tab === 'goals' ? 'Add goal' : 'Add task'} onClick={() => (tab === 'goals' ? newGoal() : newTask())}>
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
