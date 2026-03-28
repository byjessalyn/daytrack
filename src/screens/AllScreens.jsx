// QuestsScreen.jsx
import React, { useState } from 'react'
import gameData from '../data/gameData.json'
import days from '../data/days.json'

export function QuestsScreen({ ctx }) {
  const { store, addXP, openChallenge } = ctx
  const { state } = store
  const [blockerText, setBlockerText] = useState('')
  const [journalText, setJournalText] = useState('')

  const now = new Date()
  const dow = now.getDay()
  const theme = gameData.dayThemes[dow]
  const dateStr = now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })
  const quests = gameData.habitQuests[dow] || gameData.habitQuests[1]
  const dayData = days[state.currentDay - 1] || days[0]
  const tasks = state.completedTasks[state.currentDay] || {}

  // Calculate today's XP
  const earnedQuest = quests.reduce((a, q, i) => a + (tasks[`q${i}`] ? q.xp : 0), 0)
  const earned90 = (tasks.morning ? 30 : 0) + (tasks.evening ? 40 : 0) + (tasks.content && dayData.content !== 'None' && dayData.content !== 'None yet' ? 25 : 0)
  const totalPossible = quests.reduce((a, q) => a + q.xp, 0) + 70
  const totalEarned = earnedQuest + earned90
  const pct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0

  const phaseClass = `p${dayData.phase}-accent`

  return (
    <div className="fade-in">
      <div className="quests-hero">
        <div className="quests-title">Daily Quests ✨</div>
        <div className="quests-sub">{theme.icon} {theme.label} — Day {state.currentDay}</div>
        <div className="quests-date">{dateStr}</div>
      </div>

      {/* XP today bar */}
      <div className="xp-today">
        <div className="xp-today-top">
          <div className="xp-today-lbl">Today's XP</div>
          <div className="xp-today-val">{totalEarned} / {totalPossible} ✨</div>
        </div>
        <div className="xp-bar"><div className="xp-fill" style={{ width: `${pct}%` }} /></div>
        <div className="xp-pct">{pct}% of quests done today</div>
      </div>

      {/* 90-day tasks */}
      <div className="section-label">📅 Today's 90-Day Tasks</div>
      {['morning', 'evening'].map(type => {
        const xp = type === 'morning' ? 30 : 40
        const icon = type === 'morning' ? '🌅' : '🌙'
        const done = tasks[type]
        return (
          <div
            key={type}
            className={`quest-task ${phaseClass} ${done ? 'done' : ''}`}
            onClick={() => !done && (store.checkTask(state.currentDay, type, xp), addXP(0, `+${xp} XP`))}
          >
            <div className={`qt-check ${done ? 'done' : ''}`}>{done ? '✓' : ''}</div>
            <span className="qt-icon">{icon}</span>
            <div className="qt-body">
              <div className={`qt-text ${done ? 'done' : ''}`}>{dayData[type]}</div>
              <div className="qt-xp">+{xp} XP · {type}</div>
            </div>
          </div>
        )
      })}
      {dayData.content !== 'None' && dayData.content !== 'None yet' && (
        <div
          className={`quest-task ${phaseClass} ${tasks.content ? 'done' : ''}`}
          onClick={() => !tasks.content && (store.checkTask(state.currentDay, 'content', 25), addXP(0, '+25 XP'))}
        >
          <div className={`qt-check ${tasks.content ? 'done' : ''}`}>{tasks.content ? '✓' : ''}</div>
          <span className="qt-icon">📱</span>
          <div className="qt-body">
            <div className={`qt-text ${tasks.content ? 'done' : ''}`}>{dayData.content}</div>
            <div className="qt-xp">+25 XP · content</div>
          </div>
        </div>
      )}
      {/* Win condition */}
      <div className="card win-card">
        <div className="win-label">🏆 today you win if</div>
        <div className="win-text">{dayData.win}</div>
      </div>

      {/* Habit quests */}
      <div className="section-label">
        ✨ Habit Quests{' '}
        <span style={{ fontSize: 10, color: 'var(--text-s)', fontWeight: 600 }}>
          Phase {dayData.phase}: {['','Build the Foundation','Find What Sells','Scale & Systematise'][dayData.phase]}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-s)', fontWeight: 600, padding: '0 14px 8px' }}>
        Day-of-week habits · {theme.label}
      </div>
      {quests.map((q, i) => {
        const done = tasks[`q${i}`]
        return (
          <div
            key={i}
            className={`quest-task ${done ? 'done' : ''}`}
            onClick={() => !done && (store.checkHabit(state.currentDay, i, q.xp), addXP(0, `+${q.xp} XP`))}
          >
            <div className={`qt-check ${done ? 'done' : ''}`}>{done ? '✓' : ''}</div>
            <span className="qt-icon">{q.icon}</span>
            <div className="qt-body">
              <div className={`qt-text ${done ? 'done' : ''}`}>{q.text}</div>
              <div className="qt-xp">+{q.xp} XP</div>
            </div>
          </div>
        )
      })}

      {/* Inline journal */}
      <div className="section-label">📔 Journal Entry <span style={{ fontSize: 10, background: 'var(--yellow)', color: '#7A5010', padding: '2px 8px', borderRadius: 50, marginLeft: 4, fontWeight: 800 }}>+20 XP</span></div>
      {state.todayJournalDone ? (
        <div className="inline-journal"><div className="ij-done">✓ journal saved for today! great work 🌸</div></div>
      ) : (
        <div className="inline-journal">
          <textarea
            className="ij-textarea"
            placeholder="What did you create today? Any wins? How's the byjessalyn journey going?..."
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
          />
          <button className="ij-submit" onClick={() => {
            if (!journalText.trim()) return
            store.submitJournal('What did you create today? Any wins?', journalText, 20)
            addXP(0, '+20 XP 📓')
            setJournalText('')
          }}>
            Save entry +20 XP ✨
          </button>
        </div>
      )}

      {/* Blocker */}
      <div className="section-label">🧱 Blocker Busted <span style={{ fontSize: 10, background: 'var(--red)', color: '#fff', padding: '2px 8px', borderRadius: 50, marginLeft: 4, fontWeight: 800 }}>+10 XP</span></div>
      {state.todayBlockerDone ? (
        <div className="inline-journal"><div className="ij-done">✓ blocker logged! +10 XP earned 💪</div></div>
      ) : (
        <div className="inline-journal">
          <textarea
            className="ij-textarea"
            placeholder="Did you overcome procrastination, self-doubt, or a creative block today?"
            value={blockerText}
            onChange={e => setBlockerText(e.target.value)}
          />
          <button
            className="ij-submit"
            style={{ background: 'linear-gradient(135deg, var(--lavender-d), #A080D0)' }}
            onClick={() => {
              if (!blockerText.trim()) return
              store.submitBlocker()
              addXP(0, '+10 XP 💪')
              setBlockerText('')
            }}
          >
            Log it +10 XP ✨
          </button>
        </div>
      )}

      <div style={{ margin: '4px 14px 12px' }}>
        <button className="btn btn-primary btn-full" onClick={openChallenge}>
          ✨ daily blocker challenge
        </button>
      </div>
      <div className="spacer" />
    </div>
  )
}

