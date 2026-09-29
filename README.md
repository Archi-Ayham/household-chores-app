# Household Chores PWA

A deliberately small shared household chores app for four people. It has exactly two tabs:

- **Cleaning** — four fixed people around a rotating four-task wheel.
- **Dishwasher** — one rotating four-person wheel.

The shared state is stored in Supabase and synchronized through Supabase Realtime. There are no accounts, localStorage-based main state, notifications, settings, history, statistics, chat, or extra pages.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- Supabase Postgres + Realtime
- vite-plugin-pwa
- Vercel-ready static deployment

Use Node 20.19+ or 22.12+ for the current Vite toolchain.

## 1. Create the Supabase project

1. Create a new project at Supabase.
2. Open **SQL Editor**.
3. Paste the contents of `supabase/migrations/0001_household_chores.sql`.
4. Run it once.

The SQL creates only two tables: `people` and the singleton `household_state` row. Row Level Security is enabled; clients can read the shared state, while all writes go through two Postgres functions. Supabase recommends RLS for data exposed through the Data API and recommends tightly controlling execution privileges for database functions.

The SQL also adds `household_state` to the `supabase_realtime` publication. Realtime Postgres Changes only sees tables that are included in that publication.

### Changing the four names later

Edit the four `name` values in the SQL seed, or run:

```sql
update public.people set name = 'Alice' where id = 1;
update public.people set name = 'Bob' where id = 2;
update public.people set name = 'Charlie' where id = 3;
update public.people set name = 'Dana' where id = 4;
```

The fixed positions remain tied to IDs 1–4.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from the Supabase project:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Do not commit `.env.local`.

> Supabase is moving from the older `anon` / `service_role` key naming toward publishable / secret keys during 2026. Use the public client key shown by your project's Connect/API settings.

## 3. Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

For a production-like local check:

```bash
npm run build
npm run preview
```

## 4. How the synchronization works

The browser initially reads the four people and the single shared state row from Supabase. The state row also carries a monotonic `version` so late realtime packets cannot overwrite newer state.

When a user taps **Done**, the app calls a Postgres RPC instead of directly updating the row. The function locks the singleton row (`FOR UPDATE`) and uses an expected round / expected dishwasher position. That means duplicate or stale requests do not accidentally perform a second rotation.

Supabase documents `rpc()` as the JavaScript client method for invoking Postgres functions.

After the database row changes, every connected browser receives the update through Supabase Realtime Postgres Changes, so no manual refresh is needed.

## 5. PWA behavior

`vite-plugin-pwa` generates the web manifest and service worker during the production build. Its default `generateSW` strategy creates the service worker without requiring a handwritten service-worker file.
The build includes:

- Web App Manifest
- 192×192 and 512×512 app icons
- Apple touch icon
- Standalone display mode
- Auto-updating service worker

### Install on iPhone

1. Open the deployed HTTPS URL in **Safari**.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Tap **Add**.

### Install on Android

1. Open the deployed HTTPS URL in Chrome.
2. Use the browser's **Install app** / **Add to Home screen** option.
3. Confirm the installation.

## 6. Deploy to Vercel

### GitHub

Create a repository, then push this project:

```bash
git init
git add .
git commit -m "Initial household chores app"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Vercel

1. Create a new Vercel project and import the GitHub repository.
2. Keep the default Vite build configuration, or use:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add the two environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

The app is a static Vite build, so Vercel can serve it directly.

## 7. Manual verification checklist

### Cleaning

- Initial assignment is Person 1 → Bathroom, Person 2 → Kitchen, Person 3 → Living Room, Person 4 → Lounge/Break Room.
- Completing one person marks only that person done.
- Completing two or three people does not rotate the wheel.
- Completing the fourth person resets all completion states and advances one round.
- Round 2 is Person 1 → Lounge/Break Room, Person 2 → Bathroom, Person 3 → Kitchen, Person 4 → Living Room.

### Dishwasher

- Initial top person is Person 1.
- Pressing Done moves the top person to Person 2, then Person 3, Person 4, and back to Person 1.

### Synchronization

Open the deployed app in two browser windows or two devices. Perform actions in one and confirm the other updates without a refresh.

### Persistence

Change the state, close the browser, reopen the URL, and confirm Supabase restores the same shared state.

### Mobile

Test portrait layouts around 320px–430px wide in Safari on iPhone and Chrome on Android. The controls are intentionally large and touch-friendly.

## Project structure

```text
src/
  components/
    CircleWheel.tsx
    PersonSpot.tsx
  App.tsx
  index.css
  main.tsx
  supabase.ts
  types.ts
supabase/
  migrations/
    0001_household_chores.sql
public/
  favicon.svg
  pwa-192.png
  pwa-512.png
  apple-touch-icon.png
```
