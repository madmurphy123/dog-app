# Handoff: Kenny's Day

## Overview
**Kenny's Day** is a small, single-user personal web app for a dog owner who works
from home. It takes the owner's real calendar for the day, finds the gaps, and
threads dog-engagement activities into them — games, training, short walk tasks —
plus the occasional **treat** surprise and **hygiene/care** reminder, with
deliberate unpredictability and behaviourally-sound pacing. It nudges the owner at
the right moment (in-app toast + chime), and maintains a weekly **Kit** shopping
list where owning a piece of kit unlocks the games/treats/care it enables.

The goal is **behavioural, not organisational**: the owner already gives the dog
plenty of *time*, but engagement keeps falling out of his head during deep work.
The app's job is to tap him on the shoulder with a *varied, surprising* prompt at
the right moment.

This handoff covers a v2 design that extends the original brief (see
`ORIGINAL_BRIEF.md`) with: a four-tab navigation shell, a Week planner, weekly
kit-ownership gating, Treat + Care timeline entries, and a doggy-day-care "day off".

---

## About the Design Files
The files in `prototype/` are **design references created in HTML/React (JSX via
in-browser Babel)** — a working prototype showing the intended look and behaviour.
**They are not production code to copy directly.**

The task is to **recreate this design in the target codebase's environment**. Per
the original brief the intended stack is **Angular** (the owner is an Angular
developer), with everything client-side and no backend for v1. If you are starting
fresh, Angular is the expected choice; the engine is framework-agnostic so any
framework works.

**One file is the exception and should be reused as-is, not recreated:**
`prototype/engine.js` — the pure, DOM-free planning engine. Port it to TypeScript
(`kenny-engine.ts`) by adding types only; **do not rewrite the logic**. It is the
single source of truth for games, treats, care tasks, the shopping list, and the
day-generation algorithm with its behavioural guardrails.

Prototype-only scaffolding (ignore for production): `ios-frame.jsx` (device bezel
for presentation), `tweaks-panel.jsx` (design-exploration control panel),
`image-slot.js` (drag-drop avatar placeholder — replace with a normal image upload
or static avatar).

---

## Fidelity
**High-fidelity.** Final colours, typography, spacing, layout, and interactions are
all intended as shown. Recreate the UI faithfully using the codebase's own
component patterns. Exact design tokens are listed below.

The prototype is framed inside a phone bezel because the long-term goal is a phone
app, but the app itself is a single responsive column (max content width ~402px)
and must also be usable on desktop — render it as a centered column or in the
app's normal responsive shell.

---

