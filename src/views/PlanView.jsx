import DayView from './DayView.jsx'
import WeekView from './WeekView.jsx'
import MonthView from './MonthView.jsx'

const MODES = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

export default function PlanView({ ctx }) {
  const { planMode, setPlanMode } = ctx
  return (
    <>
      <div className="segmented plan-switch" role="tablist" aria-label="Plan view">
        {MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={planMode === m.id}
            className={planMode === m.id ? 'on' : ''} onClick={() => setPlanMode(m.id)}>{m.label}</button>
        ))}
      </div>
      {planMode === 'day' && <DayView ctx={ctx} />}
      {planMode === 'week' && <WeekView ctx={ctx} />}
      {planMode === 'month' && <MonthView ctx={ctx} />}
    </>
  )
}
