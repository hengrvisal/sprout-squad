/** Grow-together sessions: timing and wording (pure, tested). */

export const SESSION_LENGTHS = [25, 50, 90] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];

export type Session = { id: string; squad_id: string; host: string; title: string | null; started_at: string; ends_at: string };
export type SessionMember = { user_id: string; joined_at: string; left_at: string | null; name: string; emoji: string };

export const isLive = (s: Pick<Session, 'ends_at'>, now = Date.now()) => new Date(s.ends_at).getTime() > now;

export function secondsLeft(s: Pick<Session, 'ends_at'>, now = Date.now()): number {
  return Math.max(0, Math.round((new Date(s.ends_at).getTime() - now) / 1000));
}

/** "18 min left", "1 h 10 min left", "Under a minute left" */
export function leftLabel(seconds: number): string {
  if (seconds <= 0) return 'Finished';
  if (seconds < 60) return 'Under a minute left';
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min left` : `${h} h left`;
}

/** "17:42" countdown, or "1:05:00" past an hour. */
export function clock(seconds: number): string {
  const s = Math.max(0, seconds);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** "Mia", "Mia and Jun", "Mia, Jun and 2 more" */
export function namesLabel(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}
