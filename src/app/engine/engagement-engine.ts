/* =============================================================================
 * Engagement Engine
 * -----------------------------------------------------------------------------
 * Dog-name-agnostic: content strings use the `{dog}` token, substituted with the
 * active dog's name in the service layer. Keep this file generic.
 * -----------------------------------------------------------------------------
 * Ported verbatim from the design handoff's prototype/engine.js — logic
 * unchanged, TypeScript types added. Pure functions only: no DOM, no Angular,
 * no globals. Seeded per date, so a refresh repeats the same plan but each new
 * day differs. The catalogs below are the SINGLE SOURCE OF TRUTH for both the
 * generated day and the shopping list — adding an entry needs no other change.
 *
 * Behavioural guardrails are deliberate (not bugs): nosework over-weighted,
 * never two high-arousal games back-to-back, a calm settle if the day ends hot,
 * space-needing games kept out of tiny gaps, games spaced >= 25 min apart.
 * ===========================================================================*/

export type Arousal = 'high' | 'med' | 'low';
export type GameCategory = 'nosework' | 'engagement' | 'training' | 'calm' | 'impulse';
export type TreatKind = 'toy' | 'food' | 'chew' | 'treat';
export type Intensity = 'light' | 'normal' | 'busy';
export type KitGroup = 'Enrichment' | 'Treats & food' | 'Hygiene';

export interface KitItem {
  name: string;
  essential: boolean;
  why: string;
}

export interface Game {
  id: string;
  title: string;
  category: GameCategory;
  arousal: Arousal;
  detail: string;
  kit: KitItem[];
  needsSpace?: boolean;
}

export interface CareTask {
  id: string;
  title: string;
  perWeek: number;
  detail: string;
  kit: KitItem[];
}

export interface Treat {
  id: string;
  title: string;
  kind: TreatKind;
  detail: string;
  kit: KitItem[];
}

export interface CalendarEvent {
  start: string;
  end: string;
  label?: string;
}

export interface BuildDayConfig {
  date: string;
  events?: CalendarEvent[];
  walks?: string[];
  dayStart?: string;
  dayEnd?: string;
  intensity?: Intensity;
  owned?: string[];
  treats?: boolean;
}

interface BaseItem {
  time: string;
  title: string;
  detail: string;
}

export interface WalkItem extends BaseItem {
  type: 'walk';
  tasks: string[];
}

export interface GameItem extends BaseItem {
  type: 'game';
  arousal: Arousal;
  category: GameCategory;
  gameId: string;
}

export interface TreatItem extends BaseItem {
  type: 'treat';
  treatKind: TreatKind;
  treatId: string;
}

export interface CareItem extends BaseItem {
  type: 'care';
  careId: string;
}

export type TimelineItem = WalkItem | GameItem | TreatItem | CareItem;

export interface ShoppingItem {
  name: string;
  essential: boolean;
  why: string;
  unlocks: string[];
  group: KitGroup;
}

/* Internal working item — carries minutes-since-midnight, stripped before return. */
type WorkItem = TimelineItem & { _min: number };

type SpecialSlot =
  | { type: 'treat'; data: Treat }
  | { type: 'care'; data: CareTask };

/* ----------------------------------------------------------------------------
 * Time + RNG helpers (everything internal is minutes since midnight).
 * -------------------------------------------------------------------------- */
export const toMin = (hhmm: string): number => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

