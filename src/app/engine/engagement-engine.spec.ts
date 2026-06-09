import {
  buildDogDay,
  buildShoppingList,
  toMin,
  GAME_CATALOG,
  CARE_TASKS,
  TREATS,
  BuildDayConfig,
  TimelineItem,
  GameItem,
  Game,
  KitGroup
} from './engagement-engine';

const WALK_BUFFER = 45;

function baseConfig(date: string): BuildDayConfig {
  return {
    date,
    dayStart: '08:00',
    dayEnd: '21:00',
    events: [{ start: '12:00', end: '13:00', label: 'Lunch' }],
    walks: ['09:00', '17:00']
  };
}

// A spread of dates so guarantee checks see varied, realistic plans.
const DATES = Array.from({ length: 30 }, (_, i) => `2026-06-${String(i + 1).padStart(2, '0')}`);

function games(plan: TimelineItem[]): GameItem[] {
  return plan.filter((i): i is GameItem => i.type === 'game');
}

function kitFor(gameId: string): Game | undefined {
  return GAME_CATALOG.find((g) => g.id === gameId);
}

describe('engagement-engine', () => {
  describe('buildDogDay — determinism', () => {
    it('produces an identical plan for the same date and inputs', () => {
      const a = buildDogDay(baseConfig('2026-06-08'));
      const b = buildDogDay(baseConfig('2026-06-08'));

      expect(b).toEqual(a);
    });

    it('produces a different plan for a different date', () => {
      const a = buildDogDay(baseConfig('2026-06-08'));
      const b = buildDogDay(baseConfig('2026-06-09'));

      expect(JSON.stringify(b)).not.toEqual(JSON.stringify(a));
    });

    it('returns entries sorted by time', () => {
      const plan = buildDogDay(baseConfig('2026-06-08'));
      const mins = plan.map((i) => toMin(i.time));
      const sorted = [...mins].sort((x, y) => x - y);

      expect(mins).toEqual(sorted);
    });
  });

  describe('buildDogDay — behavioural guardrails', () => {
    it('never schedules two high-arousal games back to back', () => {
      for (const date of DATES) {
        const plan = buildDogDay(baseConfig(date));
        for (let i = 1; i < plan.length; i++) {
          const prev = plan[i - 1];
          const cur = plan[i];
          const bothHighGames =
            prev.type === 'game' && cur.type === 'game' && prev.arousal === 'high' && cur.arousal === 'high';

          expect(bothHighGames).toBe(false);
        }
      }
    });

    it('never places a game inside a commitment window or the post-walk buffer', () => {
      for (const date of DATES) {
        const cfg = baseConfig(date);
        const plan = buildDogDay(cfg);
        const eventBlocks = (cfg.events ?? []).map((e) => [toMin(e.start), toMin(e.end)] as const);
        const walkBlocks = (cfg.walks ?? []).map((w) => [toMin(w) - WALK_BUFFER, toMin(w) + WALK_BUFFER] as const);

        for (const g of games(plan)) {
          const at = toMin(g.time);
          for (const [s, e] of eventBlocks) {
            expect(at >= s && at < e).toBe(false);
          }
          for (const [s, e] of walkBlocks) {
            expect(at > s && at < e).toBe(false);
          }
        }
      }
    });

    it('keeps every entry within the awake window', () => {
      const cfg = baseConfig('2026-06-08');
      const plan = buildDogDay(cfg);
      const start = toMin(cfg.dayStart ?? '08:00');
      const end = toMin(cfg.dayEnd ?? '21:00');

      for (const item of plan) {
        const at = toMin(item.time);
        expect(at).toBeGreaterThanOrEqual(start);
        expect(at).toBeLessThanOrEqual(end);
      }
    });
  });

  describe('buildDogDay — kit ownership gating', () => {
    it('excludes games whose kit is not owned', () => {
      const owned = ['Treat pouch'];
      for (const date of DATES) {
        const plan = buildDogDay({ ...baseConfig(date), owned });
        for (const g of games(plan)) {
          const def = kitFor(g.gameId);
          expect(def).toBeDefined();
          const kitNames = (def?.kit ?? []).map((k) => k.name);
          const allOwned = kitNames.every((name) => owned.includes(name));

          expect(allOwned).toBe(true);
        }
      }
    });

    it('treats everything as available when owned is undefined', () => {
      const plan = buildDogDay(baseConfig('2026-06-08'));

      // A plan with no ownership filter should still be buildable and non-empty.
      expect(plan.length).toBeGreaterThan(0);
    });
  });

  describe('buildDogDay — treats toggle', () => {
    it('omits treat entries when treats are disabled', () => {
      const dateWithTreat = DATES.find((d) => buildDogDay(baseConfig(d)).some((i) => i.type === 'treat'));

      expect(dateWithTreat).toBeDefined();
      if (dateWithTreat) {
        const off = buildDogDay({ ...baseConfig(dateWithTreat), treats: false });
        expect(off.some((i) => i.type === 'treat')).toBe(false);
      }
    });
  });

  describe('buildShoppingList', () => {
    it('orders groups Enrichment → Treats & food → Hygiene', () => {
      const list = buildShoppingList();
      const rank: Record<KitGroup, number> = { 'Enrichment': 0, 'Treats & food': 1, 'Hygiene': 2 };
      const ranks = list.map((i) => rank[i.group]);
      const sorted = [...ranks].sort((a, b) => a - b);

      expect(ranks).toEqual(sorted);
    });

    it('lists essentials before non-essentials within each group', () => {
      const list = buildShoppingList();
      const groups: KitGroup[] = ['Enrichment', 'Treats & food', 'Hygiene'];

      for (const group of groups) {
        const inGroup = list.filter((i) => i.group === group);
        const firstNonEssential = inGroup.findIndex((i) => !i.essential);
        if (firstNonEssential === -1) continue;
        const anyEssentialAfter = inGroup.slice(firstNonEssential).some((i) => i.essential);

        expect(anyEssentialAfter).toBe(false);
      }
    });

    it('dedupes shared kit and tags it with every entry it unlocks', () => {
      const list = buildShoppingList();
      const pouch = list.filter((i) => i.name === 'Treat pouch');

      expect(pouch.length).toBe(1);
      // Treat pouch is shared by find-it, recall-pingpong and trick-spin.
      expect(pouch[0].unlocks.length).toBeGreaterThanOrEqual(3);
    });

    it('surfaces kit from games, treats and care', () => {
      const list = buildShoppingList();
      const names = new Set(list.map((i) => i.name));

      const gameKit = GAME_CATALOG.flatMap((g) => g.kit.map((k) => k.name));
      const treatKit = TREATS.flatMap((t) => t.kit.map((k) => k.name));
      const careKit = CARE_TASKS.flatMap((c) => c.kit.map((k) => k.name));

      for (const name of [...gameKit, ...treatKit, ...careKit]) {
        expect(names.has(name)).toBe(true);
      }
    });
  });
});
