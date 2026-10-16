import { addDays, diffDays, todayKey } from './dates.js'

/*
 Daily check-in, stored as data.checkins[dateKey]:
 { mood, energy, stress, sleep: 1..5, feelings: string[], note, gratitude, at: number }
 Higher is better for every scale except stress.
*/

export const SCALES = [
  { id: 'mood',   label: 'Mood',   question: 'How are you feeling?',
    options: ['Awful', 'Low', 'Okay', 'Good', 'Great'], icons: ['😣', '😔', '😐', '🙂', '😄'] },
  { id: 'energy', label: 'Energy', question: 'How is your energy?',
    options: ['Drained', 'Low', 'Steady', 'Good', 'Charged'], icons: ['🪫', '🥱', '😌', '🙂', '⚡'] },
  { id: 'stress', label: 'Stress', question: 'How stressed do you feel?',
    options: ['Calm', 'A little', 'Some', 'A lot', 'Overwhelmed'], icons: ['🌿', '🙂', '😕', '😣', '🌪️'] },
  { id: 'sleep',  label: 'Sleep',  question: 'How did you sleep?',
    options: ['Badly', 'Poorly', 'Okay', 'Well', 'Great'], icons: ['😵', '😪', '😐', '😊', '😴'] },
]

export const FEELINGS = [
  'calm', 'grateful', 'hopeful', 'motivated', 'proud',
  'anxious', 'tired', 'lonely', 'irritable', 'sad', 'overwhelmed', 'unfocused',
]

export const AFFIRMATIONS = [
  'Small steps still move you forward.',
  'You are allowed to rest without earning it.',
  'Progress, not perfection.',
  'You have handled hard days before. You can handle this one.',
  'Your worth is not measured by your to-do list.',
  'Done is better than perfect.',
  'It is okay to ask for help.',
  'You can start again at any moment today.',
  'One thing at a time is enough.',
  'Be as kind to yourself as you are to the people you love.',
  'Your pace is still a pace.',
  'You are building something, even on slow days.',
  'Saying no to some things is saying yes to you.',
  'You do not have to do it all today.',
  'Notice what went right today, too.',
  'Rest is part of the plan.',
  'You are allowed to change your mind.',
  'Today counts, even if it is messy.',
  'Your feelings are information, not instructions.',
  'Showing up is the hardest part, and you showed up.',
  'Choose the next small step, not the whole staircase.',
  'You deserve the care you give to others.',
  'Breathe in. Slow down. Begin again.',
  'Some days the goal is just to get through. That is enough.',
  'You are more capable than your worries say.',
  'Celebrate the little wins.',
  'Clear mind, kind heart, one task.',
  'You can do hard things gently.',
  'What you water grows.',
  'Tomorrow is a fresh page.',
  'You are exactly where you need to start.',
]

export function affirmationFor(key) {
  const [y, m, d] = key.split('-').map(Number)
  const dayOfYear = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000)
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length]
}

export function recentCheckins(checkins, today = todayKey(), days = 14) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const key = addDays(today, -i)
    out.push({ key, entry: checkins?.[key] || null })
  }
  return out
}

export function average(entries, field) {
  const vals = entries.map(e => e?.[field]).filter(v => typeof v === 'number')
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export function checkinStreak(checkins, today = todayKey()) {
  let streak = 0
  // Today not checked in yet doesn't break the streak.
  let key = checkins?.[today] ? today : addDays(today, -1)
  while (checkins?.[key]) { streak++; key = addDays(key, -1) }
  return streak
}

// A gentle, non-diagnostic nudge: 3+ hard days (low mood or overwhelmed)
// among check-ins in the last 7 days.
export function needsSupport(checkins, today = todayKey()) {
  let hard = 0
  for (const [key, e] of Object.entries(checkins || {})) {
    const age = diffDays(key, today)
    if (age < 0 || age > 6) continue
    if ((e.mood && e.mood <= 2) || e.stress === 5) hard++
  }
  return hard >= 3
}
