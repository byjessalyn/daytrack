// Bridges to iOS: local notifications and the home-screen widget.
// Every call is safe to make in a plain browser; it degrades to a no-op.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { planNotifications } from './schedule.js'
import { buildSnapshot } from './snapshot.js'

// Implemented in ios/App/App/WidgetBridgePlugin.swift
const WidgetBridge = registerPlugin('WidgetBridge', {
  web: () => ({ setSnapshot: async () => {} }),
})

export const isNative = Capacitor.isNativePlatform()

export async function notificationPermission() {
  try {
    const { display } = await LocalNotifications.checkPermissions()
    return display // 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  } catch {
    return 'denied'
  }
}

export async function requestNotificationPermission() {
  try {
    const { display } = await LocalNotifications.requestPermissions()
    return display
  } catch {
    return 'denied'
  }
}

export async function syncNotifications(tasks, settings) {
  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
    }
    if (!settings.notifications) return 0
    if ((await notificationPermission()) !== 'granted') return 0

    const plan = planNotifications(tasks, settings)
    if (!plan.length) return 0
    await LocalNotifications.schedule({
      notifications: plan.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: n.at, allowWhileIdle: true },
        extra: { date: n.date, kind: n.kind, taskId: n.taskId || null },
      })),
    })
    return plan.length
  } catch (e) {
    console.warn('[daytrack] notification sync failed', e)
    return 0
  }
}

export function onNotificationTap(handler) {
  let remove = () => {}
  LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    handler(event.notification?.extra || {})
  }).then(h => { remove = () => h.remove() }).catch(() => {})
  return () => remove()
}

export async function syncWidget(tasks, settings) {
  if (!isNative) return
  try {
    await WidgetBridge.setSnapshot({ json: JSON.stringify(buildSnapshot(tasks, settings)) })
  } catch (e) {
    // Expected until the WidgetBridge plugin is registered (see IOS_SETUP.md).
    console.warn('[daytrack] widget sync failed', e)
  }
}
