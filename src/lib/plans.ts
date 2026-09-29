/** Daily plans ("today I'm going to…") and kudo notes: limits and text clean-up (pure, tested). */

export const MAX_PLANS = 3;
export const PLAN_MAX_LEN = 90;
export const NOTE_MAX_LEN = 80;

export type Plan = { id: string; text: string; entry_id: string | null };

/** Trim, collapse inner whitespace and cap the length. Empty string means "nothing to save". */
export function cleanText(s: string, max: number): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, max).trim();
}

export function planProgress(plans: Pick<Plan, 'entry_id'>[]): { done: number; total: number } {
  return { done: plans.filter((p) => !!p.entry_id).length, total: plans.length };
}

/** Plans in the order they were made, unfinished first. */
export function sortPlans<T extends Pick<Plan, 'entry_id'>>(plans: T[]): T[] {
  return [...plans.filter((p) => !p.entry_id), ...plans.filter((p) => !!p.entry_id)];
}
