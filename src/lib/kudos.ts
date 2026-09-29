export const KUDOS = ['🔥', '👏', '💪', '🌱'] as const;
export type KudoEmoji = (typeof KUDOS)[number];
export type Kudo = { from: string; emoji: KudoEmoji };

/** { '🔥': 2, '👏': 1 } in the fixed KUDOS order, skipping zeros. */
export function tally(list: Kudo[]): [KudoEmoji, number][] {
  return KUDOS.map((e) => [e, list.filter((k) => k.emoji === e).length] as [KudoEmoji, number]).filter(([, n]) => n > 0);
}
