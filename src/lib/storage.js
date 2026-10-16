// On iPhone, WKWebView localStorage can be wiped by iOS under storage pressure,
// so the native app stores data with Capacitor Preferences (UserDefaults).
// In a regular browser it falls back to localStorage.
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const KEY = 'daytrack_v2'

export const DEFAULT_SETTINGS = {
  weekStartsOn: 1,          // 0 = Sunday, 1 = Monday
  notifications: false,     // user must opt in (triggers the iOS permission prompt)
  morningSummary: true,
  morningTime: '08:00',
  eveningCheckin: true,
  eveningTime: '20:00',
}

export const EMPTY_DATA = { tasks: [], settings: DEFAULT_SETTINGS }

function parse(raw) {
  if (!raw) return EMPTY_DATA
  try {
    const data = JSON.parse(raw)
    return {
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    }
  } catch {
    return EMPTY_DATA
  }
}

export async function loadData() {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: KEY })
    return parse(value)
  }
  try { return parse(localStorage.getItem(KEY)) } catch { return EMPTY_DATA }
}

export async function saveData(data) {
  const raw = JSON.stringify(data)
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: KEY, value: raw })
    return
  }
  try { localStorage.setItem(KEY, raw) } catch {}
}

export function exportJSON(data) {
  return JSON.stringify({ app: 'daytrack', exportedAt: new Date().toISOString(), ...data }, null, 2)
}

export function importJSON(raw) {
  const data = JSON.parse(raw)
  if (!Array.isArray(data.tasks)) throw new Error('Not a Daytrack backup file')
  return parse(raw)
}
