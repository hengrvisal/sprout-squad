// Runs hourly (pg_cron, see docs/NOTIFICATIONS.md). Deploy with --no-verify-jwt; it checks
// its own shared secret instead. At 6pm local time, tells people which squadmates have gone
// quiet for 3+ days, at most once per quiet stretch.
import { adminClient, json, pushTo } from '../_shared/push.ts';

type Candidate = { recipient: string; friend: string; friend_name: string; last_day: string };

function message(names: string[]): { title: string; body: string } {
  if (names.length === 1) return { title: `${names[0]} has been quiet for a few days`, body: 'A kudo or a note might be nice 🌱' };
  const list = names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]}, ${names[1]} and ${names.length - 2} more`;
  return { title: `${list} have been quiet for a few days`, body: 'A kudo or a note might be nice 🌱' };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('Authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401);

  const admin = adminClient();
  const { data, error } = await admin.rpc('nudge_candidates');
  if (error) return json({ error: error.message }, 500);

  const byRecipient = new Map<string, Candidate[]>();
  for (const c of (data ?? []) as Candidate[]) byRecipient.set(c.recipient, [...(byRecipient.get(c.recipient) ?? []), c]);

  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;
  for (const [recipient, quiet] of byRecipient) {
    const { title, body } = message(quiet.map((q) => q.friend_name));
    sent += await pushTo(admin, [recipient], 'notify_nudges', { title, body, url: '/squad' });
    await admin.from('nudge_log').upsert(quiet.map((q) => ({ recipient, about_user: q.friend, sent_on: today })));
  }
  return json({ recipients: byRecipient.size, sent });
});
