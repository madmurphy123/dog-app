/* =============================================================================
 * Kenny Engagement Engine
 * -----------------------------------------------------------------------------
 * Framework-agnostic. Pure functions only — no DOM, no Angular, no globals.
 * Drop straight into an Angular service: rename to engine.ts, add the type
 * annotations that are written here as JSDoc, and export the same functions.
 *
 * The whole point: take the human's real calendar for the day, find the gaps,
 * and inject DELIBERATELY UNPREDICTABLE engagement into them — game type and
 * timing both randomised within free slots, but weighted to what the dog
 * actually needs and guard-railed so we never stack two high-arousal things.
 * ===========================================================================*/

/* ----------------------------------------------------------------------------
 * GAME CATALOG
 * Own your data. No external API dependency. Tune freely to the dog.
 *
 * arousal:    'high' | 'med' | 'low'  — drives anti-stacking + wind-down logic
 * category:   used for needs-weighting (nosework intentionally over-weighted)
 * minutes:    rough duration so we can fit it into a slot
 * needsSpace: true => better outdoors / garden (kept out of tiny indoor gaps)
 * -------------------------------------------------------------------------- */
const GAME_CATALOG = [
  // --- Nosework / foraging (HIGH WEIGHT — Kenny's biggest need) ---
  { id: 'scatter',    name: 'Scatter feed',         category: 'nosework',   arousal: 'low',  minutes: 10, needsSpace: false,
    how: 'Scatter part of his meal across grass or a snuffle mat. Turns 30s of eating into 10 mins of foraging.',
    kit: [{item:'Snuffle mat',essential:false,why:'turns scatter-feeding into a long forage indoors'}] },
  { id: 'findit',     name: '"Find it" search',     category: 'nosework',   arousal: 'low',  minutes: 8,  needsSpace: false,
    how: 'Hide 5–8 treats around the room while he waits, then release with "find it". Build up to hiding in another room.',
    kit: [] },
  { id: 'muffin',     name: 'Muffin-tin puzzle',    category: 'nosework',   arousal: 'low',  minutes: 10, needsSpace: false,
    how: 'Treats in muffin-tin cups, tennis balls over the top. Let him work them out.',
    kit: [{item:'Muffin / cupcake tin',essential:true,why:'the puzzle base'},{item:'Tennis balls (3-6)',essential:true,why:'covers for the muffin cups'}] },
  { id: 'towel',      name: 'Towel roll-up',        category: 'nosework',   arousal: 'low',  minutes: 8,  needsSpace: false,
    how: 'Roll treats inside a towel and let him unravel it. Cheap, brilliant for a problem-solver.',
    kit: [{item:'Old hand towels (2-3)',essential:false,why:'roll treats inside to unpick'}] },
  { id: 'boxsearch',  name: 'Box search',           category: 'nosework',   arousal: 'low',  minutes: 10, needsSpace: false,
    how: 'Scatter a few open boxes/containers, bait one or two, let him search them out.',
    kit: [{item:'Cardboard boxes / tubs',essential:false,why:'free - save delivery boxes'}] },

  // --- Engagement / "be interesting" (rebuilds YOU as the good thing) ---
  { id: 'runaway',    name: 'Run-away recall',      category: 'engagement', arousal: 'high', minutes: 4,  needsSpace: false,
    how: 'When he is near but unfocused, jog away playfully. Movement away triggers chase. Big reward on the catch-up.',
    kit: [{item:'Treat pouch (belt-clip)',essential:true,why:'so rewards are always on you - used by almost every game'}] },
  { id: 'hideseek',   name: 'Hide & seek',          category: 'engagement', arousal: 'med',  minutes: 5,  needsSpace: false,
    how: 'Duck behind a door while he is distracted. He learns to keep tabs on you. Party when he finds you.',
    kit: [] },
  { id: 'slot',       name: 'Slot-machine sits',    category: 'engagement', arousal: 'low',  minutes: 4,  needsSpace: false,
    how: 'Reward known cues with UNPREDICTABLE payouts: 1 treat, then 5, then a thrown treat, then cheese. You become a slot machine.',
    kit: [{item:'High-value treats (cheese / hot dog / liver)',essential:true,why:'the variable jackpot that makes you a slot machine'}] },
  { id: 'handfeed',   name: 'Hand-fed check-ins',   category: 'engagement', arousal: 'low',  minutes: 5,  needsSpace: false,
    how: 'Feed part of a meal piece-by-piece for eye contact / a nose touch / a recall. You = source of all good things.',
    kit: [] },

  // --- Play (rebuild toy drive — short, prey-like, end while keen) ---
  { id: 'tug',        name: 'Prey-style tug',       category: 'play',       arousal: 'high', minutes: 4,  needsSpace: false,
    how: 'Move the toy low and AWAY like fleeing prey. Let him win sometimes. Stop while his tail is still going.',
    kit: [{item:'Long tug toy (bungee or fleece)',essential:true,why:'lets you move it like fleeing prey and tug safely'}] },
  { id: 'fetchgarden',name: 'Garden fetch',         category: 'play',       arousal: 'high', minutes: 6,  needsSpace: true,
    how: 'Fetch on NON-grassy ground only (patio/hard standing) until grazing is managed. Short, keen, end early.',
    kit: [{item:'2-3 balls / fetch toys',essential:false,why:'rotate so they stay novel'}] },
  { id: 'flirt',      name: 'Flirt pole',           category: 'play',       arousal: 'high', minutes: 5,  needsSpace: true,
    how: 'Drag a toy on a rope along the ground in arcs. Brilliant chase outlet. Let him catch and win.',
    kit: [{item:'Flirt pole',essential:true,why:'pole + rope + lure for the chase game'}] },

  // --- Training (short skill bursts) ---
  { id: 'leaveit',    name: '"Leave it" reps',      category: 'training',   arousal: 'low',  minutes: 5,  needsSpace: false,
    how: 'Builds the tool you need for the grass. Reward leaving food on the floor, then build difficulty.',
    kit: [] },
  { id: 'settle',     name: 'Settle on a mat',      category: 'training',   arousal: 'low',  minutes: 6,  needsSpace: false,
    how: 'Reward calm on a mat. A real off-switch beats him defaulting to the crate out of boredom.',
    kit: [{item:'Settle mat / non-slip mat',essential:true,why:'a defined off-switch spot'}] },
  { id: 'tricks',     name: 'New trick shaping',    category: 'training',   arousal: 'med',  minutes: 6,  needsSpace: false,
    how: 'Shape something novel (spin, bow, paw target). Novelty = engagement. Keep it short and win-heavy.',
    kit: [{item:'Clicker',essential:false,why:'sharpens shaping; optional but helps'},{item:'Target stick',essential:false,why:'for nose-target tricks'}] },
];

