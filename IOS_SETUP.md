# Daytrack on your iPhone

This turns the web app into a real iPhone app with **reminders that arrive even when the app is closed** and a **home-screen + lock-screen widget**.

You need a Mac with **Xcode 16 or newer** (free from the Mac App Store) and an iPhone running **iOS 17+**.

> **About Apple accounts.** A free Apple ID can run the app and its notifications on your own phone, but the app expires after **7 days** (plug in and press ▶ again), and free "Personal Team" accounts generally **can't use App Groups**, which the widget needs to get its data. For the widget and no weekly re-install, you need a paid Apple Developer account ($99/yr). If Xcode refuses to add the App Group in step 3, this is why. You can skip steps 3–4 and use everything except the widget.

---

## 1. One-time setup on your Mac

```bash
git clone https://github.com/byjessalyn/daytrack.git
cd daytrack
npm install
npm run ios        # builds the web app, copies it into ios/, opens Xcode
```

The first time Xcode opens it downloads the Capacitor packages (Swift Package Manager). Wait for "Resolving packages" to finish.

## 2. Sign the app

1. In the left sidebar click the blue **App** project → under *Targets* select **App** → **Signing & Capabilities**.
2. Tick **Automatically manage signing** and pick your **Team** (your Apple ID).
3. If Xcode says the bundle ID `com.byjessalyn.daytrack` is taken, change it to something unique like `com.yourname.daytrack`. Use the same prefix everywhere below.

## 3. Add the App Group (lets the app talk to the widget)

Still on the **App** target → **Signing & Capabilities**:

1. Click **+ Capability** → **App Groups**.
2. Click **+** under App Groups and enter `group.com.byjessalyn.daytrack`.

*If you changed the bundle ID in step 2, use `group.<your bundle id>` and update the group name in both
`ios/App/App/WidgetBridgePlugin.swift` and `ios/widget/DaytrackWidget.swift`.*

## 4. Create the widget target

1. **File → New → Target…** → **Widget Extension** → Next.
2. Product Name: **`DaytrackWidget`** (exactly this).
3. **Untick** "Include Live Activity", "Include Control" and "Include Configuration App Intent".
4. Finish. When asked "Activate DaytrackWidget scheme?" click **Activate**.
5. Select the new **DaytrackWidget** target → **General** → set **Minimum Deployments** to **iOS 17.0**.
6. **Signing & Capabilities** → same Team → **+ Capability → App Groups** → tick the same `group.com.byjessalyn.daytrack`.

Then, in Terminal, replace Xcode's template widget with Daytrack's:

```bash
npm run widget:install
```

## 5. Run it

1. Plug in your iPhone (first time: unlock it and tap **Trust**; on iOS 16+ also enable **Settings → Privacy & Security → Developer Mode**).
2. At the top of Xcode pick the **App** scheme and your iPhone, then press **▶**.
3. First launch with a free account: on the phone go to **Settings → General → VPN & Device Management** and trust your developer certificate.

In the app go to **Settings → Reminders & summaries**, turn it on, and allow notifications.

Add the widget: long-press the home screen → **Edit → Add Widget** → search **Daytrack** → choose small, medium or large. For the lock screen: long-press the lock screen → **Customize → Lock Screen → widgets area**.

---

## After you change the web code

```bash
npm run ios
```

then press ▶ in Xcode. (`npm run ios` = build + `cap sync ios` + open Xcode.)

## How it works

| Piece | Where |
|---|---|
| Planner UI (React) | `src/` |
| Reminders | `src/lib/schedule.js` plans them; `@capacitor/local-notifications` hands them to iOS. iOS allows 64 pending at a time, so the app schedules the next ~2 weeks and re-plans every time you open it or change something. |
| Widget data | `src/lib/snapshot.js` builds today + 7 days of progress → `WidgetBridgePlugin.swift` saves it in the App Group → the widget reads it. |
| Widget UI (SwiftUI) | `ios/widget/DaytrackWidget.swift` (copied into `ios/App/DaytrackWidget/` by `npm run widget:install`) |

## Troubleshooting

- **Widget says "Open Daytrack to get started"**: the App Group doesn't match between the two targets, or the app hasn't been opened since installing. Open the app once.
- **"Cannot find MainViewController in scope"**: `WidgetBridgePlugin.swift` isn't in the App target. Select it in Xcode → File inspector → tick *Target Membership: App*.
- **No notifications**: iPhone **Settings → Daytrack → Notifications** must be allowed. Focus modes can also hide them.
- **Reminders stop after 2+ weeks of not opening the app**: expected (iOS's 64-notification cap). Opening the app tops them up.
