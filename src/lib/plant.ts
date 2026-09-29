/** Squad plant: stages, health wording, and the geometry of the drawing (pure, tested). */

export type PlantData = {
  growth: number;
  health: number; // 0–1, share of member-days active over the last 7 days
  drooping: boolean; // nobody logged in the last 3 days
  today: { active: number; members: number; points: number; full: boolean };
  week: { kind: string; label: string; target: number; progress: number; met: boolean; bonus: number };
  members: { id: string; recent_days: number }[];
};

export const STAGES = [
  { name: 'Seed', at: 0 },
  { name: 'Sprout', at: 10 },
  { name: 'Seedling', at: 35 },
  { name: 'Sapling', at: 90 },
  { name: 'Bush', at: 180 },
  { name: 'Flowering', at: 320 },
  { name: 'Fruiting', at: 520 },
] as const;

export function stageFor(growth: number) {
  let i = 0;
  while (i + 1 < STAGES.length && growth >= STAGES[i + 1].at) i++;
  const cur = STAGES[i];
  const next = STAGES[i + 1];
  const progress = next ? Math.min(1, (growth - cur.at) / (next.at - cur.at)) : 1;
  return { index: i, name: cur.name, progress, next: next ? { name: next.name, in: Math.ceil(next.at - growth) } : null };
}

export function healthLabel(health: number, drooping: boolean): { label: string; tone: 'good' | 'ok' | 'low' } {
  if (drooping) return { label: 'Thirsty. One log perks it up', tone: 'low' };
  if (health >= 0.6) return { label: 'Thriving', tone: 'good' };
  if (health >= 0.3) return { label: 'Doing well', tone: 'ok' };
  return { label: 'Could use some water', tone: 'low' };
}

/** Stable member colours, by join order (the plant's leaves are tinted with these). */
export const MEMBER_COLORS = ['#7CC4FF', '#FF6F91', '#FFB443', '#B9A6FF', '#6FE0C8', '#FFE45C', '#FF9D5C', '#9BE15D', '#E58CFF', '#5CC8FF'];

const LEAVES_BY_STAGE = [0, 2, 4, 8, 14, 16, 18];

/**
 * Give each leaf to a member, in proportion to how many days they logged recently.
 * Members with no recent days get no leaves (never shown as a gap, just fewer leaves).
 */
export function assignLeaves(count: number, members: { recent_days: number }[]): number[] {
  const weights = members.map((m) => Math.max(0, m.recent_days));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!count || !total) return Array.from({ length: count }, (_, i) => (members.length ? i % members.length : 0));
  // largest remainder, then interleave so colours are spread along the stem
  const exact = weights.map((w) => (w / total) * count);
  const base = exact.map(Math.floor);
  let left = count - base.reduce((a, b) => a + b, 0);
  exact
    .map((x, i) => [x - Math.floor(x), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        base[i]++;
        left--;
      }
    });
  const out: number[] = [];
  const pool = base.slice();
  while (out.length < count) {
    for (let i = 0; i < pool.length && out.length < count; i++) {
      if (pool[i] > 0) {
        out.push(i);
        pool[i]--;
      }
    }
  }
  return out;
}

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
export function hashString(s: string) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  return h;
}

export type Leaf = { x: number; y: number; angle: number; size: number; member: number };
export type Blossom = { x: number; y: number; kind: 'flower' | 'fruit' };
export type PlantModel = {
  stems: string[]; // SVG path data, main stem first
  leaves: Leaf[];
  blossoms: Blossom[];
  seed: boolean;
};

/**
 * Plant geometry in a 200×220 box. The pot's rim sits at y=170, the stem grows up from (100,170).
 * Height follows the stage plus progress through it, so it visibly creeps up between stages.
 */
