# Kenny's Day — Build Brief (Claude Code)

Build an Angular web app called **Kenny's Day**. It's a personal, single-user
tool for a dog owner who works from home. It takes the owner's calendar for the
day, finds the gaps between commitments, and threads dog-engagement activities
(games, training, walk tasks) into them with deliberate unpredictability and
sensible pacing. It reminds the owner when to do each activity and generates a
shopping list of kit that unlocks more games.

**Important:** the scheduling logic already exists and is provided as
`engine.js` in this handoff. **Reuse it — do not rewrite the logic.** Your job
is the Angular app around it (port the engine to TypeScript, wrap it in a
service, build the UI, wire reminders).

A separate visual/design pass is happening elsewhere — **do not invent a heavy
aesthetic.** Build clean, semantic, accessible markup with minimal,
easily-overridable styling so a design can be layered on after. Structure for
styling (clear class names / component boundaries), don't decorate.

---

## Stack & setup
- **Angular** (latest stable), standalone components, TypeScript strict mode.
- No backend for v1 — fully client-side.
- Package manager: npm.
- Expected commands to work from a clean clone:
  - `npm install`
  - `npm start` (serves on localhost — needed so the Notification API works;
    `file://` won't do for v2 service-worker reminders later)
  - `npm test` (unit tests, see below)
- State: Angular signals or a small service store. **No NgRx** — too heavy here.

## Suggested structure
```
src/app/
  engine/kenny-engine.ts        # ported from provided engine.js (logic unchanged)
  engine/kenny-engine.spec.ts   # unit tests for the engine guarantees
  services/kenny.service.ts      # injectable wrapper + app state (signals)
  services/reminder.service.ts   # timers, toast, chime, Notification API
  components/setup-form/
  components/day-timeline/
  components/timeline-item/
  components/shopping-list/
  components/tab-switcher/
  components/toast/
  app.component.ts
```

## The engine (provided — port, don't rewrite)
`engine.js` is pure, framework-agnostic functions with no DOM. Port it to
`kenny-engine.ts`: keep the logic identical, add TypeScript types (the param
shapes are documented in JSDoc at each function). It exports:

### Porting rules (do these exactly)
1. **Convert the module exports.** The provided file ends with a
   browser/Node hybrid shim:
   ```js
   if (typeof module !== 'undefined' && module.exports) module.exports = KennyEngine;
   if (typeof window !== 'undefined') window.KennyEngine = KennyEngine;
   ```
   **Delete both lines and the `KennyEngine` object.** Replace with named ES
   `export` on each function and the data constants:
   `export function buildDogDay(...)`, `export function buildShoppingList()`,
   `export const GAME_CATALOG = ...`, `export const WALK_TASKS = ...`.
   Internal helpers (`makeRng`, `seedFromDate`, `toMin`, `toHHMM`,
   `findFreeSlots`, `weightedPick`, `pickWalkTasks`) stay module-private unless
   a test needs them (`findFreeSlots` is worth exporting for tests).

2. **Keep the engine as pure functions — do NOT fold them into the service.**
   The functions must stay free of Angular, DOM, and state so they remain
   unit-testable in isolation. The Angular service is a *thin wrapper* that
   holds app state and calls these functions. This boundary is deliberate.

3. **Add these shared interfaces** (put them in `kenny-engine.ts` and import
   them everywhere — one vocabulary across the whole app):
   ```ts
   export type Arousal = 'high' | 'med' | 'low';
   export type GameCategory = 'nosework' | 'engagement' | 'play' | 'training';

   export interface CalendarEvent { start: string; end: string; label: string; } // 'HH:MM'

   export interface KitItem { item: string; essential: boolean; why: string; }

   export interface Game {
     id: string; name: string; category: GameCategory; arousal: Arousal;
     minutes: number; needsSpace: boolean; how: string; kit: KitItem[];
   }

   export interface TimelineItem {
     time: string;                 // 'HH:MM'
     type: 'walk' | 'game';
     title: string;
     detail: string;
     tasks?: string[];             // walks only (length 3)
     arousal?: Arousal;            // games only
     category?: GameCategory;      // games only
     gameId?: string;              // games only
   }

   export interface ShoppingItem {
     item: string; essential: boolean; why: string; unlocks: string[];
   }

   export interface BuildDayConfig {
     date: string;                 // 'YYYY-MM-DD' — seeds the day
     events: CalendarEvent[];
     walks: string[];              // ['08:00','18:00']
     dayStart?: string;            // default '07:30'
     dayEnd?: string;              // default '22:00'
     intensity?: number;           // default ~0.9
     seed?: number;                // optional reshuffle salt (see Day view)
   }

   export function buildDogDay(cfg: BuildDayConfig): TimelineItem[];
   export function buildShoppingList(): ShoppingItem[];
   ```
   Type `GAME_CATALOG` as `Game[]` and `CATEGORY_WEIGHTS` as
   `Record<GameCategory, number>`. With strict mode on, the seeded-RNG bit-ops
   (`>>> 0`, `| 0`, `Math.imul`) are valid TS as-is — keep them unchanged.

4. **The service is thin.** Example target:
   ```ts
   // kenny.service.ts
   import { Injectable, signal } from '@angular/core';
   import { buildDogDay, buildShoppingList, BuildDayConfig,
            TimelineItem, ShoppingItem } from '../engine/kenny-engine';

   @Injectable({ providedIn: 'root' })
   export class KennyService {
     readonly day = signal<TimelineItem[]>([]);
     readonly shopping = signal<ShoppingItem[]>(buildShoppingList());

     plan(cfg: BuildDayConfig): void {
       this.day.set(buildDogDay(cfg));
     }
   }
   ```
   Components read `kenny.day()` / `kenny.shopping()` and call `kenny.plan(cfg)`.
   No scheduling logic lives in the service — it only calls the engine.

It exports (runtime surface used by the app):

- `buildDogDay({ date, events, walks, dayStart?, dayEnd?, intensity? })`
  → sorted timeline array. `date` is `'YYYY-MM-DD'`; `events` are
  `{start,end,label}` with `'HH:MM'` times; `walks` is an array of `'HH:MM'`.
- `buildShoppingList()` → deduplicated kit list, essentials first.
- `GAME_CATALOG`, `WALK_TASKS` — plain data at the top of the file. **This is
  the single source of truth for both games and the shopping list.** Adding a
  game (with its `kit` field) must require no other code changes.

### Real output shapes (use these exact field names)
`buildDogDay(...)` returns items like:
```json
[
  {
    "time": "07:47", "type": "game", "title": "Hand-fed check-ins",
    "detail": "Feed part of a meal piece-by-piece for eye contact ...",
    "arousal": "low", "category": "engagement", "gameId": "handfeed"
  },
  {
    "time": "08:00", "type": "walk", "title": "Walk",
    "detail": "Loose lead + engagement, not just management.",
    "tasks": [
      "3 surprise direction-changes — no warning, no word. Keeps his eyes on you.",
      "Sniffari: 5+ minutes of loose-lead, he chooses the direction ...",
      "End the walk on a short game so coming home is not the only \"fun off\" signal."
    ]
  }
]
```
Note: `walk` items carry `tasks` (string[3]) and no `arousal`; `game` items
carry `arousal` ('high'|'med'|'low'), `category`, `gameId`, and no `tasks`.

`buildShoppingList()` returns items like:
```json
[
  {
    "item": "Treat pouch (belt-clip)", "essential": true,
    "why": "Rewards always on you — the backbone of becoming the interesting one.",
    "unlocks": ["Run-away recall"]
  }
]
```

## Features to build

### 1. Setup form
Inputs: date; day active-window start + end times; a dynamic list of commitment
rows (start time + end time + text label, add/remove); one or more walk times
(add/remove individually); a "build the day" action; a reminders on/off toggle.
On build, call `KennyService.plan(...)` → store the resulting timeline in state.

### 2. Day timeline view
Render the timeline in time order. Two item variants:
- **walk** — show time, title, detail, and the 3 `tasks` as a list; visually
  distinct from games.
- **game** — show time, title, detail, and the `arousal` level as a visible
  three-state indicator (high/med/low).
Include a **reshuffle** action (re-runs `buildDogDay` for the same inputs — note
it's seeded by date, so to actually reshuffle, vary an internal salt or expose
an optional seed param; simplest: add an optional `seed` arg to `buildDogDay`
that perturbs the RNG, defaulting to date-only behaviour). Include an **empty
state** for when no slots are available.

### 3. Shopping list view
Render `buildShoppingList()` as a checklist. Each row: name, essential marker,
the `why` line, an "unlocks: …" line, and a checkbox with a clear done state.
List is read-only data the user ticks through (persist ticks in `localStorage`).

### 4. Tab switcher
Switch between Day and Shopping List. Setup is always visible (or above the
tabs) and feeds both.

### 5. Reminders (v1 = in-tab; this is enough to ship)
On "reminders on", request `Notification.permission`, then queue a timer per
timeline item for today. On fire: show an in-app **toast** (title + detail) and
play a short **chime** (WebAudio, no asset needed — the provided prototype has a
working two-note implementation to copy), plus a system `Notification` if
granted. Reflect on/off state in the control. Re-running the plan must clear and
re-queue timers. (The provided prototype `index.html` contains a working
reference implementation of the timers, toast, and chime — port that behaviour.)

## Tests (please include)
Unit-test the engine guarantees in `kenny-engine.spec.ts`:
- No two **high-arousal** games scheduled back to back.
- Same `date` + inputs → identical plan; different `date` → different plan.
- Games never overlap commitment windows or the ~45-min post-walk buffer.
- `buildShoppingList()` returns essentials first and dedupes shared kit.

## Definition of done (v1)
Enter commitments + walks → get a sensible, varied, well-paced timeline →
toggle reminders and get nudged at each time while the tab is open → open the
shopping list and tick items off (persisted). Editing `GAME_CATALOG` flows
through to both the plan and the shopping list with no other code changes.

## Behavioural guardrails — preserve, don't "optimise" away
These are intentional, based on dog-behaviour reasoning, not bugs:
- More is **not** better — the pacing/spacing caps are deliberate.
- Never stack two high-arousal activities.
- Nosework is over-weighted on purpose (it's a foraging outlet).
- Fetch copy is restricted to non-grassy ground on purpose.
- Walks emphasise loose-lead engagement and sniffing, not just exercise.

## Explicitly out of scope for v1
Accounts, settings pages, social features, multi-dog support, marketing pages,
backend, and true push notifications (phone / closed-laptop push needs a
backend with Web Push/VAPID — note it as a future v3 but don't build it).
