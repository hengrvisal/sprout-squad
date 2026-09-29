/**
 * The evening "what did you get done?" reminder (pure, tested).
 * Scheduled on the phone as one-off notifications for the next few evenings, so tonight's
 * can be skipped once you've logged something. Re-planned whenever the app opens or you log.
 */
export const REMINDER_HOURS = [19, 20, 21, 22] as const;
export type ReminderSettings = { enabled: boolean; hour: number };
export const DEFAULT_REMINDER: ReminderSettings = { enabled: true, hour: 20 };

/** The next `days` evenings at `hour`, skipping tonight if it's passed or you've already logged. */
export function eveningSlots(now: Date, loggedToday: boolean, hour: number, days = 7): Date[] {
  const out: Date[] = [];
  for (let i = 0; out.length < days && i <= days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, 0, 0, 0);
    if (i === 0 && (loggedToday || d <= now)) continue;
    out.push(d);
  }
  return out;
}

export const hourLabel = (h: number) => `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`;
