@AGENTS.md

## Sprout Squad conventions

- Build in phases, one feature at a time. Current phase and roadmap: README.md.
- Visual source of truth: the web prototype. Colours, fonts, radii live in `src/theme/tokens.ts`; never hard-code a colour in a screen, use `useColors()`.
- Hard shadows use `<Chunky>` (a backing View), not platform shadow props, so iOS/Android/web match.
- Dates are local calendar days as `YYYY-MM-DD` (`src/lib/dates.ts`). `entries.done_on` is written by the client from the local date; never derive it from `created_at` (UTC).
- Grid data comes from the `day_counts` RPC, not by fetching every entry.
- All data access goes through RLS; don't add service-role keys to the app.
- Schema changes: add a new numbered file in `supabase/migrations/`, never edit an applied one.
- Before calling a task done: `npm run typecheck && npm run lint && npm test`.
- Tabs stay minimal: one main card + a couple of summary rows, fitting one phone screen. Anything more goes on a detail screen one tap away (`TapCard` → `DetailScreen`).
- No leaderboards or rankings. Comparison is a known risk for this app; keep social features encouraging (kudos), not competitive.
