/* =============================================================================
 * Engagement Engine
 * -----------------------------------------------------------------------------
 * Dog-name-agnostic: content strings use the `{dog}` token, substituted with the
 * active dog's name in the service layer. Keep this file generic.
 * -----------------------------------------------------------------------------
 * Pure functions only: no DOM, no Angular, no globals. Seeded per date, so a
 * refresh repeats the same plan but each new day differs. The catalogs below are
 * the SINGLE SOURCE OF TRUTH for both the generated day and the shopping list.
 *
 * Behavioural guardrails are deliberate (not bugs): nosework over-weighted,
 * never two high-arousal games back-to-back, a calm settle if the day ends hot,
 * space-needing games kept out of tiny gaps, no activity repeats within a day.
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
  minutes: number;
  detail: string;
  variations: string[];
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

export interface WalkInput {
  time: string;
  minutes?: number;
}

export interface BuildDayConfig {
  date: string;
  events?: CalendarEvent[];
  walks?: WalkInput[];
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

/** Game-specific fields shared by built items and the swap helper. */
export interface GameFields {
  title: string;
  detail: string;
  arousal: Arousal;
  category: GameCategory;
  gameId: string;
  minutes: number;
  equipment: string[];
  variation?: string;
}

export interface WalkItem extends BaseItem {
  type: 'walk';
  tasks: string[];
  minutes: number;
}

export interface GameItem extends BaseItem {
  type: 'game';
  arousal: Arousal;
  category: GameCategory;
  gameId: string;
  minutes: number;
  equipment: string[];
  variation?: string;
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
  impulse: 2
};

export const WALK_TASKS: string[] = [
  'Let {dog} pick the route for 5 minutes — follow the nose.',
  'Three “find it” treat scatters in the longer grass.',
  'Reward two voluntary check-ins (a glance back at you).',
  'Loose-lead stretch: stop the moment the lead goes tight.',
  'One full minute of just sniffing a single bush — no rushing.',
  'Practise a relaxed “this way” turn, mark and treat.',
  'Sit-watch as a bike or jogger passes, then carry on.',
  'Hand-touch recall away from a mild distraction.',
  'Let {dog} watch the world from a bench for two minutes.',
  'Scatter the last of the kibble in leaf litter before home.',
  'Two slow pace changes — speed up, then “steady”.',
  'Sniff-and-stroll: zero agenda for the final five minutes.'
];

/* Reusable kit definitions (kept consistent so the shopping list groups well). */
const TREAT_POUCH: KitItem = { name: 'Treat pouch', essential: true, why: 'Fast, fumble-free rewards keep the game flowing.' };

/* GAME_CATALOG — kit rolls up into the Enrichment group of the shopping list.
 * Each game has a duration estimate and a couple of variations for freshness. */
