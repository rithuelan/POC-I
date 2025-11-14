# Task & Habit Tracker — 2025 POC
------

**A lightweight, fully-interactive Task & Habit Tracker built with vanilla HTML, CSS and JavaScript.**

This proof-of-concept demonstrates a production-minded single-file (or multi-file) app that supports advanced task/habit management, live analytics, a simple rule engine, drag-and-drop reordering, persistence, theming, and responsive UX — without any frameworks.

---

## Goals

* Provide a beautiful, accessible UI for managing tasks and habits.
* Offer realtime analytics and visualizations that update as data changes.
* Demonstrate a small, testable custom rule engine to surface important items automatically.
* Keep the stack minimal (vanilla JS, semantic HTML, and modular CSS) so the core ideas are explicit and easy to port.

---

## Key Features

### Task Management

* Tasks include: title, description, due date, priority (Low / Medium / High), and status (active / in-progress / stalled / completed).
* Subtasks support — each subtask can be reordered independently and collapsed/expanded.
* Smooth UI feedback for add, edit, complete, and delete actions.

### Habit Management

* Habits include: name, frequency (daily / weekly / custom), optional weekdays-only rules.
* Visual streak tracker (progress bar and small calendar view).
* Custom rules support (e.g., count only weekdays, award badges when streak ≥ 7).

### Smart Sorting & Filtering

* Multi-level filters: by status, priority, due date range, streak length, and tags.
* Live sorting: drag-and-drop reordering, or sort by due date / priority / streak.

### Interactive Dashboard

* Realtime metrics: tasks completed today, tasks overdue, longest habit streak, upcoming tasks.
* Small weekly progress chart implemented with SVG/HTML + CSS and updated by JS.
* Dashboard updates instantly as user modifies data.

### Drag & Drop + Nesting

* Native drag-and-drop (HTML5) with clear visual drop targets.
* Tasks can contain nested subtasks; subtasks are reorderable and collapsible.

### Animations & Visual Feedback

* Smooth transitions for list changes, completions, and container collapses.
* Tooltips and subtle micro-interactions for better UX.

### Rule Engine

* Users can create rules made of simple conditions (field, operator, value) combined by AND/OR.
* Rules evaluate dynamically and can apply UI decorations (highlight, badge, auto-sort).
* Extensible to add more conditions and actions.

### Persistence & Undo/Redo

* All data persisted to `localStorage` (tasks, habits, rules, app settings).
* Undo/redo stack for the last **5** actions (create, edit, delete, complete, reorder).

### Theming & Responsiveness

* Light / Dark theme toggle (saved in localStorage).
* Fully responsive layout; dashboard collapses on smaller screens for better mobile experience.

---

## Getting Started (development)

1. Clone or download the repository.
2. Open `index.html` in a browser (Chrome, Firefox, Edge recommended).
3. Open DevTools (Console) for live logging of rule evaluation and undo stack (for debugging).

No build step required — the app is intentionally framework-free.

---

## Data Model (overview)

* **Task**: `{ id, title, description, dueDate, priority, status, subtasks: [Task], order, tags }`
* **Habit**: `{ id, name, frequency, schedule, streak, history: [{date, done}], order, rules }`
* **Rule**: `{ id, name, enabled, conditions: [{field, op, value}], logic: 'AND'|'OR', actions: [{type, params}] }`

All objects are serialisable to JSON and stored in `localStorage` under names like `th.tasks`, `th.habits`, `th.rules`, `th.settings`.

---

## Rule Engine (implementation notes)

* Rules are evaluated on data change and return a list of actions to apply to matched items.
* Example conditions supported: `=`, `!==`, `<`, `<=`, `>`, `>=`, `contains`, `in`, `weekday-in`.
* Example actions: `highlight` (class), `badge` (add a visual badge), `auto-complete`, `notify` (UI toast).
* Rules are intentionally simple so they remain auditable and safe.

---

## Persistence & Undo

* All write actions push a snapshot to an in-memory circular undo stack (max 5).
* Undo pops the last snapshot and restores the state; Redo re-applies an undone snapshot.
* On restore, UI rerenders and rules re-evaluate.

---

## Accessibility

* Semantic HTML and ARIA attributes for drag handles and interactive regions.
* Keyboard support for adding/editing items, toggling completion, and moving focus between controls.
* Color contrasts checked for both themes.

---

## Testing & Debugging Tips

* Use `localStorage.clear()` in console to reset the app state during tests.
* The app logs rule evaluation results and undo stack state to `console.debug()` when `settings.debug` is enabled.

---

## Extensibility Ideas (future)

* Export / import JSON backups.
* Sync to cloud (Dropbox / Google Drive / custom API).
* Shareable public snapshots for accountability.
* Advanced analytics: heatmaps, time-of-day productivity.

---

## Contributing

This is a POC — rough edges are expected. If you want to contribute:

1. Fork the repo.
2. Open a PR with focused changes (UI, rules, UX, tests).
3. Keep changes small and well-documented.

---




