# byjessalyn quest log ✨

A gamified 90-day creative business tracker for byjessalyn. Built with React + Vite, deploys to Vercel in minutes.

---

## 🚀 Deploy to GitHub + Vercel (step by step)

### Step 1 — Install Node.js (if you haven't already)
Download from [nodejs.org](https://nodejs.org) — choose the **LTS** version. Install it and restart your computer.

### Step 2 — Set up the project locally

Open **Terminal** (Mac) or **Command Prompt** (Windows) and run:

```bash
cd path/to/byjessalyn-quest-log   # navigate into the project folder
npm install                         # installs React, Vite, and dependencies
npm run dev                         # starts local preview at http://localhost:5173
```

Open `http://localhost:5173` in your browser — you should see the app running!

### Step 3 — Push to GitHub

1. Go to [github.com](https://github.com) and sign in (or create a free account)
2. Click **New repository**
3. Name it `byjessalyn-quest-log`
4. Leave it **Public** (required for free Vercel)
5. Click **Create repository**
6. GitHub will show you commands — run these in your terminal:

```bash
git init
git add .
git commit -m "first commit ✨"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/byjessalyn-quest-log.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Find your `byjessalyn-quest-log` repo and click **Import**
4. Vercel auto-detects Vite — no settings to change
5. Click **Deploy**
6. Done! Your app is live at `https://byjessalyn-quest-log.vercel.app` ✨

### Step 5 — Update your app later

Whenever you make changes:
```bash
git add .
git commit -m "update description here"
git push
```
Vercel automatically redeploys every time you push to GitHub. 

---

## 📁 Project structure

```
byjessalyn-quest-log/
├── index.html                    # App entry point
├── vite.config.js                # Vite config
├── vercel.json                   # Vercel SPA routing
├── package.json                  # Dependencies
└── src/
    ├── main.jsx                  # React root
    ├── App.jsx                   # Screen routing + overlays
    ├── styles/
    │   └── global.css            # All styles + themes
    ├── data/
    │   ├── days.json             # All 90 days of task data
    │   └── gameData.json         # Levels, badges, roadmap, quests, themes
    ├── hooks/
    │   ├── useStore.js           # Central state + localStorage
    │   └── useTimer.js           # Focus block countdown timer
    ├── screens/
    │   ├── HomeScreen.jsx        # Dashboard, mood, quest preview
    │   ├── AllScreens.jsx        # Quests, Map, Badges, Roadmap, Analytics, Focus, Journal
    │   └── [re-export files]
    └── components/
        ├── AllComponents.jsx     # All overlay + UI components
        └── [re-export files]
```

---

## 🎮 Features

- **8 screens** — Home, Daily Quests, 90-Day Map, Badge Collection, Roadmap, Analytics, Focus Blocks, Journal
- **XP + Levels** — Doodler → Sketchling → Sticker Witch → Shop Keeper → Brand Babe → Dream Maker → Artisan
- **24 badges** — original byjessalyn badges + streak/journal/habit badges
- **Day-of-week habit quests** — different quests for Design Day, Shop Day, Batch Day, Content Day, Community Day, Rest Day
- **Focus Block timer** — countdown ring for scheduled work sessions, +50 XP on complete
- **Analytics** — XP chart (14 days), habits chart (this week), revenue targets, revenue mix
- **Roadmap** — long-term 3-phase business plan with checkable milestones
- **5 visual themes** — unlocked at milestones (Soft Studio, Midnight Kawaii, Blossom Season, Neon Mochi)
- **Recovery quests** — gentle comeback system after missed days
- **All data in localStorage** — no backend needed, works offline

---

## 🔧 Dev panel (for testing)

Triple-tap the **"Day X of 90"** text on the home screen to open a hidden dev panel where you can advance days, add XP, and unlock everything.

---

## 🔮 Future features (when you're ready to add a backend)

The `useStore.js` hook is structured so you can swap `localStorage` for a real database later:
- Replace `loadState()` / `saveState()` with API calls
- Add a `useAuth.js` hook for login
- Use Supabase or Firebase for cross-device sync

---

Built with 🌸 by Jessalyn — byjessalyn.com
