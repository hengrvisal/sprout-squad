# Website (sproutsquad.app)

Plain static files in `website/`, no build step. Pages: landing (`/`), `/privacy`, `/support`, `/delete-account`.

## 1. Switch on the waitlist (once)

1. Run `supabase/migrations/0005_waitlist_and_account_deletion.sql` in the Supabase SQL editor.
2. In `website/config.js`, replace `sb_publishable_xxx` with your publishable key (same value as `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). It's safe to commit: the page can only call `join_waitlist`, and nobody can read the list through the API.
3. See sign-ups in Supabase → Table Editor → `waitlist`.

## 2. Deploy on Cloudflare Pages (once)

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**

| Setting | Value |
| --- | --- |
| Repository | hengrvisal/sprout-squad |
| Production branch | main |
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `website` |

Then **Custom domains → Set up a custom domain** → `sproutsquad.app` (and `www.sproutsquad.app` if you like). Because the domain's DNS is on Cloudflare, it adds the records itself. Your Resend records for `mail.sproutsquad.app` aren't touched.

Every push to `main` redeploys the site automatically.

## 3. Make hello@sproutsquad.app reach you (once)

The site lists `hello@sproutsquad.app` for support and privacy requests. Cloudflare → your domain → **Email → Email Routing** → enable → add a rule `hello@sproutsquad.app` → forward to your personal inbox. Free.

## Local preview

```bash
npx serve website     # or: python3 -m http.server -d website
```

## App Store Connect URLs

| Field | URL |
| --- | --- |
| Privacy Policy URL | https://sproutsquad.app/privacy |
| Support URL | https://sproutsquad.app/support |
| Marketing URL | https://sproutsquad.app |