export const GAME_CATALOG: Game[] = [
  // --- Nosework (foraging — over-weighted, the biggest need) ---------------
  { id: 'scatter-feed', title: 'Scatter feed', category: 'nosework', arousal: 'low', minutes: 8,
    detail: 'Toss a handful of the meal across the rug or lawn and let {dog} hoover it up, nose down.',
    variations: ['Use the grass outside for an extra-long forage.', 'Scatter into a folded blanket so it takes real searching.'], kit: [] },
  { id: 'snuffle-mat', title: 'Snuffle mat hunt', category: 'nosework', arousal: 'low', minutes: 12,
    detail: 'Work food deep into the mat and let {dog} forage it out, nose first — a brilliant brain-tirer.',
    variations: ['Hide one jackpot chew in the middle.', 'Mix in a couple of new smells like a torn herb leaf.'],
    kit: [{ name: 'Snuffle mat', essential: false, why: 'A dense foraging outlet that tires the brain, not the legs.' }] },
  { id: 'find-it', title: '“Find it” hide', category: 'nosework', arousal: 'med', minutes: 8,
    detail: 'Pop {dog} behind a door, hide five treats around the room, then release with “find it”.',
    variations: ['Build up to hiding them in the next room.', 'Hide a favourite toy instead of food.'],
    kit: [TREAT_POUCH] },
  { id: 'muffin-tin', title: 'Muffin-tin puzzle', category: 'nosework', arousal: 'low', minutes: 10,
    detail: 'Treats in the cups, tennis balls on top — {dog} nudges each ball aside to win the prize.',
    variations: ['Only bait half the cups to make it a real hunt.', 'Use scrunched paper instead of balls.'],
    kit: [{ name: 'Tennis balls', essential: false, why: 'Turns a muffin tin into a free puzzle feeder.' }] },
  { id: 'box-forage', title: 'Cardboard forage', category: 'nosework', arousal: 'med', minutes: 10,
    detail: 'Scrunch food into a box stuffed with paper and let {dog} demolish it to find every piece. Supervise.',
    variations: ['Nest a smaller box inside a bigger one.', 'Add an empty loo roll with the ends folded.'], kit: [] },
  { id: 'which-hand', title: 'Which hand?', category: 'nosework', arousal: 'low', minutes: 5,
    detail: 'A treat in one fist, both hands out — {dog} noses the right hand to win it. Pure scent-work.',
    variations: ['Move to two closed boxes once it’s easy.', 'Add a gentle “which one?” cue.'], kit: [] },
  { id: 'towel-burrito', title: 'Towel burrito', category: 'nosework', arousal: 'low', minutes: 8,
    detail: 'Roll treats inside an old towel and let {dog} unpick it — cheap, brilliant for a problem-solver.',
    variations: ['Tie a loose knot in the towel for extra challenge.', 'Layer two towels for a harder unwrap.'],
    kit: [{ name: 'Old towel', essential: false, why: 'A free, washable puzzle you already own.' }] },
  { id: 'scent-trail', title: 'Scent trail', category: 'nosework', arousal: 'med', minutes: 10,
    detail: 'Drag a treat along the floor to make a trail ending in a small jackpot, then let {dog} follow it.',
    variations: ['Lay the trail around furniture for twists.', 'Finish at a stuffed toy as the prize.'],
    kit: [TREAT_POUCH] },
  { id: 'find-the-toy', title: 'Name & find a toy', category: 'nosework', arousal: 'med', minutes: 10,
    detail: 'Name one toy, hide it in easy view, send {dog} to “find Teddy”, party on the win. Build slowly.',
    variations: ['Hide it slightly harder each round.', 'Add a second named toy once one is solid.'], kit: [] },

  // --- Engagement (be the most interesting thing) --------------------------
  { id: 'tug-rules', title: 'Tug with rules', category: 'engagement', arousal: 'high', minutes: 5,
    detail: 'Two minutes of proper tug, finishing on a clean “drop”. You start it, you end it — you become the fun.',
    variations: ['Ask for a sit between each round.', 'Let {dog} win, then restart to build drive.'],
    kit: [{ name: 'Tug toy', essential: false, why: 'Builds engagement and a reliable “drop”.' }], needsSpace: true },
  { id: 'flirt-pole', title: 'Flirt-pole chase', category: 'engagement', arousal: 'high', minutes: 6,
    detail: 'Sweep the lure low along the ground in arcs, let {dog} catch it every few reps, end on a settle.',
    variations: ['Hide it behind your back to reset focus.', 'Finish with a tug-and-drop.'],
    kit: [{ name: 'Flirt pole', essential: false, why: 'Burns chase energy in a small space — controlled, not chaotic.' }], needsSpace: true },
  { id: 'hide-seek', title: 'Hide & seek', category: 'engagement', arousal: 'med', minutes: 6,
    detail: 'Duck out of sight while {dog} is distracted, call once, then throw a party when you’re found.',
    variations: ['Hide somewhere trickier each time.', 'Have two people take turns calling.'], kit: [] },
  { id: 'middle', title: 'Come to “middle”', category: 'engagement', arousal: 'med', minutes: 5,
    detail: 'Reward {dog} for coming to sit between your legs — a portable safe spot and a lovely focus game.',
    variations: ['Add it on walks when something worries him.', 'Build a few seconds of duration.'],
    kit: [TREAT_POUCH] },
  { id: 'chase-me', title: 'Run-away recall', category: 'engagement', arousal: 'high', minutes: 4,
    detail: 'When {dog} drifts but is near, jog away playfully — the movement triggers the chase. Big reward on the catch-up.',
    variations: ['Change direction suddenly mid-jog.', 'Reward with a thrown treat to keep him moving.'],
    kit: [TREAT_POUCH] },
  { id: 'two-toy', title: 'Two-toy swap', category: 'engagement', arousal: 'med', minutes: 6,
    detail: 'Throw one toy; when {dog} brings it back, bring a second to life so he drops the first to chase it.',
    variations: ['Add a “drop” cue as he lets go.', 'Use the garden for longer throws.'],
    kit: [{ name: 'Two matching toys', essential: false, why: 'Two identical toys make fetch self-rewarding.' }], needsSpace: true },

  // --- Training (short skill bursts) ---------------------------------------
  { id: 'recall-pingpong', title: 'Recall ping-pong', category: 'training', arousal: 'med', minutes: 6,
    detail: 'Two people, opposite ends of the room, take turns calling {dog} and rewarding the arrival.',
    variations: ['Spread further apart as it gets reliable.', 'Add a sit before each reward.'],
    kit: [TREAT_POUCH] },
  { id: 'hand-target', title: 'Hand targeting', category: 'training', arousal: 'low', minutes: 5,
    detail: 'Present a flat hand, mark the nose-bop, repeat ten happy reps. A brilliant focus and recall tool.',
    variations: ['Move the hand higher and lower.', 'Use it to guide {dog} onto a mat.'], kit: [] },
  { id: 'trick-spin', title: 'Trick: spin', category: 'training', arousal: 'med', minutes: 6,
    detail: 'Lure {dog} in a slow circle, mark mid-turn, then fade the lure over reps. Novelty = engagement.',
    variations: ['Teach a spin each way and name them.', 'Fade to just a small hand signal.'],
    kit: [TREAT_POUCH] },
  { id: 'trick-bow', title: 'Trick: take a bow', category: 'training', arousal: 'med', minutes: 6,
    detail: 'Lure {dog}’s front end down while the back stays up, mark the bow, release up. A cute, easy win.',
    variations: ['Catch a natural stretchy bow and name it.', 'Pair it with a verbal “bravo!”.'],
    kit: [TREAT_POUCH] },
  { id: 'long-line-recall', title: 'Long-line recall', category: 'training', arousal: 'med', minutes: 10,
    detail: 'In the garden, let the line out, call {dog} off a sniff, and throw a party on arrival.',
    variations: ['Practise around mild distractions.', 'Reward with a game of tug, not just food.'],
    kit: [{ name: 'Long training line', essential: true, why: 'Safe distance recall reps before you trust it off-lead.' }], needsSpace: true },
  { id: 'loose-lead-laps', title: 'Loose-lead laps', category: 'training', arousal: 'low', minutes: 8,
    detail: 'Walk slow laps of the garden or hall, rewarding {dog} for a soft lead — practice where it’s easy first.',
    variations: ['Change direction whenever the lead tightens.', 'Add a calm “let’s go” cue.'], kit: [] },

  // --- Impulse control (self-control, the off-switch skills) ----------------
  { id: 'leave-it', title: '“Leave it” reps', category: 'impulse', arousal: 'low', minutes: 5,
    detail: 'Reward {dog} for leaving food on the floor, then slowly build the difficulty. The tool you need for grass.',
    variations: ['Progress to a treat between the paws.', 'Practise past one tempting thing on a walk.'],
    kit: [TREAT_POUCH] },
  { id: 'wait-for-bowl', title: 'Wait for the bowl', category: 'impulse', arousal: 'low', minutes: 4,
    detail: 'Hold the food bowl, ask {dog} to wait, lower it; if he breaks, it goes back up. Calm earns dinner.',
    variations: ['Build to a few seconds of stillness.', 'Add a release word like “okay”.'], kit: [] },
  { id: 'door-manners', title: 'Doorway manners', category: 'impulse', arousal: 'low', minutes: 5,
    detail: 'At a door, wait for {dog} to pause rather than barge; the door only opens for calm. Real-life impulse work.',
    variations: ['Practise at the garden door first.', 'Add a sit before you open.'], kit: [] },
  { id: 'its-yer-choice', title: 'Closed-fist choice', category: 'impulse', arousal: 'low', minutes: 6,
    detail: 'Hold treats in a closed fist; the moment {dog} stops pushing and backs off, open and reward the choice.',
    variations: ['Move to an open palm once it’s easy.', 'Reward eye contact, not just backing off.'],
    kit: [TREAT_POUCH] },

  // --- Calm (wind-down / off-switch) ---------------------------------------
  { id: 'lickmat', title: 'Lickmat wind-down', category: 'calm', arousal: 'low', minutes: 10,
    detail: 'Smear something soft over the mat and let the slow licking bring {dog} down a gear. The calm bookend.',
    variations: ['Freeze it for a longer, hotter-day version.', 'Use plain yoghurt or wet food.'],
    kit: [{ name: 'Lickmat', essential: false, why: 'Licking is self-soothing — the calm bookend after busy games.' }] },
  { id: 'stuffed-kong', title: 'Stuffed chew toy', category: 'calm', arousal: 'low', minutes: 15,
    detail: 'A stuffed rubber toy on the mat — a long, settling job for {dog} that tends to end in a nap.',
    variations: ['Freeze it to make it last much longer.', 'Layer kibble, wet food and a chew at the end.'],
    kit: [{ name: 'Rubber stuffable toy', essential: false, why: 'A long, settling chew that buys you a quiet block.' }] },
  { id: 'place-settle', title: 'Place & settle', category: 'calm', arousal: 'low', minutes: 8,
    detail: 'Reward {dog} for a few calm seconds on the mat, building the duration slowly. A real off-switch.',
    variations: ['Drop occasional treats for staying down.', 'Move the mat to a new room.'],
    kit: [{ name: 'Settle mat', essential: false, why: 'A portable “off switch” spot {dog} learns to relax on anywhere.' }] },
  { id: 'calm-handling', title: 'Calm handling', category: 'calm', arousal: 'low', minutes: 6,
    detail: 'Gentle, slow handling of ears, paws and chin paired with calm praise — builds trust and easy vet visits.',
    variations: ['Pair each touch with a treat at first.', 'Keep sessions short and stop while he’s happy.'], kit: [] }
];