export function plantModel(stage: number, progress: number, health: number, drooping: boolean, members: { recent_days: number }[], seedKey = 'squad'): PlantModel {
  const r = rng(hashString(seedKey));
  if (stage === 0) return { stems: [], leaves: [], blossoms: [], seed: true };

  const heights = [0, 34, 60, 88, 104, 112, 116];
  const h = heights[stage] + (stage < 6 ? (heights[stage + 1] - heights[stage]) * progress * 0.8 : 0);
  const baseY = 170;
  const topY = baseY - h;
  const sway = (r() - 0.5) * 16;
  const stems = [`M100 ${baseY} C ${100 + sway} ${baseY - h * 0.45}, ${100 - sway} ${baseY - h * 0.75}, 100 ${topY}`];

  const n = LEAVES_BY_STAGE[stage];
  const owners = assignLeaves(n, members);
  const leaves: Leaf[] = [];
  const blossoms: Blossom[] = [];
  const vigour = 0.78 + 0.32 * Math.min(1, health); // healthier = bigger leaves
  const droop = drooping ? 38 : 0;

  // point on the main stem's cubic at t (0 = base, 1 = top)
  const at = (t: number) => {
    const p0 = [100, baseY], p1 = [100 + sway, baseY - h * 0.45], p2 = [100 - sway, baseY - h * 0.75], p3 = [100, topY];
    const u = 1 - t;
    const x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0];
    const y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1];
    return { x, y };
  };

  if (stage <= 2) {
    // cotyledons at the top, then a pair lower down for seedlings
    const top = at(1);
    leaves.push({ x: top.x, y: top.y, angle: -150 + droop * -0.5 + (r() - 0.5) * 8, size: 0.95 * vigour, member: owners[0] ?? 0 });
    leaves.push({ x: top.x, y: top.y, angle: -30 + droop * 0.5 + (r() - 0.5) * 8, size: 0.9 * vigour, member: owners[1] ?? 0 });
    for (let i = 2; i < n; i++) {
      const p = at(0.55 + (i - 2) * 0.12);
      const side = i % 2 ? 1 : -1;
      leaves.push({ x: p.x, y: p.y, angle: side > 0 ? -25 + droop : -155 - droop, size: 0.7 * vigour, member: owners[i] ?? 0 });
    }
  } else {
    // side branches for bush and up
    const branchCount = stage >= 4 ? 4 : 0;
    const branchTips: { x: number; y: number }[] = [];
    for (let b = 0; b < branchCount; b++) {
      const t = 0.3 + b * 0.16;
      const p = at(t);
      const side = b % 2 ? 1 : -1;
      const len = (34 - b * 4) * (0.9 + r() * 0.2);
      const tip = { x: p.x + side * len, y: p.y - len * 0.7 };
      stems.push(`M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${(p.x + side * len * 0.6).toFixed(1)} ${(p.y - 4).toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`);
      branchTips.push(tip);
    }
    const anchors = [...branchTips, at(1)];
    for (let i = 0; i < n; i++) {
      let x: number, y: number, base: number;
      if (i < anchors.length * 2 && stage >= 4) {
        const a = anchors[Math.floor(i / 2)];
        x = a.x;
        y = a.y;
        base = i % 2 ? -35 : -145;
      } else {
        const t = 0.22 + ((i * 0.618) % 1) * 0.72;
        const p = at(t);
        x = p.x;
        y = p.y;
        base = i % 2 ? -28 : -152;
      }
      const d = base > -90 ? droop : -droop;
      leaves.push({ x, y, angle: base + d + (r() - 0.5) * 14, size: (0.62 + r() * 0.22) * vigour, member: owners[i] ?? 0 });
    }
    if (stage >= 5 && !drooping) {
      anchors.forEach((a, i) => blossoms.push({ x: a.x + (i % 2 ? 4 : -4), y: a.y - 8, kind: stage >= 6 && i % 2 === 0 ? 'fruit' : 'flower' }));
    }
  }
  return { stems, leaves, blossoms, seed: false };
}
