// "Talk it out": turn a spoken or typed brain dump into tasks and goals,
// sized by effort. Claude does the reading; everything it returns is checked
// here before it can touch the plan.
import { addDays, formatDay, fromKey, toKey } from './dates.js'
import { LISTS, REPEATS } from './tasks.js'

const SCOPES = ['day', 'week', 'month']
const LIST_IDS = LISTS.map(l => l.id)
const REPEAT_IDS = REPEATS.map(r => r.id)

export function buildSortPrompt(text, { today, weekStartsOn = 1, goals = [] }) {
  const lines = [
    'You sort a busy person\'s brain dump into a planner. Today is '
      + `${formatDay(today, { weekday: 'long' })} ${today}. Weeks start on ${weekStartsOn === 0 ? 'Sunday' : 'Monday'}.`,
    '',
    'Size each thing by effort and make it ONE of:',
    '- "day" task: small, one sitting (under ~2 hours). Put it on the day mentioned, else today.',
    '- "week" task: medium, a few hours or a few sittings with no fixed day. date = any day in the week meant (this week if unsaid).',
    '- "month" task: one bigger deliverable that takes several weeks of work. date = any day in that month.',
    '- "goal": an outcome that needs several different steps (e.g. "launch my shop", "run a 5k"). Give 3-6 concrete steps,',
    '  each a small day task with a date spread sensibly between today and the deadline.',
    'Repeating habits ("every morning", "each Monday") are day tasks with repeat daily | weekdays | weekly | monthly.',
    'Only include things the person actually said (goal steps are the one exception). Merge duplicates.',
    'Use a time only if one was said. Keep titles short, starting with a verb.',
    `list must be one of: ${LIST_IDS.join(', ')} (personal, work, health, home, errands).`,
  ]
  if (goals.length) {
    lines.push(`Existing goals (set "goal" to the exact title if a task clearly belongs to one): ${goals.map(g => JSON.stringify(g.title)).join(', ')}.`)
  }
  lines.push(
    '',
    'Reply with only a JSON array. Each element:',
    '{"type":"task"|"goal","title":string,"scope":"day"|"week"|"month","date":"YYYY-MM-DD"|null,"time":"HH:MM"|null,',
    ' "repeat":"none"|"daily"|"weekdays"|"weekly"|"monthly","list":string,"checklist":[string],"goal":string|null,',
    ' "deadline":"YYYY-MM-DD"|null,"steps":[{"title":string,"date":"YYYY-MM-DD"}],"why":string}',
    '"why" is at most 8 words on the size you chose. For goals, scope is ignored and steps are required.',
    'Example: [{"type":"task","title":"Call the dentist","scope":"day","date":"' + today + '","time":null,"repeat":"none","list":"health","checklist":[],"goal":null,"deadline":null,"steps":[],"why":"Quick call, one sitting"}]',
    '',
    'Brain dump:',
    '"""',
    text.slice(0, 6000),
    '"""',
  )
  return lines.join('\n')
}

function validDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return toKey(fromKey(v)) === v ? v : null // rejects 2026-02-31
}

function validTime(v) {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : ''
}

function cleanTitle(v) {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, 120) : ''
}

// Turn whatever came back into safe, complete proposals.
export function normaliseProposals(raw, { today, goals = [] }) {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []
  const out = []
  for (const r of arr.slice(0, 40)) {
    if (!r || typeof r !== 'object') continue
    const title = cleanTitle(r.title)
    if (!title) continue
    const list = LIST_IDS.includes(r.list) ? r.list : 'personal'
    const why = typeof r.why === 'string' ? r.why.slice(0, 80) : ''

    if (r.type === 'goal') {
      const deadline = validDate(r.deadline)
      const steps = (Array.isArray(r.steps) ? r.steps : []).slice(0, 8)
        .map((s, i) => ({
          title: cleanTitle(typeof s === 'string' ? s : s?.title),
          date: validDate(s?.date) || addDays(today, i * 2),
        }))
        .filter(s => s.title)
        .map(s => ({ ...s, date: s.date < today ? today : s.date }))
      out.push({ kind: 'goal', title, list, deadline: deadline && deadline >= today ? deadline : null, steps, why, include: true })
      continue
    }

    const scope = SCOPES.includes(r.scope) ? r.scope : 'day'
    let date = validDate(r.date) || today
    if (date < today && scope === 'day') date = today
    const repeat = scope === 'day' && REPEAT_IDS.includes(r.repeat) ? r.repeat : 'none'
    const checklist = (Array.isArray(r.checklist) ? r.checklist : [])
      .map(cleanTitle).filter(Boolean).slice(0, 15)
    const goal = typeof r.goal === 'string' ? goals.find(g => g.title.toLowerCase() === r.goal.trim().toLowerCase()) : null
    out.push({
      kind: 'task', title, list, scope, date,
      time: scope === 'day' ? validTime(r.time) : '',
      repeat, checklist, goalId: goal?.id || null, why, include: true,
    })
  }
  return out
}

// Order the "size" chip cycles through when you tap it.
export const SIZE_CYCLE = ['day', 'week', 'month', 'goal']

export function resize(p, size, today) {
  if (size === 'goal') {
    return { ...p, kind: 'goal', deadline: p.deadline || null, steps: p.steps || [] }
  }
  return {
    ...p, kind: 'task', scope: size, goalId: p.goalId || null,
    date: p.date || today, time: size === 'day' ? (p.time || '') : '',
    repeat: size === 'day' ? (p.repeat || 'none') : 'none', checklist: p.checklist || [],
  }
}

// Fallback when Claude isn't available: one inbox item per line or sentence.
export function splitToInbox(text) {
  return text
    .split(/\n|(?<=[.!?])\s+|;\s*/)
    .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(s => s.length > 1)
    .slice(0, 30)
}
