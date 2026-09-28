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
  hooks/               auth, entries (counts + today, optimistic writes), profile
  lib/                 supabase client, dates (pure, tested), categories
  theme/tokens.ts      colours (light/dark), fonts, radii from the web prototype
supabase/migrations/   schema + RLS
```

## Data model

- `profiles` (1 per user, auto-created on sign-up): `display_name`, `emoji`
- `entries`: one row per thing done: `text`, `category`, `done_on` (the user's **local** date, set by the app)
- `day_counts(from, to)` RPC: per-day totals for the grid, aggregated server-side

RLS: in phase 1 you can only read and write your own rows.

## Roadmap

- [x] **Phase 1 · Solo loop**: sign-in, log/remove today's wins, monthly grid with month navigation, streak, profile
- [ ] **Phase 2 · Squads**: invite code, squad membership, friends' grids + today list, RLS widened to squad members
- [ ] **Phase 3 · Kudos + nudges**: 🔥👏💪🌱 reactions, push notifications (kudos received, gentle evening reminder)
- [ ] **Later · Rewind**: yearly recap: 12-month grid, top categories, longest streak, busiest month
