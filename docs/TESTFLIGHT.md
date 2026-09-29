# Shipping a test build to friends (TestFlight)

One-time setup, then one command per new build.

## 0. Accounts

- **Apple Developer Program** (paid, yearly) with the Apple ID you'll use for the app.
- **Expo account** (free) at expo.dev.

## 1. Link the project to EAS (once)

```bash
npm install --global eas-cli
eas login
eas init                 # creates the EAS project and adds its id to app.json
git commit -am "Link EAS project" && git push
```

## 2. Give cloud builds the Supabase keys (once)

`.env` is gitignored, so EAS can't see it. Push its values to EAS:

```bash
eas env:push production --path .env
eas env:push preview --path .env
```

Check with `eas env:list production`. Without this the build installs but crashes on launch with "Missing Supabase env".

## 3. Build for iOS

```bash
eas build --platform ios --profile production
```

The first run asks you to log in to Apple. Let EAS register the bundle id `app.sproutsquad` and manage the certificates. The build runs in the cloud (~15–20 min) and the build number goes up automatically each time.

## 4. Create the app in App Store Connect (once)

appstoreconnect.apple.com → **Apps → +  → New App**

| Field | Value |
| --- | --- |
| Platform | iOS |
| Name | Sprout Squad (must be unique on the App Store; add a word if taken) |
| Primary language | English (Australia) |
| Bundle ID | app.sproutsquad (appears after step 3) |
| SKU | sprout-squad |
| User access | Full access |

## 5. Upload the build

```bash
eas submit --platform ios --latest
```

It uploads the build from step 3. Apple processes it for 10–30 min, then it shows under **TestFlight**. Later, `eas build -p ios --auto-submit` does steps 3 and 5 in one go.

## 6. Demo account for Apple's beta review

Apple reviews the first build for external testers and their reviewer can't get our emailed codes. Make a demo account they can sign in with:

1. Supabase → **Authentication → Users → Add user → Create new user**.
   Email: `review@sproutsquad.app`, Password: a random **10-digit number**, tick **Auto Confirm User**.
2. Sign in once yourself with those details (type the number in the code box) and log a couple of wins so the reviewer sees a working app. Optionally put it in a squad with you.

## 7. Invite friends

TestFlight → **External Testing → +** → group "Friends".

- Add the build, then fill **Test Information**:
  - Beta app description: *Log the productive things you do each day. Your squad sees your grid fill up, and you see theirs.*
  - Feedback email: your email.
  - **Sign-in required: yes.** Username `review@sproutsquad.app`, password the 10-digit number.
  - Review notes: *Sign-in is by emailed code. For review, enter the demo email, tap "Email me a code", then type the password above into the code box.*
- Submit for Beta App Review (usually within a day for the first build; later builds are often instant).
- Once approved: **Enable Public Link** and send it to friends, or add them by email.

Friends install the **TestFlight** app, open the link, tap Install. TestFlight builds expire after 90 days; a new build resets that.

## Updating testers

JS-only changes still need a new build for TestFlight (`eas build -p ios --auto-submit`). Over-the-air updates (EAS Update) can come later.
