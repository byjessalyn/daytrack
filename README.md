# Daytrack

A personal planner for your day, week and month, with reminders on your phone and a home-screen widget that shows your progress.

- **Day**: today's tasks with times, repeats (daily / weekdays / weekly / monthly) and reminders. Overdue tasks can be moved to today in one tap.
- **Week**: week goals, plus every day at a glance with its own progress bar.
- **Month**: a calendar with a progress dot per day, plus month goals.
- **Progress**: a ring for today and bars for the week and month.
- **Notifications** (iPhone app): per-task reminders, a morning "here's your day" summary and an evening check-in.
- **Widget** (iPhone app): small, medium and large home-screen widgets, plus lock-screen widgets.
- Light and dark mode. Data stays on your device, and you can export or import a JSON backup from Settings.

## Run it in a browser

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for dates, repeats, progress, reminders, widget data
```

The web version deploys to Vercel as-is (`npm run build` → `dist/`). In a browser you get the full planner, but notifications only fire while the tab is open, and there is no widget. Those need the iPhone app.

## Put it on your iPhone

See **[IOS_SETUP.md](IOS_SETUP.md)**. You need a Mac with Xcode. It takes about 15 minutes the first time.

## Project layout

```
src/
  App.jsx               tabs, editor sheet, routing between views
  usePlanner.js         state, persistence, syncing notifications + widget
  views/                Day, Week, Month, Settings
  components/           progress ring/bars, task row, task editor
  lib/dates.js          local "YYYY-MM-DD" date math
  lib/tasks.js          task model, repeats, progress
  lib/schedule.js       which notifications to schedule
  lib/snapshot.js       data handed to the iOS widget
  lib/native.js         Capacitor bridges (no-ops in a browser)
  lib/storage.js        device storage + backup
ios/App/                Capacitor iOS project (Xcode)
ios/widget/             SwiftUI widget source
test/                   Vitest unit tests
```