export const toHHMM = (min: number): string => {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(arr: T[], rng: () => number, wf: (x: T) => number): T {
  let total = 0;
  const w = arr.map((x) => {
    const ww = wf(x);
    total += ww;
    return ww;
  });
  let r = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    if ((r -= w[i]) <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

/* ----------------------------------------------------------------------------
 * Needs-weighting: nosework deliberately heaviest (foraging outlet).
 * -------------------------------------------------------------------------- */
export const CATEGORY_WEIGHTS: Record<GameCategory, number> = {
  nosework: 5,
  engagement: 3,
  training: 2,
  calm: 2,
  impulse: 1
};

export const WALK_TASKS: string[] = [
  'Let {dog} pick the route for 5 minutes — follow his nose.',
  'Three “find it” treat scatters in the longer grass.',
  'Reward two voluntary check-ins (he looks back at you).',
  'Loose-lead stretch: stop the moment the lead goes tight.',
  'One full minute of just sniffing a single bush — no rushing.',
  'Practise a relaxed “this way” turn, mark and treat.',
  'Sit-watch as a bike or jogger passes, then carry on.',
  'Hand-touch recall away from a mild distraction.',
  'Let him watch the world from a bench for two minutes.',
  'Scatter the last of the kibble in leaf litter before home.',
  'Two slow pace changes — speed up, then “steady”.',
  'Sniff-and-stroll: zero agenda for the final five minutes.'
];

/* GAME_CATALOG — kit rolls up into the Enrichment group of the shopping list. */
export const GAME_CATALOG: Game[] = [
  { id: 'scatter-feed', title: 'Scatter feed', category: 'nosework', arousal: 'low',
    detail: 'Toss a handful of his meal across the rug — let him hoover it up.', kit: [] },
  { id: 'snuffle-mat', title: 'Snuffle mat hunt', category: 'nosework', arousal: 'low',
    detail: 'Work food into the mat and let him forage it out, nose first.',
    kit: [{ name: 'Snuffle mat', essential: false, why: 'A dense foraging outlet that tires the brain, not the legs.' }] },
  { id: 'find-it', title: '“Find it” hide', category: 'nosework', arousal: 'med',
    detail: 'Pop him behind a door, hide 5 treats around the room, release.',
    kit: [{ name: 'Treat pouch', essential: true, why: 'Fast, fumble-free rewards keep the game flowing.' }] },
  { id: 'muffin-tin', title: 'Muffin-tin puzzle', category: 'nosework', arousal: 'low',
    detail: 'Treats in the cups, tennis balls on top — he nudges to uncover.',
    kit: [{ name: 'Tennis balls', essential: false, why: 'Turns a muffin tin into a free puzzle feeder.' }] },
  { id: 'box-forage', title: 'Cardboard forage', category: 'nosework', arousal: 'med',
    detail: 'Scrunch food into a box of paper — supervise the demolition.', kit: [] },
  { id: 'which-hand', title: 'Which hand?', category: 'nosework', arousal: 'low',
    detail: 'Treat in one fist, both out — he noses the right one to win it.', kit: [] },
  { id: 'tug-rules', title: 'Tug with rules', category: 'engagement', arousal: 'high',
    detail: 'Two minutes of tug, finishing on a clean “drop”. You start, you stop.',
    kit: [{ name: 'Tug toy', essential: false, why: 'Builds engagement and a reliable “drop” — you become the fun.' }], needsSpace: true },
  { id: 'flirt-pole', title: 'Flirt-pole chase', category: 'engagement', arousal: 'high',
    detail: 'Sweep it low, let him catch every few reps, end with a “settle”.',
    kit: [{ name: 'Flirt pole', essential: false, why: 'Burns chase energy in a small space — controlled, not chaotic.' }], needsSpace: true },
  { id: 'hide-seek', title: 'Hide & seek (you)', category: 'engagement', arousal: 'med',
    detail: 'Duck out of sight, call once, throw a party when he finds you.', kit: [] },
  { id: 'recall-pingpong', title: 'Recall ping-pong', category: 'training', arousal: 'med',
    detail: 'Two people, opposite ends, take turns calling and rewarding.',
    kit: [{ name: 'Treat pouch', essential: true, why: 'Fast, fumble-free rewards keep the game flowing.' }] },
  { id: 'place-settle', title: 'Place & settle', category: 'training', arousal: 'low',
    detail: 'Reward four calm seconds on the mat, building the duration slowly.',
    kit: [{ name: 'Settle mat', essential: false, why: 'A portable “off switch” he learns to relax on anywhere.' }] },
  { id: 'hand-target', title: 'Hand targeting', category: 'training', arousal: 'low',
    detail: 'Present a flat hand, mark the nose-bop, repeat ten happy reps.', kit: [] },
  { id: 'trick-spin', title: 'Trick: spin', category: 'training', arousal: 'med',
    detail: 'Lure a slow circle, mark mid-turn, fade the lure over reps.',
    kit: [{ name: 'Treat pouch', essential: true, why: 'Fast, fumble-free rewards keep the game flowing.' }] },
  { id: 'lickmat', title: 'Lickmat wind-down', category: 'calm', arousal: 'low',
    detail: 'Smear something soft, let the slow licking bring him down a gear.',
    kit: [{ name: 'Lickmat', essential: false, why: 'Licking is self-soothing — the calm bookend after busy games.' }] },
  { id: 'stuffed-kong', title: 'Stuffed chew', category: 'calm', arousal: 'low',
    detail: 'A stuffed Kong on his mat — a job that ends in a nap.',
    kit: [{ name: 'Rubber stuffable toy', essential: false, why: 'A long, settling chew that buys you a quiet work block.' }] },
  { id: 'long-line-recall', title: 'Long-line recall', category: 'training', arousal: 'med',
    detail: 'In the garden, reel out, call off a sniff, party on arrival.',
    kit: [{ name: 'Long training line', essential: true, why: 'Safe distance recall reps before you trust it off-lead.' }], needsSpace: true }
];

/* CARE_TASKS — hygiene reminders; kit rolls up into the Hygiene group. */
export const CARE_TASKS: CareTask[] = [
  { id: 'teeth', title: 'Brush {dog}’s teeth', perWeek: 3,
    detail: 'A minute with the dog paste — little and often beats a yearly dental.',
    kit: [{ name: 'Dog toothbrush & paste', essential: true, why: 'Two minutes a few times a week saves a sedated dental later.' }] },
  { id: 'nails', title: 'Check & trim nails', perWeek: 1,
    detail: 'A nail or two at a time, paired with treats — keep it calm.',
    kit: [{ name: 'Nail clippers or grinder', essential: true, why: 'Short nails at home — cheaper and calmer than the vet.' }] },
  { id: 'brush', title: 'Quick coat brush', perWeek: 2,
    detail: 'Two minutes of de-shedding — most dogs learn to love it.',
    kit: [{ name: 'Slicker brush', essential: false, why: 'Less shedding, fewer mats, and a quiet bonding ritual.' }] },
  { id: 'ears', title: 'Ear check', perWeek: 1,
    detail: 'A quick look and sniff — catch gunk before it’s a vet trip.', kit: [] },
  { id: 'paws', title: 'Paw & pad check', perWeek: 1,
    detail: 'Look for grass seeds, cracks or anything lodged between the pads.', kit: [] }
];

/* TREATS — surprises; kit rolls up into the Treats & food group. */
export const TREATS: Treat[] = [
  { id: 'new-toy', title: 'Spring a new toy', kind: 'toy',
    detail: 'Bring out a fresh squeaky he hasn’t seen — novelty rebuilds your value.',
    kit: [{ name: 'A spare new toy', essential: false, why: 'Stash one to spring as a surprise when the week needs a lift.' }] },
  { id: 'topper', title: 'New food topper', kind: 'food',
    detail: 'A spoon of something different over dinner — sardine, egg or a new protein.',
    kit: [{ name: 'Food toppers', essential: false, why: 'Make an ordinary bowl exciting without overfeeding.' }] },
  { id: 'frozen', title: 'Frozen treat', kind: 'food',
    detail: 'Freeze his Kong or a lick — long-lasting and brilliant on a warm day.', kit: [] },
  { id: 'dental-chew', title: 'Dental chew', kind: 'chew',
    detail: 'A long-lasting chew that cleans teeth while it settles him — double duty.',
    kit: [{ name: 'Dental chews', essential: false, why: 'Cleans teeth and buys a calm half-hour — earns its place.' }] },
  { id: 'flavour', title: 'New treat flavour', kind: 'treat',
    detail: 'Break the routine with a treat he’s never tried — novelty is its own reward.',
    kit: [{ name: 'Treat variety pack', essential: false, why: 'A few flavours on hand to sprinkle novelty through the week.' }] }
];

function ownedOk(x: { kit?: KitItem[] }, owned?: string[]): boolean {
  if (!owned) return true;
  return (x.kit || []).every((k) => owned.includes(k.name));
}

/* ----------------------------------------------------------------------------
 * buildShoppingList — grouped, essentials-first, tagged with what each unlocks.
 * -------------------------------------------------------------------------- */
export function buildShoppingList(): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  const add = (kitArr: KitItem[] | undefined, group: KitGroup, label: string): void => {
    for (const k of kitArr || []) {
      if (!map.has(k.name)) {
        map.set(k.name, { name: k.name, essential: !!k.essential, why: k.why, group, unlocks: [] });
      }
      const it = map.get(k.name);
      if (!it) continue;
      it.essential = it.essential || !!k.essential;
      if (!it.unlocks.includes(label)) it.unlocks.push(label);
    }
  };
  for (const g of GAME_CATALOG) add(g.kit, 'Enrichment', g.title);
  for (const tr of TREATS) add(tr.kit, 'Treats & food', tr.title);
  for (const c of CARE_TASKS) add(c.kit, 'Hygiene', c.title);

  const groupOrder: Record<KitGroup, number> = { 'Enrichment': 0, 'Treats & food': 1, 'Hygiene': 2 };
  const items = [...map.values()];
  items.sort((a, b) => {
    if (a.group !== b.group) return groupOrder[a.group] - groupOrder[b.group];
    if (a.essential !== b.essential) return a.essential ? -1 : 1;
    return b.unlocks.length - a.unlocks.length;
  });
  return items;
}

/* ----------------------------------------------------------------------------
 * weightedGame — choose a game honouring guardrails (no high after high,
 * space-needing games out of small gaps, recent-variety window).
 * -------------------------------------------------------------------------- */
function weightedGame(
  rng: () => number,
  recentIds: string[],
  forbidHigh: boolean,
  maxGapMin: number,
  eligible: Game[]
): Game {
  const base = eligible && eligible.length ? eligible : GAME_CATALOG;
  const pool = base.filter((g) => {
    if (forbidHigh && g.arousal === 'high') return false;
    if (g.needsSpace && maxGapMin < 40) return false;
    if (recentIds.slice(-3).includes(g.id)) return false;
    return true;
  });
  const cands = pool.length ? pool : base.filter((g) => !(forbidHigh && g.arousal === 'high'));
  let total = 0;
  const weighted = cands.map((g) => {
    const w = CATEGORY_WEIGHTS[g.category] || 1;
    total += w;
    return { g, w };
  });
  let r = rng() * total;
  for (const { g, w } of weighted) {
    if ((r -= w) <= 0) return g;
  }
  return weighted[weighted.length - 1].g;
}

/* ----------------------------------------------------------------------------
 * buildDogDay — THE MAIN ENTRY POINT. Returns a sorted timeline.
 * -------------------------------------------------------------------------- */
export function buildDogDay(cfg: BuildDayConfig): TimelineItem[] {
  const {
    date,
    events = [],
    walks = [],
    dayStart = '08:00',
    dayEnd = '21:00',
    intensity = 'normal',
    owned,
    treats = true
  } = cfg;

  const rng = mulberry32(hashStr(String(date || 'seed') + '|' + intensity));
  const startM = toMin(dayStart);
  const endM = toMin(dayEnd);
  const eligible = GAME_CATALOG.filter((g) => ownedOk(g, owned));

  // Blocked intervals: commitments + ~45-min buffer around each walk.
  const WALK_BUFFER = 45;
  const blocks: number[][] = [];
  for (const e of events) {
    if (e && e.start && e.end) blocks.push([toMin(e.start), toMin(e.end)]);
  }
  const walkMins = walks
    .map(toMin)
    .filter((m) => m >= startM - 1 && m <= endM + 1)
    .sort((a, b) => a - b);
  for (const w of walkMins) blocks.push([w - WALK_BUFFER, w + WALK_BUFFER]);
  blocks.sort((a, b) => a[0] - b[0]);

  const merged: number[][] = [];
  for (const b of blocks) {
    if (!merged.length || b[0] > merged[merged.length - 1][1]) merged.push([...b]);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b[1]);
  }
  const gaps: number[][] = [];
  let cursor = startM;
  for (const [bs, be] of merged) {
    if (bs > cursor) gaps.push([cursor, Math.min(bs, endM)]);
    cursor = Math.max(cursor, be);
    if (cursor >= endM) break;
  }
  if (cursor < endM) gaps.push([cursor, endM]);

  // Candidate slot times across gaps (spacing + jitter preserved).
  const MIN_SPACING = 25;
  const intensityCap = intensity === 'light' ? 0.55 : intensity === 'busy' ? 1.0 : 0.78;
  const slots: number[] = [];
  for (const [gs, ge] of gaps) {
    const gapLen = ge - gs;
    if (gapLen < 20) continue;
    const maxFit = Math.floor(gapLen / (MIN_SPACING + 15));
    let n = Math.max(1, Math.min(maxFit, Math.round(maxFit * intensityCap)));
    n = Math.min(n, 3);
    let tt = gs + 8 + Math.floor(rng() * Math.min(20, Math.max(1, gapLen - n * MIN_SPACING)));
    for (let i = 0; i < n; i++) {
      if (tt + 10 > ge) break;
      slots.push(tt);
      tt += MIN_SPACING + Math.floor(rng() * 22);
    }
  }

  // Day's sprinkles — seeded separately for stability.
  const sr = mulberry32(hashStr(String(date) + '|sprinkle'));
  const careElig = CARE_TASKS.filter((c) => ownedOk(c, owned));
  const treatElig = TREATS.filter((t) => ownedOk(t, owned));
  const treatPick = treats && sr() < 0.3 && treatElig.length ? pickWeighted(treatElig, sr, () => 1) : null;
  const carePick = sr() < 0.6 && careElig.length ? pickWeighted(careElig, sr, (c) => c.perWeek) : null;

  // Assign special slots (random, distinct).
  const order = slots.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(sr() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const special: Record<number, SpecialSlot> = {};
  let oi = 0;
  if (treatPick && oi < order.length) special[order[oi++]] = { type: 'treat', data: treatPick };
  if (carePick && oi < order.length) special[order[oi++]] = { type: 'care', data: carePick };

  // Build slot items in time order; track arousal for game guardrails.
  const items: WorkItem[] = [];
  const recent: string[] = [];
  let lastHigh = false;
  slots.forEach((tt, i) => {
    const sp = special[i];
    if (sp && sp.type === 'treat') {
      items.push({ time: toHHMM(tt), _min: tt, type: 'treat', title: sp.data.title, detail: sp.data.detail, treatKind: sp.data.kind, treatId: sp.data.id });
    } else if (sp && sp.type === 'care') {
      items.push({ time: toHHMM(tt), _min: tt, type: 'care', title: sp.data.title, detail: sp.data.detail, careId: sp.data.id });
    } else {
      const next = slots[i + 1] != null ? slots[i + 1] : endM;
      const g = weightedGame(rng, recent, lastHigh, next - tt, eligible);
      items.push({ time: toHHMM(tt), _min: tt, type: 'game', title: g.title, detail: g.detail, arousal: g.arousal, category: g.category, gameId: g.id });
      recent.push(g.id);
      lastHigh = g.arousal === 'high';
    }
  });

  // Walks (3 tasks each).
  for (const w of walkMins) {
    const pool = [...WALK_TASKS];
    const picks: string[] = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      picks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
    items.push({ time: toHHMM(w), _min: w, type: 'walk', title: rng() > 0.5 ? 'Sniffari walk' : 'Engagement walk', detail: 'Loose lead, lots of sniffing — let the nose do the work.', tasks: picks });
  }

  items.sort((a, b) => a._min - b._min);

  // Settle if the day finished on a high (games only).
  const last = items[items.length - 1];
  if (last && last.type === 'game' && last.arousal === 'high') {
    const settle =
      eligible.find((g) => g.id === 'lickmat') ||
      eligible.find((g) => g.arousal === 'low') ||
      eligible.find((g) => g.arousal !== 'high');
    if (settle) {
      const t = Math.min(last._min + 30, endM - 5);
      items.push({ time: toHHMM(t), _min: t, type: 'game', title: settle.title, detail: settle.detail, arousal: settle.arousal, category: settle.category, gameId: settle.id });
    }
  }

  // Never two high games back-to-back.
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    if (a.type === 'game' && b.type === 'game' && a.arousal === 'high' && b.arousal === 'high') {
      const alt = weightedGame(mulberry32(hashStr(b.gameId + i)), recent, true, 999, eligible);
      b.title = alt.title;
      b.detail = alt.detail;
      b.arousal = alt.arousal;
      b.category = alt.category;
      b.gameId = alt.id;
    }
  }

  return items.map(({ _min, ...rest }) => rest);
}
