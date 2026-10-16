import { formatDay } from '../lib/dates.js'
import { SCALES, average, checkinStreak, needsSupport, recentCheckins } from '../lib/checkins.js'
import { Empty } from '../components/ui.jsx'
import { SupportCard } from './TodayView.jsx'

function MoodChart({ days }) {
  // 14 columns, bar height = mood (1–5); empty days show a dot.
  return (
    <div className="mood-chart" role="img" aria-label="Mood over the last 14 days">
      {days.map(({ key, entry }) => (
        <div key={key} className="mood-col" title={entry ? `${key}: ${SCALES[0].options[entry.mood - 1]}` : `${key}: no check-in`}>
          <div className="mood-bar-wrap">
            {entry?.mood
              ? <div className={`mood-bar m${entry.mood}`} style={{ height: `${entry.mood * 20}%` }} />
              : <div className="mood-empty" />}
          </div>
          <span className="mood-day">{formatDay(key, { weekday: 'narrow' })}</span>
        </div>
      ))}
    </div>
  )
}

export default function LifeView({ ctx }) {
  const { checkins, today, openCheckin } = ctx
  const days = recentCheckins(checkins, today, 14)
  const entries = days.map(d => d.entry).filter(Boolean)
  const streak = checkinStreak(checkins, today)

  const feelingCounts = {}
  entries.forEach(e => (e.feelings || []).forEach(f => { feelingCounts[f] = (feelingCounts[f] || 0) + 1 }))
  const topFeelings = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const goodThings = days.filter(d => d.entry?.gratitude).slice(-5).reverse()

  return (
    <div className="view">
      <div className="nav"><div className="nav-title"><h1>Life</h1></div></div>

      <section>
        <div className="section-row">
          <h2 className="section-title">Wellbeing · last 14 days</h2>
          <button className="pill" onClick={openCheckin}>{checkins[today] ? 'Edit today' : 'Check in'}</button>
        </div>

        {needsSupport(checkins, today) && <SupportCard />}

        {entries.length ? (
          <div className="card pad wellbeing">
            <MoodChart days={days} />
            <div className="stat-grid">
              {SCALES.map(s => {
                const avg = average(entries, s.id)
                return (
                  <div key={s.id} className="stat">
                    <span className="muted small">{s.label}</span>
                    <strong>{avg == null ? '–' : s.options[Math.round(avg) - 1]}</strong>
                    <span className="muted small">{avg == null ? 'no data' : `avg ${avg} / 5`}</span>
                  </div>
                )
              })}
            </div>
            <p className="muted small">
              {streak ? `${streak}-day check-in streak.` : 'No current streak.'} {entries.length} check-in{entries.length === 1 ? '' : 's'} in 14 days.
              {' '}For stress, lower is calmer.
            </p>
          </div>
        ) : (
          <Empty>Check in once a day and your mood, energy, stress and sleep trends show up here.</Empty>
        )}

        {topFeelings.length > 0 && (
          <div className="card pad">
            <strong className="block">Most common feelings</strong>
            <div className="chips top-gap">
              {topFeelings.map(([f, n]) => <span key={f} className="chip plain static">{f} · {n}</span>)}
            </div>
          </div>
        )}

        {goodThings.length > 0 && (
          <div className="card pad">
            <strong className="block">Good things</strong>
            <ul className="good-things">
              {goodThings.map(d => (
                <li key={d.key}><span className="muted small">{formatDay(d.key, { month: 'short', day: 'numeric' })}</span> {d.entry.gratitude}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