/* Needs-weighting: how strongly to favour each category when rolling a game.
 * Nosework deliberately heaviest (foraging outlet redirects the grazing).   */
const CATEGORY_WEIGHTS = { nosework: 4, engagement: 3, play: 2, training: 2 };

/* Walk tasks — the 3 randomised things handed to you when a walk comes up.   */
const WALK_TASKS = [
  'Sniffari: 5+ minutes of loose-lead, he chooses the direction and reads the world.',
  '3 surprise direction-changes — no warning, no word. Keeps his eyes on you.',
  '1 run-away recall when he drifts — jog off, reward the chase-back.',
  'Long-line freedom on non-grassy open ground if you have it.',
  'Reactivity rep: the instant he NOTICES a dog (before fixating), mark + feed.',
  'Pick a different route than yesterday — novelty resets attention.',
  '"Leave it" practice past one tempting bush instead of letting him graze.',
  'Scatter a small handful of treats in safe grass for a legitimate forage.',
  'Two slot-machine check-ins: reward a glance at you with a random payout.',
  'End the walk on a short game so coming home is not the only "fun off" signal.',
];

/* ----------------------------------------------------------------------------
 * Seeded RNG — same day => same plan (so a refresh doesn't reshuffle), but
 * every new day feels different. Mulberry32: tiny, deterministic, good enough.
 * -------------------------------------------------------------------------- */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromDate(dateStr) {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i); h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ----------------------------------------------------------------------------
 * Time helpers — everything internal is "minutes since midnight".
 * -------------------------------------------------------------------------- */
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (mins) => {
  const h = Math.floor(mins / 60) % 24, m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/* ----------------------------------------------------------------------------
 * findFreeSlots — given busy calendar blocks within the dog's "active window",
 * return the gaps big enough to do something in.
 *
 * @param {Array<{start:string,end:string,label:string}>} events
 * @param {string} dayStart e.g. '07:30'
 * @param {string} dayEnd   e.g. '22:00'
 * @param {number} minGap   minimum usable gap in minutes
 * @returns {Array<{start:number,end:number}>}
 * -------------------------------------------------------------------------- */
function findFreeSlots(events, dayStart, dayEnd, minGap = 12) {
  const busy = events
    .map(e => ({ start: toMin(e.start), end: toMin(e.end) }))
    .filter(b => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  // Merge overlaps so we don't schedule into a "gap" that isn't real.
  const merged = [];
  for (const b of busy) {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else merged.push({ ...b });
  }

  const slots = [];
  let cursor = toMin(dayStart);
  const end = toMin(dayEnd);
  for (const b of merged) {
    if (b.start - cursor >= minGap) slots.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (end - cursor >= minGap) slots.push({ start: cursor, end });
  return slots;
}

/* ----------------------------------------------------------------------------
 * weightedPick — choose a game, weighted by category, honouring guard-rails:
 *   - avoidArousal: don't return a 'high' game (anti-stacking / wind-down)
 *   - needsSpaceOk:  whether outdoor/space-needing games are allowed here
 *   - exclude:       ids already used today (variety)
 * Falls back gracefully if filters exclude everything.
 * -------------------------------------------------------------------------- */
function weightedPick(rng, { avoidHigh = false, needsSpaceOk = true, exclude = [] } = {}) {
  let pool = GAME_CATALOG.filter(g =>
    !exclude.includes(g.id) &&
    (needsSpaceOk || !g.needsSpace) &&
    (!avoidHigh || g.arousal !== 'high')
  );
  if (pool.length === 0) pool = GAME_CATALOG.filter(g => (!avoidHigh || g.arousal !== 'high'));
  if (pool.length === 0) pool = GAME_CATALOG.slice();

  const weighted = [];
  for (const g of pool) {
    const w = CATEGORY_WEIGHTS[g.category] || 1;
    for (let i = 0; i < w; i++) weighted.push(g);
  }
  return weighted[Math.floor(rng() * weighted.length)];
}

/* ----------------------------------------------------------------------------
 * pickWalkTasks — 3 distinct randomised tasks for a given walk.
 * -------------------------------------------------------------------------- */
function pickWalkTasks(rng, n = 3) {
  const pool = WALK_TASKS.slice();
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/* ----------------------------------------------------------------------------
 * buildDogDay — THE MAIN ENTRY POINT.
 *
 * @param {Object} cfg
 * @param {string} cfg.date        'YYYY-MM-DD' (seeds the day's randomness)
 * @param {Array}  cfg.events      [{start,end,label}]  the human's commitments
 * @param {Array}  cfg.walks       ['08:00','17:30']    fixed walk start times
 * @param {string} [cfg.dayStart]  default '07:30'
 * @param {string} [cfg.dayEnd]    default '22:00'
 * @param {number} [cfg.intensity] games-per-free-hour pressure, default ~0.9
 * @returns {Array} timeline items: {time, type, title, detail, arousal?, tasks?}
 * -------------------------------------------------------------------------- */
function buildDogDay(cfg) {
  const {
    date, events = [], walks = [],
    dayStart = '07:30', dayEnd = '22:00', intensity = 0.9,
  } = cfg;

  const rng = makeRng(seedFromDate(date));
  const timeline = [];

  // 1) Walks are fixed points; attach 3 randomised tasks to each.
  for (const w of walks) {
    timeline.push({
      time: toMin(w), type: 'walk', title: 'Walk',
      detail: 'Loose lead + engagement, not just management.',
      tasks: pickWalkTasks(rng, 3),
    });
  }

  // 2) Treat walks (with ~45 min buffer) as busy so we don't pile games on top.
  const walkBusy = walks.map(w => ({ start: w, end: toHHMM(toMin(w) + 45), label: 'Walk' }));
  const slots = findFreeSlots([...events, ...walkBusy], dayStart, dayEnd, 12);

  // 3) Drop games into free slots at RANDOM offsets, spaced, guard-railed.
  const usedToday = [];
  let lastArousal = null;

  for (const slot of slots) {
    const span = slot.end - slot.start;
    const count = Math.max(1, Math.round((span / 60) * intensity));

    // Random, sorted, spaced offsets inside the slot (>=25 min apart).
    const offsets = [];
    let guard = 0;
    while (offsets.length < count && guard++ < 50) {
      const o = slot.start + Math.floor(rng() * Math.max(1, span - 8));
      if (offsets.every(x => Math.abs(x - o) >= 25)) offsets.push(o);
    }
    offsets.sort((a, b) => a - b);

    const shortSlot = span < 20; // tiny gap => indoor, no space-needing games

    for (const at of offsets) {
      const game = weightedPick(rng, {
        avoidHigh: lastArousal === 'high',      // never stack two highs
        needsSpaceOk: !shortSlot,
        exclude: usedToday.slice(-4),            // recent-variety window
      });
      timeline.push({
        time: at, type: 'game', title: game.name, detail: game.how,
        arousal: game.arousal, category: game.category, gameId: game.id,
      });
      usedToday.push(game.id);
      lastArousal = game.arousal;
    }
  }

  // 4) Wind-down: a calm settle near the end if the day finished hot.
  if (lastArousal === 'high') {
    timeline.push({
      time: toMin(dayEnd) - 20, type: 'game', title: 'Settle on a mat',
      detail: 'Calm off-switch to close the day after high-energy play.',
      arousal: 'low', category: 'training', gameId: 'settle',
    });
  }

  timeline.sort((a, b) => a.time - b.time);
  return timeline.map(item => ({ ...item, time: toHHMM(item.time) }));
}

/* ----------------------------------------------------------------------------
 * buildShoppingList — roll up the kit from every game into a deduplicated list,
 * tagged with which games each item unlocks. Essentials float to the top.
 * A few cross-cutting staples are seeded in regardless of catalog.
 * @returns {Array<{item, essential, why, unlocks:string[]}>}
 * -------------------------------------------------------------------------- */
function buildShoppingList() {
  const map = new Map();

  // Cross-cutting staples that power lots of games / the whole approach.
  const staples = [
    { item: 'Treat pouch (belt-clip)', essential: true,
      why: 'Rewards always on you — the backbone of becoming the interesting one.' },
    { item: 'High-value treats (cheese / hot dog / liver)', essential: true,
      why: 'The variable "jackpot" for slot-machine rewards and reactivity work.' },
    { item: 'Long line (5–10m, clips to harness)', essential: true,
      why: 'Safe off-lead-feeling freedom on non-grassy open ground.' },
    { item: 'Y-front harness with front clip', essential: true,
      why: 'Control for reactivity work without a slip lead choking arousal up.' },
  ];
  for (const s of staples) map.set(s.item, { ...s, unlocks: [] });

  for (const g of GAME_CATALOG) {
    for (const k of (g.kit || [])) {
      const existing = map.get(k.item);
      if (existing) {
        existing.unlocks.push(g.name);
        existing.essential = existing.essential || k.essential;
      } else {
        map.set(k.item, { item: k.item, essential: k.essential, why: k.why, unlocks: [g.name] });
      }
    }
  }

  return [...map.values()].sort((a, b) =>
    (b.essential - a.essential) || b.unlocks.length - a.unlocks.length
  );
}

/* Export for both browser (window) and Node/Angular (module). */
const KennyEngine = { buildDogDay, findFreeSlots, buildShoppingList, GAME_CATALOG, WALK_TASKS, toHHMM, toMin };
if (typeof module !== 'undefined' && module.exports) module.exports = KennyEngine;
if (typeof window !== 'undefined') window.KennyEngine = KennyEngine;