/* CARE_TASKS — hygiene reminders; kit rolls up into the Hygiene group. */
export const CARE_TASKS: CareTask[] = [
  { id: 'teeth', title: 'Brush {dog}’s teeth', perWeek: 3,
    detail: 'A minute with the dog paste — little and often beats a yearly dental.',
    kit: [{ name: 'Dog toothbrush & paste', essential: true, why: 'A few minutes a week saves a sedated dental later.' }] },
  { id: 'nails', title: 'Check & trim nails', perWeek: 1,
    detail: 'A nail or two at a time, paired with treats — keep it calm and stop while it’s going well.',
    kit: [{ name: 'Nail clippers or grinder', essential: true, why: 'Short nails at home — cheaper and calmer than the vet.' }] },
  { id: 'brush', title: 'Quick coat brush', perWeek: 2,
    detail: 'Two minutes of de-shedding — most dogs learn to love it as a bit of quiet attention.',
    kit: [{ name: 'Slicker brush', essential: false, why: 'Less shedding, fewer mats, and a quiet bonding ritual.' }] },
  { id: 'ears', title: 'Ear check', perWeek: 1,
    detail: 'A quick look and sniff — catch gunk or a yeasty smell before it becomes a vet trip.', kit: [] },
  { id: 'paws', title: 'Paw & pad check', perWeek: 1,
    detail: 'Look for grass seeds, cracks, or anything lodged between the pads, especially after fields.', kit: [] },
  { id: 'eyes', title: 'Eye wipe', perWeek: 2,
    detail: 'Gently wipe any sleep or tear-staining from the corners with a damp cloth.', kit: [] }
];

