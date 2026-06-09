/* Training goals — each an ordered progression that builds difficulty. The active
   goal's current step gets woven into the day's plan. Content is name-agnostic
   ({dog} token), substituted in the service layer. */

import { KitItem } from './engagement-engine';

export interface GoalStep {
  title: string;
  detail: string;
  minutes: number;
  kit: KitItem[];
  done: string; // "you've got it when…"
}

export interface GoalDef {
  id: string;
  title: string;
  why: string;
  steps: GoalStep[];
}

/** A goal resolved to its current position, for the UI and the plan weave. */
export interface GoalProgress {
  goalId: string;
  title: string;
  why: string;
  stepIndex: number;
  total: number;
  step: GoalStep;
  complete: boolean;
}

const POUCH: KitItem = { name: 'Treat pouch', essential: true, why: 'Fast, fumble-free rewards keep the game flowing.' };
const LINE: KitItem = { name: 'Long training line', essential: true, why: 'Safe distance recall reps before you trust it off-lead.' };
const MAT: KitItem = { name: 'Settle mat', essential: false, why: 'A portable “off switch” spot the dog learns to relax on anywhere.' };

export const GOALS: GoalDef[] = [
  {
    id: 'recall',
    title: 'Reliable recall',
    why: 'A dog that comes back every time is a dog that gets more freedom.',
    steps: [
      { title: 'Charge the name', minutes: 4, kit: [POUCH], detail: 'Say {dog}’s name, mark the look, reward — ten happy reps, no commands.', done: 'A snappy head-turn every time the name is said.' },
      { title: 'Recall across the room', minutes: 5, kit: [POUCH], detail: 'Call once from a few steps away and throw a party on arrival.', done: 'Comes in fast and close, indoors, every time.' },
      { title: 'Run-away recall', minutes: 5, kit: [POUCH], detail: 'Jog away as you call — the movement triggers the chase. Big reward on the catch-up.', done: 'Chases you in keenly the moment you move.' },
      { title: 'Recall ping-pong', minutes: 6, kit: [POUCH], detail: 'Two people, opposite ends, take turns calling and rewarding.', done: 'Turns on a dime between two callers.' },
      { title: 'Long-line in the garden', minutes: 10, kit: [LINE], detail: 'Let the line out, call off a sniff, party on arrival.', done: 'Leaves a sniff to come back, on a loose line.' },
      { title: 'Recall off a mild distraction', minutes: 8, kit: [LINE], detail: 'Call away from a low-level distraction (a smell, a person far off), reward hugely.', done: 'Comes away from small temptations reliably.' }
    ]
  },
  {
    id: 'loose-lead',
    title: 'Calm on the lead',
    why: 'A loose lead makes every walk nicer for both ends of it.',
    steps: [
      { title: 'Reward the check-in', minutes: 5, kit: [POUCH], detail: 'Indoors, reward {dog} for any glance up at you. Attention is the foundation.', done: 'Offers you eye contact freely.' },
      { title: 'Loose-lead laps', minutes: 8, kit: [POUCH], detail: 'Walk slow laps of the garden, rewarding a soft lead.', done: 'A few laps with no tension on the lead.' },
      { title: 'Stop when it tightens', minutes: 8, kit: [POUCH], detail: 'On a quiet path, stop dead the instant the lead goes tight; move on when it softens.', done: 'Eases off the lead to keep moving.' },
      { title: 'Surprise direction changes', minutes: 8, kit: [POUCH], detail: 'Change direction without warning — it keeps {dog}’s attention on you.', done: 'Tracks your turns and stays with you.' },
      { title: 'Pass a calm distraction', minutes: 8, kit: [POUCH], detail: 'Walk past a mild distraction at a distance, rewarding a loose lead the whole way.', done: 'Holds a loose lead past small distractions.' },
      { title: 'Sniffari on a loose lead', minutes: 10, kit: [], detail: 'Let {dog} lead a sniffy stroll — but the lead stays loose the whole time.', done: 'Sniffs happily without pulling.' }
    ]
  },
  {
    id: 'settle',
    title: 'A real off-switch',
    why: 'A dog that can switch off is calmer, happier, and easier to live with.',
    steps: [
      { title: 'Four calm seconds', minutes: 5, kit: [MAT], detail: 'Reward {dog} for four calm seconds on the mat. That’s the whole job.', done: 'Settles on the mat for a few seconds on cue.' },
      { title: 'Build to thirty seconds', minutes: 6, kit: [MAT], detail: 'Drop occasional treats for staying down, stretching the time slowly.', done: 'Holds a relaxed down for ~30 seconds.' },
      { title: 'Settle while you move', minutes: 6, kit: [MAT], detail: 'Take a step away and back; reward {dog} for staying settled.', done: 'Stays put as you move around the room.' },
      { title: 'Settle with a chew', minutes: 12, kit: [], detail: 'A chew on the mat turns settling into something {dog} chooses to do.', done: 'Relaxes with a chew and drifts toward a nap.' },
      { title: 'Settle in a new room', minutes: 8, kit: [MAT], detail: 'Move the mat somewhere new and rebuild a calm down.', done: 'Settles on the mat anywhere in the house.' },
      { title: 'Settle through a little bustle', minutes: 8, kit: [MAT], detail: 'Practise a settle while normal life happens nearby.', done: 'Stays relaxed while the household moves around.' }
    ]
  },
  {
    id: 'confidence',
    title: 'Confidence with the world',
    why: 'A confident dog copes with novelty instead of fearing it.',
    steps: [
      { title: 'A new object at home', minutes: 5, kit: [POUCH], detail: 'Put something novel on the floor; reward any brave investigation, no pressure.', done: 'Approaches a new object willingly.' },
      { title: 'New surfaces', minutes: 6, kit: [POUCH], detail: 'Let {dog} choose to step on a new texture (a mat, gravel), rewarding each try.', done: 'Walks across an unfamiliar surface calmly.' },
      { title: 'Watch the world go by', minutes: 8, kit: [POUCH], detail: 'Sit somewhere quiet and let {dog} observe; reward calm watching.', done: 'Watches the world without worrying.' },
      { title: 'Calm near a mild noise', minutes: 6, kit: [POUCH], detail: 'At a distance from a low-level noise, reward calm; never force closer.', done: 'Stays relaxed near everyday sounds.' },
      { title: 'Meet a calm helper', minutes: 8, kit: [POUCH], detail: 'A calm person ignores {dog} and lets them choose to say hello; reward bravery.', done: 'Greets a calm stranger on their own terms.' },
      { title: 'A new place, short and sweet', minutes: 10, kit: [POUCH], detail: 'Visit somewhere new for just a few happy minutes, then leave on a high.', done: 'Explores a new place with a loose, waggy body.' }
    ]
  }
];

export function resolveGoals(active: Record<string, number>): GoalProgress[] {
  const out: GoalProgress[] = [];
  for (const def of GOALS) {
    if (!(def.id in active)) continue;
    const total = def.steps.length;
    const stepIndex = Math.max(0, Math.min(active[def.id], total - 1));
    const complete = active[def.id] >= total;
    out.push({ goalId: def.id, title: def.title, why: def.why, stepIndex, total, step: def.steps[stepIndex], complete });
  }
  return out;
}
