@AGENTS.md

## Sprout Squad conventions

- Build in phases, one feature at a time. Current phase and roadmap: README.md.
- Visual source of truth: the web prototype. Colours, fonts, radii live in `src/theme/tokens.ts`; never hard-code a colour in a screen, use `useColors()`.
- Soft look: each page paints a gradient (`<Screen gradient=…>` → `Backdrop`), content sits on frosted surfaces (`<Chunky>`/`<Card>`: glass fill, hairline edge, `softShadow`). No hard offset shadows or thick ink borders; ink outlines (`c.outline`) are only for illustrations like the plant.
- Dates are local calendar days as `YYYY-MM-DD` (`src/lib/dates.ts`). `entries.done_on` is written by the client from the local date; never derive it from `created_at` (UTC).
- Grid data comes from the `day_counts` RPC, not by fetching every entry.
- All data access goes through RLS; don't add service-role keys to the app.
- Schema changes: add a new numbered file in `supabase/migrations/`, never edit an applied one.
- Before calling a task done: `npm run typecheck && npm run lint && npm test`.
- Five pages (Today · Month · Focus · Squad · Me), swipeable. Each page does ONE main thing (log / grid / timer / plant / you) and fits one phone screen; no stacks of cards, no explanatory paragraphs. Anything more goes on a detail screen one tap away (`DetailScreen`).
- No leaderboards or rankings. Comparison is a known risk for this app; keep social features encouraging (kudos), not competitive.
