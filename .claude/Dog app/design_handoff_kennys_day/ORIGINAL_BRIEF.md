# Kenny's Day — Project Brief

A small personal web app for a dog owner who works from home. It takes the
owner's real calendar for the day, finds the gaps, and threads dog-engagement
activities into them — games, training, and short walk tasks — with deliberate
unpredictability and behaviourally-sound pacing. It reminds the owner when to
do each thing, and generates a shopping list of kit that unlocks more games.

The goal is behavioural, not organisational: the owner already gives the dog
plenty of *time*, but engagement keeps falling out of his head during deep
work. The app's job is to tap him on the shoulder with a *varied, surprising*
prompt at the right moment, and to rebuild the owner as the most interesting
thing in the dog's day.

This document has two parts: a **Functionality Brief** (hand to Claude Design
first — it describes what to build, deliberately leaving the visual direction
to you) and a **Build Brief** (hand to a build once the design is set). A
working prototype already exists (`index.html` + `engine.js`); the engine is
the keeper and should be reused — only the UI is being designed.

---

## PART 1 — FUNCTIONALITY BRIEF (for Claude Design)

> **Note on design direction:** intentionally none is given here. The visual
> direction (palette, type, layout, tone) will be guided separately. This
> section specifies *what the app must do and contain* only — please don't
> infer or impose an aesthetic. Treat all UI specifics below as functional
> requirements, not styling suggestions.

### Context
One user: works from home, has a young dog. Personal tool, used daily, mostly
on desktop with occasional phone use. No accounts, onboarding, or marketing.

### Structure
A single page with three states/views: **Setup**, **The Day** (a generated
timeline), and **Shopping List**. The user moves between The Day and Shopping
List via a tab switcher; Setup feeds the generated views.

### View 1 — Setup (data entry)
The user inputs their day. Required inputs:
- A **date**.
- The day's **active window**: a start time and an end time (the hours the dog
  is awake/available).
- A list of **commitments**, each row = start time + end time + a text label
  (e.g. "Meeting"). Rows can be added and removed; there can be zero or many.
- One or more **walk times** (fixed points in the day). Each can be added and
  removed individually.
- A **"build the day"** action that generates the timeline.
- A **reminders on/off** control.

### View 2 — The Day (generated timeline)
A time-ordered list of entries for the day. Two entry types:
- **Walk** — has a time, a title, a one-line detail, and a short list of 3
  "tasks" for that walk (each a single line). Walks must be visually
  distinguishable from games.
- **Game** — has a time, a title, a one-line "how to do it" detail, and an
  **arousal level** of high / med / low that must be surfaced as a visible
  label/indicator (three distinct states).

Also in this view:
- A **reshuffle** action that regenerates the same day's plan.
- An **empty state** for when no time slots are available.

### View 3 — Shopping List
A checklist of equipment. Each item has:
- A **name**.
- An **essential** indicator (some items are essential, most are not).
- A one-line **reason** ("why").
- A line stating **which games it unlocks** (zero or more game names).
- A **checkbox** with a clear ticked/done state.
Items are pre-sorted (essentials first); the list is read-only data the user
ticks through — no adding/editing items in the UI.

### Reminders behaviour
When reminders are on, the app nudges the user at each timeline entry's time.
A nudge appears as an **in-app toast** (showing the entry's title + detail) and
plays a short **chime**; if the browser has notification permission, it also
fires a system notification. The reminders control reflects on/off state.

### Components implied
Timeline (with walk and game item variants), arousal indicator (3 states),
walk-time chip (removable), commitment row (2 time fields + label + remove),
tab switcher, toast/nudge, shopping-list item (checkbox + essential marker),
and the usual button hierarchy (primary action, secondary, small remove/icon).

### Responsive requirement
Must be usable on both desktop and a phone (the timeline and shopping list in
particular need to collapse to a single tappable column).

### Out of scope
Accounts, settings, social features, multi-dog support, marketing pages.

### Copy
Keep any microcopy short and plain. Exact wording isn't fixed — the generated
content (game names, details, walk tasks, shopping reasons) comes from the
engine described in Part 2; the design only needs placeholders shaped like that
data.

---

## PART 2 — BUILD BRIEF (for implementation)

### Stack
- **Angular** front end (the owner is an Angular developer).
- No backend required for v1. Everything runs client-side.
- Reuse the existing **`engine.js`** as-is — port it to `kenny-engine.ts`.
  It is pure, framework-agnostic functions with no DOM. Do not rewrite the
  logic; just add TypeScript types (shapes are documented inline) and wrap it
  in a service.

### The engine (already built — reuse, don't reinvent)
`engine.js` exports:
- `buildDogDay({ date, events, walks, dayStart?, dayEnd?, intensity? })`
  → returns a sorted timeline of `{ time, type:'walk'|'game', title, detail,
  arousal?, category?, gameId?, tasks? }`.
  - Randomises game type *and* timing within the free slots between
    commitments (and around walks, which get a ~45-min buffer).
  - Weights game choice toward what the dog needs (nosework heaviest, then
    engagement) via `CATEGORY_WEIGHTS`.
  - Guard-rails: never schedules two high-arousal games back to back; adds a
    calm "settle" at the end if the day finished on a high-arousal note;
    spaces games ≥25 min apart; keeps space-needing games out of tiny gaps.
  - Seeded per date, so a refresh gives the same plan but each new day differs.
- `buildShoppingList()` → deduplicated kit rolled up from each game's `kit`
  field, essentials first, each tagged with the games it unlocks.
- `GAME_CATALOG`, `WALK_TASKS` — plain data at the top of the file; the catalog
  is the single source of truth for both games and the shopping list. Editing
  it should require no other code changes.

### Angular wiring
- `KennyService` (injectable) wraps `buildDogDay` and `buildShoppingList`.
- Components: `SetupForm`, `DayTimeline` (+ `TimelineItem`), `ShoppingList`,
  `TabSwitcher`, `Toast`.
- State can live in a simple service/signal store; no NgRx needed at this size.

### Reminders (be realistic about tiers)
- **v1 (in-tab):** on "reminders on", queue a `setTimeout` per timeline item;
  on fire, show a toast + chime and a `Notification` if permission granted.
  Works while the tab is open — fine for a pinned work-from-home tab. This is
  what the prototype does and is enough to ship.
- **v2 (proper):** move scheduling into a service worker so it survives a
  backgrounded tab. Requires serving over https/localhost.
- **v3 (true push, phone/closed laptop):** needs a backend with Web Push
  (VAPID) subscriptions. The timeline is already just `{time, payload}`, so the
  data side is ready when wanted. Not in v1.

### Nice-to-haves (later, not v1)
- Import commitments from Google Calendar / an ICS feed (same
  `{start, end, label}` shape — no engine change needed).
- A feedback loop: let the owner mark which games landed well, and bias
  `CATEGORY_WEIGHTS` toward those over time.
- Persist the day and shopping ticks in `localStorage`.

### Definition of done for v1
Enter a day's commitments and walks → get a sensible, varied, well-paced
timeline → turn on reminders and get nudged at each time while the tab is open
→ open the shopping list and tick items off. Catalog edits flow through to both
the plan and the list with no other changes.

### Behavioural guardrails to preserve (don't "optimise" these away)
These are deliberate and based on dog-behaviour advice, not bugs:
- More is *not* better. The pacing/spacing caps are intentional.
- Never stack two high-arousal activities.
- Nosework is over-weighted on purpose (foraging outlet).
- Fetch is restricted to non-grassy ground in its copy on purpose.
- Walks emphasise loose-lead engagement and sniffing, not just exercise.