/* TREATS — surprises; kit rolls up into the Treats & food group. */
export const TREATS: Treat[] = [
  { id: 'new-toy', title: 'Spring a new toy', kind: 'toy',
    detail: 'Bring out a fresh toy {dog} hasn’t seen — novelty rebuilds your value as the fun one.',
    kit: [{ name: 'A spare new toy', essential: false, why: 'Stash one to spring as a surprise when the week needs a lift.' }] },
  { id: 'topper', title: 'New food topper', kind: 'food',
    detail: 'A spoon of something different over dinner — sardine, egg or a new protein.',
    kit: [{ name: 'Food toppers', essential: false, why: 'Make an ordinary bowl exciting without overfeeding.' }] },
  { id: 'frozen', title: 'Frozen treat', kind: 'food',
    detail: 'Freeze a stuffed toy or a lick — long-lasting and brilliant on a warm day.', kit: [] },
  { id: 'dental-chew', title: 'Dental chew', kind: 'chew',
    detail: 'A long-lasting chew that cleans teeth while it settles {dog} — double duty.',
    kit: [{ name: 'Dental chews', essential: false, why: 'Cleans teeth and buys a calm half-hour — earns its place.' }] },
  { id: 'flavour', title: 'New treat flavour', kind: 'treat',
    detail: 'Break the routine with a treat {dog} has never tried — novelty is its own reward.',
    kit: [{ name: 'Treat variety pack', essential: false, why: 'A few flavours on hand to sprinkle novelty through the week.' }] },
  { id: 'puzzle-feeder', title: 'Puzzle dinner', kind: 'food',
    detail: 'Serve dinner in a puzzle feeder tonight instead of the bowl — work for it, enjoy it more.',
    kit: [{ name: 'Puzzle feeder', essential: false, why: 'Turns a 30-second bowl into ten minutes of happy problem-solving.' }] }
];

