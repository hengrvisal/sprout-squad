// Shared by the notify and nudges functions (Deno, runs on Supabase Edge).
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type Pref = 'notify_kudos' | 'notify_nudges' | 'notify_sessions';
export type Message = { title: string; body: string; url: string };

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Record a one-off push; false if it was already sent (so callers skip it). */
export async function firstTime(admin: SupabaseClient, key: string): Promise<boolean> {
  const { error } = await admin.from('push_log').insert({ key });
  return !error; // a duplicate key means we've sent this one before
}

/** Push one message to every device of the given people who have `pref` switched on. */
export async function pushTo(admin: SupabaseClient, userIds: string[], pref: Pref, msg: Message): Promise<number> {
  if (!userIds.length) return 0;
  const { data: people } = await admin.from('profiles').select('id').in('id', userIds).eq(pref, true);
  const ids = (people ?? []).map((p: { id: string }) => p.id);
  if (!ids.length) return 0;
  const { data: rows } = await admin.from('push_tokens').select('token').in('user_id', ids);
  const tokens = (rows ?? []).map((r: { token: string }) => r.token);
  return sendExpo(admin, tokens.map((to) => ({ to, title: msg.title, body: msg.body, data: { url: msg.url }, sound: 'default' })));
}

type ExpoMessage = { to: string; title: string; body: string; data: Record<string, unknown>; sound: 'default' };

/** Expo push API, 100 per request. Tokens Expo says are dead get removed. */
export async function sendExpo(admin: SupabaseClient, messages: ExpoMessage[]): Promise<number> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const access = Deno.env.get('EXPO_ACCESS_TOKEN'); // only needed if "enhanced push security" is on
  if (access) headers.Authorization = `Bearer ${access}`;
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers, body: JSON.stringify(batch) });
    if (!res.ok) continue;
    const { data } = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
    const dead: string[] = [];
    (data ?? []).forEach((ticket, k) => {
      if (ticket.status === 'ok') sent++;
      else if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[k].to);
    });
    if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
  }
  return sent;
}
