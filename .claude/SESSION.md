# Session Log

## Current State

### Active Work
Dog Day (a generic Angular 16 dog-care PWA, product name "Dog Day") is fully built and
live — GitHub Pages for the app plus a free Cloudflare Worker for iOS Web Push. Three
improvement phases are done (UI fixes, richer activities, recurring routine); just fixed
iOS date/time input alignment, pending deploy + on-device verification.

### Up Next
- [ ] Deploy the iOS input-alignment fix and verify it on the iPhone
- [ ] Verify a real *scheduled* push notification fires end-to-end (not just the test button)
- [ ] (Optional) AI-generated activity freshness as a later enhancement
- [ ] (Optional) per-day one-off schedule overrides on top of the recurring routine

### Key Files
- `.claude/RULES.md` — coding standards (TypeScript / Angular / SCSS)
- `src/app/engine/engagement-engine.ts` — pure planning engine + activity/care/treat catalogs (single source of truth)
- `src/app/services/planner.service.ts` — RxJS state store + derived plan/shopping/week + per-weekday recurrence
- `src/app/services/push.service.ts` + `worker/src/index.ts` — Web Push (frontend SwPush + Cloudflare Worker)
- `src/app/config/push.config.ts` — VAPID public key + deployed Worker URL
- `scripts/generate-icons.js` — regenerates PWA/favicon/apple-touch icons from `.claude/app-icons/`
- `docs/DEPLOY.md`, `docs/NOTIFICATIONS.md` — deploy + notifications setup guides

### Learnings
- iOS Safari centres `date`/`time` input values (desktop Chrome left-aligns) → force `text-align: left` and use flex (not grid) so adjacent time fields don't cluster toward the middle.
- The Cloudflare account's workers.dev subdomain is **`dog-day`**, so the Worker URL is `dog-day-push.dog-day.workers.dev` — a wrong subdomain returns edge **error 1042** (HTTP unreachable) even though the cron keeps running fine.
- iOS Web Push requires **iOS 16.4+** and the PWA **installed to the home screen** (not a Safari tab); it needs **no Apple Developer fee** (native local notifications would need the $99/yr account).
- `wrangler secret put NAME` — `NAME` is the secret's name (keep it literal, e.g. `VAPID_PRIVATE_KEY`); the secret value is typed at the interactive prompt, never inline.
- On Windows Git-Bash, `--base-href /x/` gets path-mangled into `C:/Program Files/Git/x/` — run the build from PowerShell, or let CI do it (the GitHub Action derives base-href from the repo name).
- TypeScript 5.7's `Uint8Array<ArrayBufferLike>` change breaks Web Crypto typing — pin the Worker's TypeScript to `~5.6` (wrangler bundles via esbuild, so runtime is unaffected).
- Angular 16 *does* have signals (developer-preview), but this project deliberately uses an RxJS BehaviorSubject store per the owner's preference.
- After engine output-shape changes, `GameItem`/`WalkItem` literals in specs must include the new required fields (e.g. `minutes`, `equipment`).
- Storage is namespaced `dogday.v2.*`; deliberately NOT bumped during content changes so the live user's name/photo/push-subscription survive (old done-ticks simply stop matching).

---

## Session Index

| # | Date | Summary | Tags |
|---|------|---------|------|
| 1 | 2026-06-09 | Built Dog Day PWA end-to-end: app, GitHub Pages deploy, iOS push, 3 improvement phases | `feature` `pwa` `notifications` `deploy` |

---

## Session 1 — 2026-06-09

### Summary
Built "Dog Day" from the Kenny's Day v2 design handoff — ported the planning engine to typed
TypeScript, built the full 4-tab app (Today / Week / Kit / Setup), made it generic (configurable
dog name + avatar) for a possible App Store release, deployed it free to GitHub Pages, added
free iOS Web Push via a Cloudflare Worker, generated real app icons + an in-app logo, then
worked through three improvement phases.

### Changes Made
- `src/app/engine/engagement-engine.ts`: ported + typed the engine; expanded the catalog to ~28 activities with durations, variations and equipment; no-duplicate-per-day guarantee; daily "extra" notes; per-slot `swapGame`; recurring inputs and walk-duration windows.
- `src/app/services/planner.service.ts`: RxJS store (form / kit / done / tab / nonce / swaps), derived `plan$`/`shopping$`/`week$`, `{dog}` name substitution, per-weekday recurrence resolution, walk-duration mapping, absolute-timestamp reminder flattening, old-data normalisation.
- `src/app/services/reminder.service.ts`: in-tab toast + two-note WebAudio chime + Notification.
- `src/app/services/push.service.ts` + `worker/` (index.ts, webpush.ts, wrangler.toml): Web Push via `SwPush` and a Cloudflare Worker (VAPID, KV, every-minute cron, hand-rolled aes128gcm crypto).
- `src/app/services/profile.service.ts` + `components/profile-card`: dog name + canvas-resized avatar.
- `src/app/components/*`: ~17 standalone OnPush components (header, logo, icon, arousal-indicator, toast, bottom-nav, setup-form, day-timeline, entry-card, ribbon-row, week-planner, mini-timeline, kit-list, kit-item, push-setup).
- `src/styles/*`: Sunset oklch design tokens + base layer; iOS date/time input alignment fix.
- Deploy: `.github/workflows/deploy.yml`, `docs/DEPLOY.md`, `docs/NOTIFICATIONS.md`, `package.json` scripts.
- Icons: `scripts/generate-icons.js` (sharp + png-to-ico) → PWA/favicon/apple-touch icons + manifest/index updates.

### Decisions
- Build the **v2 4-tab scope** (ported `prototype/engine.js`) over the simpler v1: it's the realized high-fidelity design.
- **Standalone components** over NgModules (matches the brief).
- **RxJS BehaviorSubject store** over Angular signals — owner preference.
- Keep everything **generic** (`{dog}` token, renamed Kenny→generic, configurable profile) — possible App Store release.
- Free **iOS Web Push via a Cloudflare Worker** rather than native local notifications — native iOS would cost the $99/yr Apple Developer fee.
- The **client computes reminders as absolute UTC timestamps**, so the Worker needs zero timezone logic.
- Schedule model = **recurring routine + day-of-week chips** (not per-weekday templates) for least repeated input; walks gained durations.
- **No storage-version bump** during Phase 2/3 so the live user's data (name, photo, push subscription) is preserved.
- **Hand-rolled Web Push crypto** with Web Crypto (no npm deps) for reliability on Workers.

### Next Steps
- [ ] Deploy the iOS input-alignment fix and verify it on the iPhone
- [ ] Verify a real *scheduled* push notification fires end-to-end (not just the test button)
- [ ] (Optional) AI-generated activity freshness as a later enhancement
- [ ] (Optional) per-day one-off schedule overrides on top of the recurring routine

### Tags
`feature` `pwa` `notifications` `deploy`

---

## Archived Sessions

_No archived sessions yet._