/* A nice non-task thing to do for your dog, picked fresh each day. */
export const DAILY_NOTES: string[] = [
  'Spend five quiet minutes just sitting with {dog} — no agenda, only company.',
  'Let {dog} sniff everything on today’s walk, however long it takes. The walk is for the dog.',
  'Find the ear or chest scratch {dog} leans into, and give it a little longer today.',
  'Take a different route today — a new world of smells is a treat in itself.',
  'Hand-feed a few bites of dinner today, just to be the good thing.',
  'Teach nothing today. Let {dog} simply be a dog and enjoy the quiet.',
  'Take one nice photo of {dog} today — you’ll be glad of it in a year.',
  'Give a slow, calm fuss before bed and end the day on a good note.',
  'Let {dog} choose the toy today, even if it’s the squeaky one.',
  'Find a sunny spot and let {dog} bask in it for ten minutes.',
  'Say {dog}’s name in a happy voice and reward the look — for no reason at all.',
  'Let {dog} watch the world go by from somewhere comfy today.'
];

export function pickDailyNote(date: string): string {
  const rng = mulberry32(hashStr(String(date) + '|note'));
  return DAILY_NOTES[Math.floor(rng() * DAILY_NOTES.length)];
}

function ownedOk(x: { kit?: KitItem[] }, owned?: string[]): boolean {
  if (!owned) return true;
  return (x.kit || []).every((k) => owned.includes(k.name));
}

function gameFields(g: Game, rng: () => number): GameFields {
  return {
    title: g.title,
    detail: g.detail,
    arousal: g.arousal,
    category: g.category,
    gameId: g.id,
    minutes: g.minutes,
    equipment: g.kit.map((k) => k.name),
    variation: g.variations.length ? g.variations[Math.floor(rng() * g.variations.length)] : undefined
  };
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
 * space-needing games out of small gaps, never an activity already used today).
 * -------------------------------------------------------------------------- */