// MapScreen.jsx
import days2 from '../data/days.json'

export function MapScreen({ ctx }) {
  const { store } = ctx
  const { state } = store
  const [detailDay, setDetailDay] = useState(null)

  const phases = [1, 2, 3]

  function getStatus(d) {
    const t = state.completedTasks[d.day] || {}
    const hc = d.content !== 'None' && d.content !== 'None yet'
    const allDone = t.morning && t.evening && (!hc || t.content)
    if (d.day === state.currentDay) return 'active'
    if (allDone) return 'complete'
    if (d.day < state.currentDay) return 'missed'
    return 'locked'
  }

  const STATUS_ICON = { active: '▶️', complete: '🌸', missed: '👻', locked: '🔒' }

  return (
    <div className="map-screen fade-in">
      <div className="screen-hero" style={{ paddingTop: 48 }}>
        <h2>90-Day Map 🗺️</h2>
        <p>tap any day to see the full quest</p>
      </div>

      {phases.map(phase => (
        <div key={phase}>
          <div className="phase-divider">
            <div className="pdl" />
            <div className={`pd-label pd-p${phase}`}>Phase {phase}</div>
            <div className="pdl" />
          </div>
          <div className="day-grid">
            {days2.filter(d => d.phase === phase).map(d => {
              const status = getStatus(d)
              return (
                <div
                  key={d.day}
                  className={`day-tile ${status}`}
                  onClick={() => setDetailDay(d)}
                >
                  <span className="dt-num">{d.day}</span>
                  <span className="dt-icon">{STATUS_ICON[status]}</span>
                  <span className="dt-slot">{d.dateSlot}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="spacer" />

      {/* Day detail bottom sheet */}
      {detailDay && (
        <div className="overlay-backdrop bottom" onClick={e => e.target === e.currentTarget && setDetailDay(null)}>
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="dd-daynum">Day {detailDay.day} · Phase {detailDay.phase} · {detailDay.dateSlot}</div>
            <div className="dd-section">
              <div className="dd-sec-lbl">🌅 Morning Task</div>
              <div className="dd-sec-text">{detailDay.morning}</div>
            </div>
            <div className="dd-section">
              <div className="dd-sec-lbl">🌙 Evening Task</div>
              <div className="dd-sec-text">{detailDay.evening}</div>
            </div>
            <div className="dd-section">
              <div className="dd-sec-lbl">📱 Content Task</div>
              <div className="dd-sec-text">{detailDay.content}</div>
            </div>
            <div className="dd-section dd-win-box">
              <div className="dd-sec-lbl">🏆 Win Condition</div>
              <div className="dd-sec-text" style={{ fontStyle: 'italic' }}>{detailDay.win}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// BadgesScreen.jsx
export function BadgesScreen({ ctx }) {
  const { store } = ctx
  const { state } = store
  const earned = Object.keys(state.badges).length
  const total = gameData.badges.length

  return (
    <div className="badges-screen fade-in">
      <div className="screen-hero" style={{ paddingTop: 48 }}>
        <h2>Badge Collection ✨</h2>
        <p>{earned} of {total} badges bloomed</p>
      </div>

      <div className="bloom-banner">
        <span className="bb-icon">{earned === 0 ? '🌱' : '✨'}</span>
        <div className="bb-text">
          {earned === 0
            ? 'Just planted — first badge incoming! 🌱'
            : `${earned} badge${earned > 1 ? 's' : ''} bloomed! keep growing 🌸`}
        </div>
      </div>

      <div className="badge-grid">
        {gameData.badges.map(b => {
          const e = state.badges[b.id]
          return (
            <div key={b.id} className={`badge-item ${e ? 'earned' : 'locked'}`}>
              <span className="bi-icon">{b.icon}</span>
              <div className="bi-name">{b.name}</div>
              <div className="bi-desc">{b.desc}</div>
              {e ? (
                <>
                  <div className="bi-xp">🔥 +{b.xp} XP</div>
                  <div className="bi-date">{e}</div>
                </>
              ) : (
                <div className="bi-lock">🔒 still growing</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="spacer" />
    </div>
  )
}

// RoadmapScreen.jsx
export function RoadmapScreen({ ctx }) {
  const { store, addXP } = ctx
  const { state, toggleRoadmapTask } = store

  return (
    <div className="roadmap-screen fade-in">
      <div className="screen-hero" style={{ paddingTop: 48 }}>
        <h2>byjessalyn Roadmap 🗺️</h2>
        <p>Stickers · Prints · Community · Storefront</p>
      </div>

      <div className="rm-goals">
        <div>
          <div className="rm-goal-val">$5,000</div>
          <div className="rm-goal-label">Monthly Goal (CAD)</div>
        </div>
        <div>
          <div className="rm-goal-val">Yr 7–10</div>
          <div className="rm-goal-label">Storefront Dream 🏪</div>
        </div>
      </div>

      {gameData.roadmap.map(phase => {
        const done = phase.tasks.filter((_, i) => state.roadmapTasks[`${phase.phase}_${i}`]).length
        const pct = Math.round((done / phase.tasks.length) * 100)
        return (
          <div key={phase.phase} className="rm-phase">
            <div className="rm-phase-header">
              <div className="rph-left">
                <div className="rph-emoji">{phase.emoji}</div>
                <div>
                  <div className="rph-title">{phase.title}</div>
                  <div className="rph-range">{phase.range} · {phase.income}</div>
                </div>
              </div>
              <div className="rph-pct">{pct}%</div>
            </div>
            <div className="rm-prog-wrap">
              <div className={`rm-prog-fill rp${phase.phase}-fill`} style={{ width: `${pct}%` }} />
            </div>
            <div className="rm-count">{done} of {phase.tasks.length} tasks complete</div>
            {phase.tasks.map((t, i) => {
              const taskDone = state.roadmapTasks[`${phase.phase}_${i}`]
              return (
                <div key={i} className="rm-task" onClick={() => { toggleRoadmapTask(phase.phase, i); if (!taskDone) addXP(0, '+15 XP 📍') }}>
                  <div className={`rm-check ${taskDone ? 'done' : ''}`}>{taskDone ? '✓' : ''}</div>
                  <div className={`rm-task-text ${taskDone ? 'done' : ''}`}>{t.text}</div>
                  <span className={`rm-tag tag-${t.tag}`}>{t.tag}</span>
                </div>
              )
            })}
          </div>
        )
      })}
      <div className="spacer" />
    </div>
  )
}

// AnalyticsScreen.jsx
import { useEffect, useRef as useRef2 } from 'react'

export function AnalyticsScreen({ ctx }) {
  const { store } = ctx
  const { state, level } = store
  const xpCanvasRef = useRef2(null)
  const habitsCanvasRef = useRef2(null)

  const earned = Object.keys(state.badges).length

  useEffect(() => {
    drawXPChart()
    drawHabitsChart()
  })

  function drawXPChart() {
    const canvas = xpCanvasRef.current
    if (!canvas) return
    const ctx2 = canvas.getContext('2d')
    const W = canvas.offsetWidth, H = 100
    canvas.width = W; canvas.height = H
    const labels = [], data = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      labels.push(d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }))
      data.push(state.xpHistory[d.toDateString()] || 0)
    }
    drawLine(ctx2, W, H, data, labels, '#F4A0A0')
  }

  function drawHabitsChart() {
    const canvas = habitsCanvasRef.current
    if (!canvas) return
    const ctx2 = canvas.getContext('2d')
    const W = canvas.offsetWidth, H = 100
    canvas.width = W; canvas.height = H
    const labels = ['Fri','Sat','Sun','Mon','Tue','Wed','Thu']
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      data.push(state.habitHistory[d.toDateString()] || 0)
    }
    drawBars(ctx2, W, H, data, labels, '#A8D8EA')
  }

  function drawLine(ctx2, W, H, data, labels, color) {
    ctx2.clearRect(0, 0, W, H)
    const max = Math.max(...data, 4)
    const pad = { l: 20, r: 10, t: 10, b: 24 }
    const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + gH * (1 - i / 4)
      ctx2.strokeStyle = 'rgba(200,160,160,0.15)'; ctx2.lineWidth = 1
      ctx2.beginPath(); ctx2.moveTo(pad.l, y); ctx2.lineTo(W - pad.r, y); ctx2.stroke()
      ctx2.fillStyle = 'rgba(150,110,110,0.5)'; ctx2.font = '9px Nunito'
      ctx2.textAlign = 'right'; ctx2.fillText(Math.round(max * i / 4), 18, y + 3)
    }
    if (data.length < 2) return
    const pts = data.map((v, i) => ({ x: pad.l + i * (gW / (data.length - 1)), y: pad.t + gH * (1 - v / max) }))
    const grad = ctx2.createLinearGradient(0, pad.t, 0, H - pad.b)
    grad.addColorStop(0, color + '55'); grad.addColorStop(1, color + '00')
    ctx2.beginPath(); ctx2.moveTo(pts[0].x, H - pad.b)
    pts.forEach(p => ctx2.lineTo(p.x, p.y))
    ctx2.lineTo(pts[pts.length - 1].x, H - pad.b); ctx2.closePath()
    ctx2.fillStyle = grad; ctx2.fill()
    ctx2.beginPath(); ctx2.moveTo(pts[0].x, pts[0].y)
    pts.forEach(p => ctx2.lineTo(p.x, p.y))
    ctx2.strokeStyle = color; ctx2.lineWidth = 2; ctx2.stroke()
    pts.forEach(p => {
      ctx2.beginPath(); ctx2.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx2.fillStyle = color; ctx2.fill()
      ctx2.strokeStyle = '#fff'; ctx2.lineWidth = 1.5; ctx2.stroke()
    })
    ctx2.fillStyle = 'rgba(150,110,110,0.6)'; ctx2.font = '8px Nunito'; ctx2.textAlign = 'center'
    labels.forEach((l, i) => { if (i % 3 === 0 || i === labels.length - 1) ctx2.fillText(l, pts[i].x, H - 4) })
  }

  function drawBars(ctx2, W, H, data, labels, color) {
    ctx2.clearRect(0, 0, W, H)
    const max = Math.max(...data, 4)
    const pad = { l: 20, r: 10, t: 10, b: 24 }
    const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b
    const bW = Math.floor((gW / data.length) * 0.6)
    data.forEach((v, i) => {
      const x = pad.l + i * (gW / data.length) + (gW / data.length - bW) / 2
      const barH = v > 0 ? Math.max(3, (v / max) * gH) : 0
      const y = pad.t + gH - barH
      const grad = ctx2.createLinearGradient(0, y, 0, y + barH)
      grad.addColorStop(0, color); grad.addColorStop(1, color + '88')
      ctx2.fillStyle = grad
      ctx2.beginPath()
      if (ctx2.roundRect) ctx2.roundRect(x, y, bW, barH, 3)
      else ctx2.rect(x, y, bW, barH)
      ctx2.fill()
      ctx2.fillStyle = 'rgba(100,80,80,0.55)'; ctx2.font = '9px Nunito'; ctx2.textAlign = 'center'
      ctx2.fillText(labels[i], x + bW / 2, H - 4)
    })
  }

  return (
    <div className="analytics-screen fade-in">
      <div className="screen-hero" style={{ paddingTop: 48 }}>
        <h2>Analytics 📊</h2>
        <p>Your byjessalyn growth story</p>
      </div>

      <div className="an-stats">
        {[
          { icon: '⚡', val: state.xp,     lbl: 'Total XP' },
          { icon: '🌸', val: level.level,  lbl: 'Level'    },
          { icon: '🔥', val: `${state.streak}d`, lbl: 'Streak' },
          { icon: '🎯', val: `${earned}/${gameData.badges.length}`, lbl: 'Milestones' },
        ].map((s, i) => (
          <div key={i} className="an-stat">
            <span className="as-icon">{s.icon}</span>
            <span className="as-val">{s.val}</span>
            <span className="as-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      <div className="chart-card">
        <div className="chart-title">✨ XP Earned — Last 14 Days</div>
        <canvas ref={xpCanvasRef} style={{ width: '100%', height: 100 }} />
      </div>

      <div className="chart-card">
        <div className="chart-title">🌿 Habits Completed — This Week</div>
        <canvas ref={habitsCanvasRef} style={{ width: '100%', height: 100 }} />
      </div>

      <div className="chart-card">
        <div className="chart-title">💰 Revenue Targets</div>
        <div className="rev-grid">
          {[
            { val: '$5,000 CAD', lbl: 'Monthly Goal',   tag: 'target' },
            { val: '$18K',       lbl: 'Year 1 Target',   tag: 'ramp-up year' },
            { val: '$60K+',      lbl: 'Year 3 Target',   tag: 'full-time income' },
            { val: 'Yr 7–10',    lbl: 'Storefront Goal', tag: 'physical space' },
          ].map((r, i) => (
            <div key={i} className="rev-item">
              <div className="ri-val">{r.val}</div>
              <div className="ri-lbl">{r.lbl}</div>
              <div className="ri-tag">{r.tag}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">🎨 Revenue Mix at $5K/mo</div>
        {[
          { lbl: 'POD / Shop', pct: 35, color: 'var(--red)',        amt: '$1,750' },
          { lbl: 'Freelance',  pct: 30, color: 'var(--lavender-d)', amt: '$1,500' },
          { lbl: 'Markets',    pct: 10, color: 'var(--yellow-d)',    amt: '$500'   },
          { lbl: 'Community',  pct: 25, color: 'var(--mint-d)',      amt: '$1,250' },
        ].map((r, i) => (
          <div key={i} className="mix-row">
            <div className="mix-lbl">{r.lbl}</div>
            <div className="mix-bar-wrap">
              <div className="mix-bar-fill" style={{ width: `${r.pct}%`, background: r.color }} />
            </div>
            <div className="mix-amt">{r.amt}</div>
          </div>
        ))}
      </div>

      <div className="spacer" />
    </div>
  )
}

// FocusScreen.jsx
export function FocusScreen({ ctx }) {
  const { store, timer } = ctx
  const { focusBlocks, addFocusBlock, deleteFocusBlock } = store
  const [showForm, setShowForm] = useState(false)
  const [fbName, setFbName] = useState('')
  const [fbTime, setFbTime] = useState('09:00')
  const [fbDur, setFbDur] = useState('60')
  const [fbDays, setFbDays] = useState('')

  function saveBlock() {
    if (!fbName.trim()) return
    addFocusBlock({ name: fbName, icon: '⏱️', time: fbTime, dur: parseInt(fbDur) || 60, days: fbDays, color: '#DDD0F0' })
    setFbName(''); setFbTime('09:00'); setFbDur('60'); setFbDays('')
    setShowForm(false)
  }

  return (
    <div className="focus-screen fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '48px 14px 12px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: 28, color: 'var(--text)' }}>Focus Blocks ⏰</h2>
          <p style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 3 }}>Protect your creative time 🌸</p>
        </div>
        <button className="focus-add-btn" style={{ marginTop: 8 }} onClick={() => setShowForm(true)}>+ Add Block</button>
      </div>

      {focusBlocks.map(b => (
        <div key={b.id} className="focus-block-card">
          <div className="fbc-icon-wrap" style={{ background: b.color + '33' }}>{b.icon}</div>
          <div className="fbc-body">
            <div className="fbc-name">{b.name}</div>
            <div className="fbc-meta">{b.time} · {b.dur}min · {b.days}</div>
          </div>
          <div className="fbc-actions">
            <button className="fbc-play" onClick={() => timer.startBlock(b)}>▶</button>
            <button className="fbc-delete" onClick={() => deleteFocusBlock(b.id)}>🗑</button>
          </div>
        </div>
      ))}
      <div className="spacer" />

      {showForm && (
        <div className="overlay-backdrop bottom" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 18 }}>Add Focus Block ⏰</div>
            <div className="fb-form">
              <div className="fb-form-lbl">Block Name</div>
              <input className="fb-form-input" placeholder="e.g. Design & Illustration" value={fbName} onChange={e => setFbName(e.target.value)} maxLength={40} />
              <div className="fb-form-row">
                <div>
                  <div className="fb-form-lbl">Time</div>
                  <input className="fb-form-input" type="time" value={fbTime} onChange={e => setFbTime(e.target.value)} />
                </div>
                <div>
                  <div className="fb-form-lbl">Duration (min)</div>
                  <input className="fb-form-input" type="number" value={fbDur} min={5} max={240} onChange={e => setFbDur(e.target.value)} />
                </div>
              </div>
              <div className="fb-form-lbl">Days</div>
              <input className="fb-form-input" placeholder="e.g. Mon, Wed, Fri" value={fbDays} onChange={e => setFbDays(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={saveBlock}>Add Block ✨</button>
          </div>
        </div>
      )}
    </div>
  )
}

// JournalScreen.jsx
export function JournalScreen({ ctx }) {
  const { store, addXP } = ctx
  const { state, submitJournal } = store
  const [text, setText] = useState('')

  const dow = new Date().getDay()
  const futureMsg = gameData.futureSelfMessages[dow % gameData.futureSelfMessages.length]
  const prompt = gameData.journalPrompts[state.currentDay % gameData.journalPrompts.length]
  const todayDone = state.journalEntries.some(e => e.dayNum === state.currentDay)

  return (
    <div className="journal-screen fade-in">
      <div className="screen-hero" style={{ paddingTop: 48 }}>
        <h2>Reflection Log 📓</h2>
        <p>from past you to future you</p>
      </div>

      <div className="future-card">
        <div className="future-card-lbl">📬 From Your Future Self</div>
        <div className="future-card-text">"{futureMsg}"</div>
      </div>

      {!todayDone && (
        <div className="journal-prompt-card">
          <div className="jpc-lbl">✍️ Today's Reflection</div>
          <div className="jpc-prompt">{prompt}</div>
          <textarea className="jpc-ta" placeholder="write here..." value={text} onChange={e => setText(e.target.value)} />
          <button className="jpc-submit" onClick={() => {
            if (!text.trim()) return
            submitJournal(prompt, text, 15)
            addXP(0, '+15 XP 📓')
            setText('')
          }}>
            save +15 XP ✨
          </button>
        </div>
      )}

      <div className="section-label">Past Reflections</div>
      {state.journalEntries.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📓</span>
          <p>your reflections will live here.<br />start with today's prompt above 🌸</p>
        </div>
      ) : (
        [...state.journalEntries].reverse().map((e, i) => (
          <div key={i} className="journal-entry">
            <div className="je-meta">
              <span className="je-day">Day {e.dayNum}</span>
              <span className="je-date">{e.date}</span>
            </div>
            <div className="je-prompt">{e.prompt}</div>
            <div className="je-text">{e.text}</div>
          </div>
        ))
      )}
      <div className="spacer" />
    </div>
  )
}
