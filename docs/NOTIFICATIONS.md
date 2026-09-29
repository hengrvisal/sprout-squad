# Notifications

Three kinds, set up once:

| Kind | Where it's sent from | What it needs |
| --- | --- | --- |
| Evening "what did you get done?" (with typed reply) | The phone (scheduled locally) | Nothing extra |
| Kudos, notes, grow-together invites | `notify` edge function, called by the app | Deploy the function |
| Quiet-squadmate nudges (6pm local) | `nudges` edge function, hourly | Deploy + a cron job |

Push only works in a real build (dev build or TestFlight), not Expo Go, and only on a physical device.

## 1. Database

Run `supabase/migrations/0008_notifications.sql` (and 0007 / 0009 if you haven't).
**Run migrations before shipping the build**: the app reads the new profile columns.

## 2. EAS project id

Push tokens need it. If `app.json` has no `extra.eas.projectId` yet:

```bash
npx eas-cli@latest init
```

iOS push credentials are created for you the first time you run `eas build -p ios`
(say yes when it asks to set up push notifications).

## 3. Edge functions

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy notify
npx supabase functions deploy nudges --no-verify-jwt
npx supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
```

`nudges` checks `CRON_SECRET` itself (that's why it skips JWT checks). If you ever turn on
"Enhanced push security" in Expo, also `supabase secrets set EXPO_ACCESS_TOKEN=...`.

## 4. Hourly cron for nudges

Supabase dashboard → Integrations → enable **pg_cron** and **pg_net**. Then in the SQL editor
(replace the two placeholders; the secret is the one you set above):

```sql
select cron.schedule(
  'sprout-nudges',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/nudges',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
```

Every hour it finds people for whom it's 6pm and tells them about squadmates who haven't
logged for 3+ days, once per quiet stretch. Check runs in Integrations → Cron → Job runs.

## Testing

- Send yourself a push from https://expo.dev/notifications with your device's Expo token
  (in `push_tokens`), to check credentials.
- Kudos: two accounts in one squad, send a kudo, the other phone should buzz. One push per
  person per day, however many emoji they tap. Notes push once (edits don't).
- Evening reminder: set it to the next hour in Me → Notifications, don't log anything, wait.
- Nudges: `select * from nudge_candidates();` shows who would get one right now
  (only rows for people whose local time is 6pm).
