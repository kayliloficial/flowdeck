# Flowdeck — Work Planner & Customizable Dashboard

A web app for planning work and tracking progress, built with **HTML, CSS, JavaScript and C++ (compiled to WebAssembly)**. No dependencies; just open `index.html`.

## Features
- **Customizable dashboard** – multiple dashboards (tabs), 16 widgets, drag to reorder, drag the corner to resize, per-widget title/size/color settings, duplicate/rename/reset dashboards
- **Widgets** – greeting & clock, key stats, today's focus, Pomodoro focus timer, status donut, weekly workload vs. capacity, completion trend, upcoming deadlines, project progress, Eisenhower priority matrix, activity heatmap, habit tracker with streaks, goals, quick notes, natural-language quick add, countdown, quick links
- **Board** – Kanban (Backlog → Done) with drag & drop, filters, subtasks, tags, estimates
- **Week planner** – drag tasks onto days, daily hours vs. capacity, unscheduled tray
- **Calendar** – month view, click a day to add, drag to reschedule
- **Timeline** – Gantt-style view grouped by project
- **Projects** – progress, overdue counts, remaining hours
- **Command palette** (`Ctrl+K`), keyboard shortcuts (`?`), dark/light themes, accent colors, density
- **Quick-add syntax**: `Send report fri !1 #web 2h +finance`
- **Data** stays in your browser (localStorage); export/import JSON, export CSV

- **C++ planning engine** (WebAssembly):
  - **Auto-plan** (Week planner → *Auto-plan*): schedules unscheduled and overdue tasks over the next 14 days by priority and deadline, keeping each day under your capacity, skipping weekends if you want
  - **Smart insights** widget: momentum score, 7-day pace and trend, streaks, active-day ratio and a forecast of when your backlog will be clear
  - Falls back to an identical JavaScript implementation if WebAssembly is unavailable

## Project structure
```
index.html            page shell
css/styles.css        all styling (themes, layout, widgets)
js/app.js             app logic: views, widgets, drag & drop, storage
js/engine.js          bridge between the app and the C++ engine (+ JS fallback)
js/engine-wasm.js     compiled engine embedded as base64 (generated)
cpp/planner.cpp       C++ engine: auto-scheduler + productivity analytics
wasm/planner.wasm     compiled WebAssembly binary (generated)
build.sh              rebuilds the C++ engine (needs clang++ + wasm-ld)
```

## Rebuild the C++ engine
```bash
./build.sh
```

## Run
Open `index.html` in any modern browser. To host it, enable GitHub Pages on this repo (Settings → Pages → Deploy from branch → `main` / root).