function weightedGame(
  rng: () => number,
  usedIds: string[],
  forbidHigh: boolean,
  maxGapMin: number,
  eligible: Game[]
): Game {
  const base = eligible && eligible.length ? eligible : GAME_CATALOG;
  const pool = base.filter((g) => {
    if (forbidHigh && g.arousal === 'high') return false;
    if (g.needsSpace && maxGapMin < 40) return false;
    if (usedIds.includes(g.id)) return false;
    return true;
  });
  // Fallbacks if the day has run out of unused options.
  const cands = pool.length
    ? pool
    : base.filter((g) => !(forbidHigh && g.arousal === 'high')).length
      ? base.filter((g) => !(forbidHigh && g.arousal === 'high'))
      : base;
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
 * swapGame — pick a fresh activity for one slot (per-item reshuffle).
 * -------------------------------------------------------------------------- */
export function swapGame(opts: { seed: string; owned?: string[]; excludeIds: string[] }): GameFields {
  const rng = mulberry32(hashStr(opts.seed));
  const eligible = GAME_CATALOG.filter((g) => ownedOk(g, opts.owned));
  const g = weightedGame(rng, opts.excludeIds, false, 999, eligible);
  return gameFields(g, rng);
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

  // Blocked intervals: commitments + each walk's real window (a short prep
  // buffer before, the walk itself, and a wind-down after).
  const WALK_PRE = 10;
  const WALK_POST = 30;
  const blocks: number[][] = [];
  for (const e of events) {
    if (e && e.start && e.end) blocks.push([toMin(e.start), toMin(e.end)]);
  }
  const walkPoints = walks
    .filter((w) => w && w.time)
    .map((w) => ({ min: toMin(w.time), minutes: w.minutes && w.minutes > 0 ? w.minutes : 30 }))
    .filter((w) => w.min >= startM - 1 && w.min <= endM + 1)
    .sort((a, b) => a.min - b.min);
  for (const w of walkPoints) blocks.push([w.min - WALK_PRE, w.min + w.minutes + WALK_POST]);
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

  // Build slot items in time order; track used ids for the no-repeat guarantee.
  const items: WorkItem[] = [];
  const used: string[] = [];
  let lastHigh = false;
  slots.forEach((tt, i) => {
    const sp = special[i];
    if (sp && sp.type === 'treat') {
      items.push({ time: toHHMM(tt), _min: tt, type: 'treat', title: sp.data.title, detail: sp.data.detail, treatKind: sp.data.kind, treatId: sp.data.id });
    } else if (sp && sp.type === 'care') {
      items.push({ time: toHHMM(tt), _min: tt, type: 'care', title: sp.data.title, detail: sp.data.detail, careId: sp.data.id });
    } else {
      const next = slots[i + 1] != null ? slots[i + 1] : endM;
      const g = weightedGame(rng, used, lastHigh, next - tt, eligible);
      items.push({ time: toHHMM(tt), _min: tt, type: 'game', ...gameFields(g, rng) });
      used.push(g.id);
      lastHigh = g.arousal === 'high';
    }
  });

  // Walks (3 tasks each).
  for (const w of walkPoints) {
    const pool = [...WALK_TASKS];
    const picks: string[] = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      picks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
    items.push({ time: toHHMM(w.min), _min: w.min, type: 'walk', title: rng() > 0.5 ? 'Sniffari walk' : 'Engagement walk', detail: 'Loose lead, lots of sniffing — let the nose do the work.', tasks: picks, minutes: w.minutes });
  }

  items.sort((a, b) => a._min - b._min);

  // Settle if the day finished on a high (games only) — prefer an unused calm one.
  const last = items[items.length - 1];
  if (last && last.type === 'game' && last.arousal === 'high') {
    const usedSet = new Set(used);
    const settle =
      eligible.find((g) => g.id === 'lickmat' && !usedSet.has(g.id)) ||
      eligible.find((g) => g.arousal === 'low' && !usedSet.has(g.id)) ||
      eligible.find((g) => g.id === 'lickmat') ||
      eligible.find((g) => g.arousal === 'low') ||
      eligible.find((g) => g.arousal !== 'high');
    if (settle) {
      const settleRng = mulberry32(hashStr(String(date) + '|settle'));
      const t = Math.min(last._min + 30, endM - 5);
      items.push({ time: toHHMM(t), _min: t, type: 'game', ...gameFields(settle, settleRng) });
      used.push(settle.id);
    }
  }

  // Never two high games back-to-back — replace the second with an unused game.
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    if (a.type === 'game' && b.type === 'game' && a.arousal === 'high' && b.arousal === 'high') {
      const altRng = mulberry32(hashStr(b.gameId + i));
      const alt = weightedGame(altRng, used, true, 999, eligible);
      Object.assign(b, gameFields(alt, altRng));
      used.push(alt.id);
    }
  }

  return items.map(({ _min, ...rest }) => rest);
}
