// POST { type: 'kudo' | 'note', to } or { type: 'session', session_id }, with the user's JWT.
// Called by the app straight after the action. We re-check the row exists and was made by
// the caller, so this can't be used to push arbitrary messages to people.
import { adminClient, firstTime, json, pushTo } from '../_shared/push.ts';

type Body = { type: 'kudo' | 'note'; to: string } | { type: 'session'; session_id: string };

const HOURS_36 = 36 * 3600 * 1000;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const admin = adminClient();
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  const me = auth?.user;
  if (!me) return json({ error: 'not_signed_in' }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const { data: profile } = await admin.from('profiles').select('display_name').eq('id', me.id).single();
  const name = profile?.display_name || 'A squadmate';
  const since = new Date(Date.now() - HOURS_36).toISOString();

  if (body.type === 'kudo') {
    const { data } = await admin
      .from('kudos')
      .select('emoji, done_on')
      .eq('from_user', me.id)
      .eq('to_user', body.to)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);
    const k = data?.[0];
    // one push per person per day, however many emoji they tap
    if (!k || !(await firstTime(admin, `kudo:${me.id}:${body.to}:${k.done_on}`))) return json({ sent: 0 });
    const sent = await pushTo(admin, [body.to], 'notify_kudos', { title: `${name} sent you ${k.emoji}`, body: 'Someone noticed. Keep going.', url: '/day' });
    return json({ sent });
  }

  if (body.type === 'note') {
    const { data } = await admin
      .from('kudo_notes')
      .select('note, done_on')
      .eq('from_user', me.id)
      .eq('to_user', body.to)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);
    const n = data?.[0];
    // edits don't re-notify
    if (!n || !(await firstTime(admin, `note:${me.id}:${body.to}:${n.done_on}`))) return json({ sent: 0 });
    const sent = await pushTo(admin, [body.to], 'notify_kudos', { title: `💬 ${name}`, body: n.note, url: '/day' });
    return json({ sent });
  }

  if (body.type === 'session') {
    const { data: s } = await admin
      .from('sessions')
      .select('id, squad_id, host, title, started_at, ends_at')
      .eq('id', body.session_id)
      .single();
    if (!s || s.host !== me.id || new Date(s.ends_at) <= new Date()) return json({ sent: 0 });
    if (!(await firstTime(admin, `session:${s.id}`))) return json({ sent: 0 });
    const { data: members } = await admin.from('squad_members').select('user_id').eq('squad_id', s.squad_id).neq('user_id', me.id);
    const minutes = Math.round((new Date(s.ends_at).getTime() - new Date(s.started_at).getTime()) / 60000);
    const sent = await pushTo(
      admin,
      (members ?? []).map((m: { user_id: string }) => m.user_id),
      'notify_sessions',
      { title: `🌿 ${name} is growing together`, body: `${s.title ? `“${s.title}”, ` : ''}${minutes} min. Tap to join in.`, url: '/session' },
    );
    return json({ sent });
  }

  return json({ error: 'bad_request' }, 400);
});
