# Sprout Squad

Log the productive things you do each day. Your squad sees your grid fill up, and you see theirs. Kudos, no leaderboard.

Expo (SDK 57) · Expo Router · TypeScript · Supabase

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Supabase project**
   - Create a project at supabase.com.
   - SQL editor → paste and run `supabase/migrations/0001_init.sql`
     (or `supabase db push` if you use the Supabase CLI).
   - **Auth → Email templates → Magic Link**: put the code in the email, e.g.
     `Your Sprout Squad code is {{ .Token }}`. The app signs in with a 6-digit code, not a link,
     so no deep-link setup is needed.

3. **Env**

   ```bash
   cp .env.example .env
   # fill EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   ```

4. **Run**

   ```bash
   npx expo start        # scan the QR with Expo Go, or press w for web
   ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Dev server |
| `npm test` | Unit tests (date + grid logic) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |

## Layout

```
src/
  app/                 routes (Expo Router)
    _layout.tsx        fonts, providers, auth guard
    sign-in.tsx        email → 6-digit code
    (tabs)/            Today · Squad · Me, custom pill tab bar
  components/          MonthGrid, Screen, ui primitives (Chunky hard-shadow cards, Button, Chip)
  hooks/               auth, entries (counts + today, optimistic writes), profile, squads
  components/squad/    StartOrJoin, MemberCard
  lib/                 supabase client, dates (pure, tested), categories
  theme/tokens.ts      colours (light/dark), fonts, radii from the web prototype
supabase/migrations/   schema + RLS
```

## Data model

- `profiles` (1 per user, auto-created on sign-up): `display_name`, `emoji`
- `entries`: one row per thing done: `text`, `category`, `done_on` (the user's **local** date, set by the app)
- `day_counts(from, to)` RPC: per-day totals for the grid, aggregated server-side

- `squads` / `squad_members`: a person can be in up to 10 squads of up to 10 people. Create, join and leave go through the `create_squad`, `join_squad`, `leave_squad` RPCs.
- `squad_day_counts(squad, from, to)` RPC: per-member daily totals for the squad view
- `kudos`: one row per (sender, recipient, day, emoji); only between squadmates, sender can take it back

RLS: you write only your own rows. You can read your squadmates' profiles and entries, and nobody else's.

## Roadmap

- [x] **Phase 1 · Solo loop**: sign-in, log/remove today's wins, monthly grid with month navigation, streak, profile
- [x] **Phase 2 · Squads**: multiple squads (10 people max), invite codes, friends' grids + today list, squadmate-only read access
- [x] **Phase 3a · Kudos**: 🔥👏💪🌱 on friends' cards, kudos received shown on Today
- [x] **Release prep**: app icon, splash, bundle id `app.sproutsquad`, EAS build profiles, TestFlight guide (`docs/TESTFLIGHT.md`)
- [x] **Website**: landing page with beta waitlist, privacy, support and delete-account pages (`website/`, see `docs/WEBSITE.md`); in-app account deletion
- [ ] **Phase 3b · Dev build + push**: EAS development build, push for kudos received and a gentle evening reminder
- [ ] **Phase 4 · iOS widget**: today prompt → your grid once you've logged, cycling through friends' grids
- [ ] **Later · Rewind**: yearly recap: 12-month grid, top categories, longest streak, busiest month
# sprout-squad
