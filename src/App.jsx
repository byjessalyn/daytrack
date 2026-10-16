import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlanner } from './usePlanner.js'
import { todayKey } from './lib/dates.js'
import { onNotificationTap } from './lib/native.js'
import TaskEditor from './components/TaskEditor.jsx'
import GoalEditor from './components/GoalEditor.jsx'
import CaptureSheet from './components/CaptureSheet.jsx'
import CheckinSheet from './components/CheckinSheet.jsx'
import TalkSheet from './components/TalkSheet.jsx'
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

// iOS doesn't shrink the page when the keyboard opens, so bottom sheets end up
// behind it. Track the visible area and size sheets to fit inside it.
function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const sync = () => {
      root.style.setProperty('--vvh', `${vv.height}px`)
      root.style.setProperty('--vvtop', `${vv.offsetTop}px`)
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    // Keep the field being typed in visible once the keyboard has opened.
    const onFocus = (e) => {
      if (!e.target.closest?.('.sheet')) return
      setTimeout(() => e.target.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 300)
    }
    document.addEventListener('focusin', onFocus)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      document.removeEventListener('focusin', onFocus)
    }
  }, [])
}

// Horizontal swipe anywhere on the screen switches tabs. Listens on the whole
// document, because short pages leave empty space outside the page content.
// Ignores mostly-vertical drags, drags that start in a form field, on the tab
// bar or near the screen edge (the system back gesture lives there), and
// anything while a sheet is open. A touch that the browser cancels (for
// example because the page started scrolling) still counts from its last move.
function useSwipe(enabled, onSwipe) {
  const cb = useRef(onSwipe)
  cb.current = onSwipe
  useEffect(() => {
    if (!enabled) return
    let start = null
    let last = null
    const down = (e) => {
      const t = e.touches[0]
      const edge = 24
      start = null
      if (e.touches.length > 1 || t.clientX < edge || t.clientX > window.innerWidth - edge) return
      if (e.target.closest?.('input, textarea, select, .dock, .sheet-backdrop, [data-noswipe]')) return
      if (document.querySelector('.sheet-backdrop')) return
      start = { x: t.clientX, y: t.clientY, at: Date.now() }
      last = { x: t.clientX, y: t.clientY }
    }
    const move = (e) => {
      if (!start) return
      const t = e.touches[0]
      last = { x: t.clientX, y: t.clientY }
    }
    const finish = (e) => {
      if (!start) return
      const t = e.changedTouches?.[0]
      const end = t ? { x: t.clientX, y: t.clientY } : last
      const dx = end.x - start.x
      const dy = end.y - start.y
      const quick = Date.now() - start.at < 800
      start = null
      if (quick && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) cb.current(dx < 0 ? 1 : -1)
    }
    document.addEventListener('touchstart', down, { passive: true })
    document.addEventListener('touchmove', move, { passive: true })
    document.addEventListener('touchend', finish, { passive: true })
    document.addEventListener('touchcancel', finish, { passive: true })
    return () => {
      document.removeEventListener('touchstart', down)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', finish)
      document.removeEventListener('touchcancel', finish)
    }
  }, [enabled])
}

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
  useVisualViewport()
  const [tab, setTab] = useState('today')
  const [planMode, setPlanMode] = useState('day')
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [talking, setTalking] = useState(false)
  const [slide, setSlide] = useState('')

  const goTab = (id) => {
    const from = TABS.findIndex(t => t.id === tab)
    const to = TABS.findIndex(t => t.id === id)
    setSlide(from >= 0 && to >= 0 && to !== from ? (to > from ? 'slide-next' : 'slide-prev') : '')
    setTab(id)
  }
  useSwipe(!!planner.data, (dir) => {
    const i = TABS.findIndex(t => t.id === tab)
    if (i < 0) return // settings isn't part of the swipe order
    const next = TABS[i + dir]
    if (next) goTab(next.id)
  })

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
      <main className={`main ${slide}`}>
        {tab === 'today' && <TodayView ctx={ctx} />}
        {tab === 'plan' && <PlanView ctx={ctx} />}
        {tab === 'goals' && <GoalsView ctx={ctx} />}
        {tab === 'life' && <LifeView ctx={ctx} />}
        {tab === 'settings' && <SettingsView ctx={ctx} />}
      </main>

      <div className="dock">
        <nav className="tabbar" aria-label="Main">
          {TABS.map(t => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => goTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        {tab !== 'settings' && (
          <button className="fab" aria-label={tab === 'goals' ? 'Add goal' : 'Capture'} onClick={onFab}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>

      {capturing && (
        <CaptureSheet
          onCapture={planner.capture}
          onDetails={(title) => { setCapturing(false); newTask({ title }) }}
          onNewGoal={() => { setCapturing(false); newGoal() }}
          onTalk={() => { setCapturing(false); setTalking(true) }}
          onClose={() => setCapturing(false)}
        />
      )}

      {talking && (
        <TalkSheet
          today={today} settings={data.settings} goals={data.goals}
          onClose={() => setTalking(false)}
          onInbox={(lines) => { planner.capture(lines); setTalking(false); setTab('today') }}
          onAdd={(items) => { planner.addProposals(items); setTalking(false); setTab('today') }}
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