## Architecture at a glance
- **One screen, four tabs**, switched by a persistent bottom nav: **Today**, **Week**, **Kit**, **Setup**.
- A single in-memory **`form`** object (the day's inputs) feeds everything.
- The **plan** for the visible day is *derived* from `form` + a reshuffle nonce +
  the owned-kit set by calling `buildDogDay(...)`. It is not stored separately —
  editing inputs or kit updates the plan live.
- Lightweight persistence to `localStorage` (form, active tab, done-ticks, owned kit).

### Suggested Angular structure (from the original brief)
- `KennyService` (injectable) wraps `buildDogDay` and `buildShoppingList`, holds the
  signal/store state (form, ownedKit set, doneSet, activeTab, reshuffle nonce).
- Components: `SetupForm`, `DayTimeline` (+ `TimelineItem`), `WeekPlanner`,
  `KitList` (+ `KitItem`), `BottomNav`, `Toast`, `ArousalIndicator`.
- State can live in a simple service with signals — no NgRx needed at this size.

---

## The Engine (`prototype/engine.js` — reuse, don't reinvent)
Pure functions, no DOM. Seeded per date (a refresh repeats the same plan, each new
day differs).

### Exports
- `buildDogDay({ date, events, walks, dayStart?, dayEnd?, intensity?, owned? })`
  → returns a **sorted timeline** array of entries.
- `buildShoppingList()` → deduplicated kit, grouped, essentials-first, each tagged
  with what it unlocks.
- `GAME_CATALOG`, `WALK_TASKS`, `CARE_TASKS`, `TREATS`, `CATEGORY_WEIGHTS` — plain
  data at the top of the file. **The catalogs are the single source of truth** —
  editing them flows through to both the plan and the shopping list with no other
  code changes.

### Inputs
- `date`: `"YYYY-MM-DD"` string (also used as the random seed).
- `events`: `[{ start: "HH:MM", end: "HH:MM", label? }]` — commitments to plan around.
- `walks`: `["HH:MM", ...]` — fixed walk times (each gets a ~45-min buffer around it).
- `dayStart` / `dayEnd`: the awake window, default `"08:00"` / `"21:00"`.
- `owned`: `string[]` of kit item names the user has. Games/treats/care whose kit
  isn't owned are excluded. Pass `undefined` to treat everything as owned.

### Timeline entry shapes (the `TimelineItem` union)
Every entry has `time: "HH:MM"`, `title: string`, `detail: string`, and a `type`.

| `type`  | Extra fields | Meaning |
|---------|--------------|---------|
| `walk`  | `tasks: string[]` (3 one-liners) | A fixed walk with engagement tasks |
| `game`  | `arousal: 'high'\|'med'\|'low'`, `category`, `gameId` | An enrichment/training game |
| `treat` | `treatKind: 'toy'\|'food'\|'chew'\|'treat'`, `treatId` | A sprinkled surprise (~some days) |
| `care`  | `careId` | A hygiene reminder (teeth/nails/brush/ears/paws) |

### `buildShoppingList()` item shape
`{ name, essential: boolean, why: string, unlocks: string[], group }` where
`group ∈ { 'Enrichment', 'Treats & food', 'Hygiene' }`. Pre-sorted: group order
Enrichment → Treats & food → Hygiene, then essentials first, then by unlock count.

### Behavioural guardrails to PRESERVE (deliberate, not bugs)
- More is *not* better — spacing/quantity caps are intentional (games ≥25 min apart,
  capped per gap).
- Never schedule two **high-arousal** games back-to-back.
- If the day ends on a high, a calm "settle" game is appended.
- Nosework is over-weighted on purpose (foraging outlet) via `CATEGORY_WEIGHTS`.
- Space-needing games are kept out of tiny gaps.
- Walks emphasise loose-lead engagement and sniffing, not just exercise.
- Treats are occasional (≈30% of days, seeded); care is more frequent (≈60% of days,
  weighted by each task's `perWeek`); at most one of each per day.

---

## Screens / Views

### Shared chrome
- **Header card** (top of every tab): rounded 26px card, `var(--grad-header)`
  rose→plum gradient background, `var(--on-plum)` text. Contains: eyebrow
  "KENNY'S DAY" (mono), a reminders bell toggle button top-right (filled
  `--high` when on, translucent white when off), a mono date line
  (`MON 8 JUN`, uppercase), a 26px display title, and a 70px circular dog avatar
  (image upload). A faint large paw watermark sits behind, top-right, 10% opacity.
  Header title per tab: Setup → "Let's plan Kenny's day", Today → "Kenny's on the
  books", Week → "Kenny's week", Kit → "Kenny's kit". (A "Plain" voice variant
  exists in the prototype; Warm is the default and the one to ship.)
- **Bottom nav** (persistent, all tabs): a floating capsule, `position: absolute`,
  16px left/right inset, 20px from bottom. Background `var(--nav-bg)` (deep plum
  gradient), pill radius, soft shadow + 10%-white inset top highlight. Four items:
  Today (list icon), Week (calendar), Kit (cart), Setup (pencil). **Inactive**:
  icon only, colour `var(--on-plum-soft)`. **Active**: icon + label, background
  `var(--grad-primary)` (apricot→coral) pill, text/icon `var(--plum-deep)`, small
  coral glow shadow. *(An earlier scroll-to-hide behaviour was removed at the
  owner's request — the bar is now always visible.)*
- **Toast / nudge** (overlay): drops from top (64px), 14px insets, card with a 5px
  left accent bar in the entry's colour, a 40px tinted icon tile, mono eyebrow
  "Now · HH:MM", title, detail, and a close button. Auto-dismiss after 6s. Plays a
  two-note WebAudio chime (880 → 1318.5 Hz, sine). Fires a system `Notification`
  if permission is granted.

### View 1 — Setup (data entry)
- **Purpose:** the user enters their day.
- **Layout:** vertical stack of cards, 16px gap.
- **Cards/components:**
  1. **The day** card: a native date input (mono) + an "Awake window" row of two
     time inputs separated by an en-dash.
  2. **Your commitments** card: a list of removable rows, each = start time + end
     time + a text label + a trash icon button. An "Add commitment" ghost button.
     Empty-state helper text when none.
  3. **Walk times** card: removable green time chips (walk colour) + a time input
     and "Add walk" ghost button.
  4. **At doggy day care** toggle card: pin icon + label + a switch. When on, adds
     the current date to `dayCareDates` and blocks the whole day.
  5. **Shoulder taps (reminders)** toggle card: bell icon + label + switch.
  6. **Build Kenny's day** primary button (full width, `--grad-primary`) → switches
     to the Today tab.

### View 2 — Today (the generated timeline)
- **Purpose:** see and work through today's plan.
- **If the date is a day-care day:** a centered rest card — pin icon tile, "Kenny's
  at day care", a calm message, and a "Plan today after all" ghost button (removes
  the day from `dayCareDates`).
- **Otherwise:**
  - **Reminders banner** (only if reminders on): tinted `--high` row "Reminders are
    on" + "Preview a nudge ›" (fires the toast/chime for the next pending item).
  - **Treat-day banner** (only if today has a `treat` entry): tinted `--treat` row
    "Treat day — there's a little surprise in the mix."
  - **Headline chips:** "N games" (neutral chip), "N walks" (walk-tint chip),
    "N to go" (high-tint chip, right-aligned).
  - **Timeline**, in one of three layouts (the design ships **"Up next"** as default;
    the other two exist in the prototype as a Tweak and are optional to port):
    - **Up next** (default): a hero `EntryCard` for the first not-done entry under a
      pulsing "UP NEXT FOR KENNY" eyebrow, then a "LATER TODAY" list of compact rows.
    - **Rail**: a vertical timeline with a connector line + coloured node dots, full
      cards to the right.
    - **Ribbon**: a dense list of compact one-line rows.
  - **Reshuffle the day** button (plum) at the bottom — regenerates via a nonce bump.
  - **Empty state** (no free slots): a "No room today" card with a Try-again button.

#### `EntryCard` (full timeline card)
Rounded card, 16px padding. Header row: a mono time badge tinted in the entry's
colour, a type eyebrow (Walk/Game/Treat/Care), and a right-aligned status element:
- walk → "Sniff & stroll" leaf chip,
- game → **Arousal indicator**,
- treat → "Surprise" sparkle chip,
- care → "Reminder" chip.
Body: a 44px tinted icon tile (walk/paw/gift/droplet) + title (18px display) +
detail. Walks additionally render their 3 `tasks` as a bulleted checklist. A
"Mark as done" toggle button at the bottom (line-throughs the title and dims the
card when done).

#### Arousal indicator (three styles; ship **"bars"** as default)
- **bars** (default): three ascending bars filled by level (low=1, med=2, high=3) in
  the arousal colour + a mono uppercase short label (CALM/MED/HIGH).
- **tag**: a tinted pill with a dot + full label ("High energy"/"Medium"/"Calm").
- **glyph**: a tinted pill with a flame/sparkle/leaf glyph + short label.

### View 3 — Week (planner)
- **Purpose:** see the whole week's shape at a glance; tap a day to open it.
- **Layout:**
  - **Week strip** card: 7 columns (Mon–Sun) of the week containing the active date.
    Each cell = weekday letter (mono) + date number (display) + a status dot
    (today = `--high`, day-care = `--care`). Active day filled with `--plum`.
  - **Per-day rows:** one card per day. Header = weekday name + mono date + right
    chips "N games"/"N walks" (or a "Day care" chip). Body = a **mini-timeline**: a
    22px rounded track with a faint midday tick and a dot per entry, positioned by
    time across the awake window, coloured per entry type (walks = small rounded
    squares; games/treats/care = round dots in their colours). Day-care days show
    "Out at day care — a day off the plan." instead. The active day's card has a
    2px `--plum` ring. Tapping a day sets `form.date` to it and switches to Today.

### View 4 — Kit (weekly shopping)
- **Purpose:** a weekly buy-ahead list; owning kit unlocks its games/treats/care.
- **Layout:**
  - **Summary** card: cart icon + "This week's kit" + "N to pick up · M in the kit".
  - **Explainer** card (plum-tint): "Buy a few across the week — tick each off when
    it lands. Kenny's days only pull in the games, treats and care you've got the
    kit for."
  - **Three grouped sections**: Enrichment, Treats & food, Hygiene. Each section has
    an eyebrow + icon + hint, then its items.
  - **Kit item** (tappable card): a 26px check box (filled `--walk` green when
    owned), the item name (display) + an "ESSENTIAL" badge (if essential) + an "IN
    THE KIT" badge (if owned), the "why" line, and an unlocks line — "Unlocks X, Y
    +n" (muted when not owned) / "Unlocked …" (`--low` colour when owned). Tapping
    toggles ownership, which updates the plan everywhere live.

---

## Interactions & Behaviour
- **Tab switch** via bottom nav — instant; the active item expands to show its label.
- **Build** (Setup) → switch to Today (the plan is already derived from `form`, so
  Build is really just "go look at it").
- **Reshuffle** (Today) → increment a nonce passed into `buildDogDay` as a date
  suffix, producing a different but still-seeded arrangement; resets done-ticks.
- **Mark as done** → toggles an entry's key in a `doneSet`; in "Up next" the hero
  advances to the next not-done entry.
- **Tap a Week day** → set active date + switch to Today.
- **Toggle a Kit item** → add/remove from the owned-kit set; the derived plan
  recomputes (games/treats/care lock/unlock live).
- **Reminders toggle** → persists on/off; when turning on, requests Notification
  permission. **Preview a nudge** fires the toast + chime + system notification for
  the next pending entry. (See the original brief for the real reminder tiers:
  v1 = `setTimeout` per entry while the tab is open; v2 = service worker; v3 = Web
  Push. v1 is enough to ship.)
- **Day-care toggle** (Setup) → adds/removes the date in `dayCareDates`; Today shows
  a rest state and Week marks the day off-plan.
- **Entrance motion:** subtle 0.3s translate-only slide-in on view/card mount
  (`kd-rise` / `kd-pop`). **Important:** these animate *transform only* — never gate
  visibility on opacity in a keyframe (the resting state must be fully visible so
  print/paused/reduced-motion never hide content). Honour `prefers-reduced-motion`.

## State Management
- `form`: `{ date, dayStart, dayEnd, reminders: boolean, dayCareDates: string[],
  events: [{id, start, end, label}], walks: [{id, time}] }`
- `ownedKit`: `Set<string>` of kit item names (default seeds a few:
  `Treat pouch`, `Long training line`, `Dog toothbrush & paste`, `Treat variety pack`).
- `doneSet`: `Set<string>` of entry keys (`"HH:MM-title"`).
- `activeTab`: `'today' | 'week' | 'kit' | 'setup'`.
- `reshuffleNonce`: number.
- **Derived:** `plan = buildDogDay({...form, owned: [...ownedKit], date: date(+nonce)})`,
  `shopping = buildShoppingList()`.
- **Persist** to `localStorage`: form, activeTab, doneSet, ownedKit.

---

## Design Tokens

> Colours are authored in **oklch** (source of truth, widely supported). Convert to
> your codebase's format if needed. Two palettes exist in the prototype; **ship
> "Sunset"** (the default). "Warm" is an alternate the owner may want as a theme
> toggle later.

### Sunset palette (DEFAULT — ship this)
```
--paper        oklch(0.957 0.022 52)     /* warm peach-cream page bg */
--paper-card   oklch(0.987 0.012 58)     /* card surface */
--ink          oklch(0.34 0.045 350)     /* primary text (warm plum-black) */
--ink-soft     oklch(0.50 0.040 350)     /* secondary text */
--ink-faint    oklch(0.64 0.030 350)     /* tertiary text / icons */
--plum         oklch(0.405 0.058 350)    /* dark brand (nav, week-active, accents) */
--plum-deep    oklch(0.320 0.050 350)    /* on warm pills, deepest */
--plum-tint    oklch(0.925 0.025 350)    /* explainer/info surfaces */
--on-plum      oklch(0.972 0.018 60)     /* text on dark/gradient */
--on-plum-soft oklch(0.825 0.040 30)     /* muted text/icons on dark */
--high         oklch(0.660 0.135 38)     /* hot / high arousal / primary accent (terracotta) */
--high-tint    oklch(0.930 0.045 40)
--med          oklch(0.785 0.100 62)     /* medium arousal (apricot/ochre) */
--med-tint     oklch(0.945 0.040 66)
--low          oklch(0.645 0.068 330)    /* calm / low arousal (dusty mauve) */
--low-tint     oklch(0.935 0.028 332)
--walk         oklch(0.605 0.052 188)    /* walks (dusty teal) */
--walk-tint    oklch(0.935 0.024 188)
--walk-deep    oklch(0.445 0.050 192)
--treat        oklch(0.665 0.115 15)     /* treats/surprises (rose-coral) */
--treat-tint   oklch(0.935 0.040 18)
--care         oklch(0.580 0.030 50)     /* hygiene/care (warm taupe) */
--care-tint    oklch(0.928 0.018 52)
--chip         oklch(0.40 0.058 350 / 0.07)   /* neutral chip background */

/* gradients */
--grad-header  linear-gradient(152deg, oklch(0.560 0.085 12) 0%, oklch(0.450 0.072 350) 52%, oklch(0.380 0.058 332) 100%)
--grad-primary linear-gradient(135deg, oklch(0.730 0.110 52) 0%, oklch(0.640 0.140 28) 100%)
--nav-bg       linear-gradient(150deg, oklch(0.445 0.068 352) 0%, oklch(0.350 0.055 338) 100%)
```

### Radii
`--r-card: 26px · --r-lg: 22px · --r-md: 16px · --r-pill: 999px`

### Shadows
```
--sh-1   0 1px 2px oklch(0.33 0.078 350 / 0.06), 0 4px 14px oklch(0.33 0.078 350 / 0.07)
--sh-2   0 2px 6px oklch(0.33 0.078 350 / 0.08), 0 14px 34px oklch(0.33 0.078 350 / 0.12)
--sh-plum (Sunset)  0 14px 30px oklch(0.320 0.050 350 / 0.28)
```

### Spacing & sizing notes
Content column ≈ 402px wide, page padding 16px (top 56px to clear a phone status
bar — drop on desktop), card gaps 14–16px. Touch targets ≥ 44px. Body text never
below ~13px; titles 16–26px.

### Typography (Google Fonts)
- **Display / headings:** `Bricolage Grotesque` (500/600/700), letter-spacing ≈ -0.02em.
- **Body / UI:** `Hanken Grotesk` (400/500/600/700).
- **Timestamps & micro-labels (eyebrows):** `Space Mono` (400/700), uppercase,
  letter-spacing ≈ 0.14em for eyebrows; tabular-nums for times.

---

## Assets
- **No raster image assets** are required. All icons are simple inline SVG line
  icons defined in `components.jsx` (`Icon` component): search, menu, plus, close,
  trash, clock, bell/bellOff, check, shuffle, edit, chevrons, calendar, sun, moon,
  paw, walk, cart, list, flame, leaf, sparkle, pin, gift, droplet. Recreate with
  your icon library (Lucide/Phosphor are close matches) or port the SVGs.
- **Dog avatar:** a user-supplied photo (circle). The prototype uses a drag-drop
  placeholder (`image-slot.js`); in production use a normal image upload or a static
  avatar with a sensible default.
- **Fonts:** the three Google Fonts above.

---

## Files (in `prototype/`)
- `engine.js` — **the planning engine (port to TS, reuse logic verbatim).**
- `styles.css` — design tokens + base component styles (the source of the tokens above).
- `index.html` — entry point wiring everything together (prototype only).
- `app.jsx` — app shell: state, tab routing, header, toast/chime, day-care, derivation.
- `components.jsx` — `Icon`, `ArousalIndicator`, `entryMeta`, `BottomNav`, `Toast`.
- `setup.jsx` — the Setup form.
- `day.jsx` — the Today timeline (`EntryCard`, `RibbonRow`, three layouts, empty state).
- `week.jsx` — the Week planner (`WeekView`, `MiniTimeline`).
- `shopping.jsx` — the Kit list (`KitView`, `KitItem`).
- `ios-frame.jsx`, `tweaks-panel.jsx`, `image-slot.js` — **prototype scaffolding, do not port.**
- `../ORIGINAL_BRIEF.md` — the original functional + build brief (Angular, reminder tiers, scope).

## Out of scope (v1)
Accounts, settings, social, multi-dog support, marketing pages. Calendar/ICS import
and a "which games landed" feedback loop are noted as later nice-to-haves in the
original brief.
