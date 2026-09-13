# Deploying Your Library — Full Walkthrough

This covers everything end to end: the database (Neon), the backend (Koyeb), the web
frontend (Vercel), and the Android app (Play Store). Follow it in this order — each
step depends on the one before it.

Rough total cost: **$0/month**, except the Google Play Console's one-time **$25**
registration fee (see Part 4). Everything else here runs on free tiers.

---

## Part 1 — Database (Neon)

You said you already have a Neon project, so:

1. Open your Neon project → **SQL Editor**.
2. Paste in the contents of `schema.sql` (project root) and run it. This creates the
   `users`, `books`, and `research_results` tables plus the enum types and triggers.
3. From Neon's dashboard, copy the **direct** (not pooled) connection string. It looks like:
   ```
   postgresql://<user>:<password>@<host>/<database>?sslmode=require
   ```
4. You'll turn this into the `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` values in Part 2 — the
   backend needs `stringtype=unspecified` added to the URL too (details below).

---

## Part 2 — Backend (Koyeb)

1. Push the `bookshelf-backend` folder to a GitHub repository (create one if you haven't).
2. In Koyeb: **Create App → GitHub → select your repo**. Koyeb will detect the `Dockerfile`
   automatically and build from it.
3. Before deploying, set these **environment variables** in Koyeb's service settings:

   | Variable | Value |
   |---|---|
   | `DB_URL` | `jdbc:postgresql://<neon-host>/<database>?stringtype=unspecified&sslmode=require` (note: `jdbc:` prefix, and the extra query params, added to what Neon gave you) |
   | `DB_USERNAME` | from your Neon connection string |
   | `DB_PASSWORD` | from your Neon connection string |
   | `JWT_SECRET` | generate one: run `openssl rand -base64 32` in any terminal, paste the output. Never reuse a secret that's appeared in a file you've shared or committed. |
   | `ALLOWED_ORIGINS` | leave unset for now — it defaults to `https://localhost`, which covers the Android app. You'll add your Vercel URL here in Part 3. |

4. Deploy. Koyeb builds the Docker image (which now targets Java 25 correctly) and starts
   the container with the `prod` Spring profile active by default.
5. Once it's running, Koyeb gives you a public URL like `https://your-app-name.koyeb.app`.
   Copy this down — you'll need it in Parts 3 and 4.
6. Sanity check: visit `https://your-app-name.koyeb.app/api/auth/register` in a browser.
   You should get an error about a missing request body (proves the server is up), not a
   connection failure or a 502.

---

## Part 3 — Web frontend (Vercel)

1. Push the `bookshelf-frontend` folder to a GitHub repository.
2. In Vercel: **Add New Project → import your repo**.
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Add an environment variable: `VITE_API_BASE_URL` = your Koyeb URL from Part 2
   (e.g. `https://your-app-name.koyeb.app`).
5. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.
6. Go back to Koyeb and update `ALLOWED_ORIGINS` to:
   `https://localhost,https://your-app.vercel.app`
   (keeps the Android app working, adds the web app). Redeploy the backend for this to
   take effect.
7. Visit your Vercel URL, register an account, and confirm you can add a book. If this
   works, both the database and backend are wired up correctly.

---

## Part 4 — Android app (Capacitor + Play Store)

This is the part with no assumed prior experience — every step is spelled out.

### 4.1 — Install prerequisites (one-time, on your computer)

1. Install Node.js version 22.22 or newer, if you don't already have it:
   https://nodejs.org (download the LTS installer for your OS).
2. Install Android Studio: https://developer.android.com/studio. Run the installer;
   accept the defaults. This bundles everything else you need — the Android SDK and a
   compatible JDK — so there's nothing else to install separately.
3. Open Android Studio once after installing, so it finishes its first-time setup
   (downloading SDK components). This can take a while — let it finish.

### 4.2 — Prepare the project

1. Open a terminal in the `bookshelf-frontend` folder.
2. Run `npm install`.
3. Pick your app's permanent identity now — open `capacitor.config.json` and change:
   ```json
   "appId": "com.homelibrary.app"
   ```
   to something you own, reverse-domain style — e.g. if your name is Priya, something like
   `com.priya.mylibrary`. This cannot be changed after your first Play Store upload —
   changing it later means publishing an entirely new, separate app listing.
4. Create your production environment file:
   ```
   cp .env.production.example .env.production
   ```
   Then edit `.env.production` and set:
   ```
   VITE_API_BASE_URL=https://your-app-name.koyeb.app
   ```
   (your real Koyeb URL from Part 2 — not `localhost`, since the phone can't reach
   "localhost" meaning your computer).

### 4.3 — Generate the native Android project

Run these two commands, in order:

```
npm run android:add
npm run android:sync
```

The first creates a new `android/` folder (a real Android Studio project) inside
`bookshelf-frontend`. The second builds your web app and copies it into that project.
You'll re-run `npm run android:sync` any time you change the app and want to rebuild it.

### 4.4 — Open and run it once (optional but reassuring)

```
npm run android:open
```

This opens the `android/` folder in Android Studio. If you have an Android phone, you can
plug it in via USB (with "USB debugging" enabled in the phone's Developer Options settings)
and click the green Run button in Android Studio to install and launch the app directly —
a good way to confirm everything works before going any further. Alternatively, Android
Studio can run it on a built-in emulator instead of a real phone.

### 4.5 — Build a signed release for the Play Store

1. In Android Studio, with the `android/` project open: Build menu → Generate Signed
   Bundle / APK.
2. Choose Android App Bundle (this is the format the Play Store requires for new apps —
   not the older `.apk` format).
3. Click "Create new..." to make a new keystore (a file that cryptographically signs your
   app). Fill in the form — it'll ask for a keystore password, a key alias, a key password,
   and some organizational details (name, org, city, country — these can be anything
   reasonable, they're not verified).
4. This is the single most important file in this whole process: back up the keystore
   file and write down its passwords somewhere safe — a password manager, a note in a
   safe place, anything durable. If you lose it, you cannot publish updates to this app ever
   again; you'd have to create a brand new listing from scratch and existing users couldn't
   get the update.
5. Finish the wizard, select "release" as the build variant, and click Finish.
   Android Studio builds an `.aab` file and tells you where it saved it (something like
   `android/app/release/app-release.aab`).

### 4.6 — Publish to the Play Store

1. Go to https://play.google.com/console and sign up as a developer. This has a one-time
   $25 fee and requires a Google account.
2. Once approved (usually fast, sometimes takes a day), click "Create app".
3. Fill in the basics: app name ("Your Library" or whatever you'd like), default language,
   app or game (app), free or paid (free).
4. In the left sidebar, you'll need to complete several sections before you can publish —
   Play Console highlights which ones are outstanding:
   - Store listing: a short and full description, an app icon (512x512 PNG), at least
     2 screenshots (take these from the emulator or your phone while running the app),
     a feature graphic (1024x500 PNG).
   - Privacy policy URL: required even for a personal app. A single static page
     describing what the app stores (your email, your book list, on your own Neon
     database) is enough — you can host this as a free GitHub Pages page or similar.
   - Content rating: fill out the questionnaire (a simple personal library app will
     rate very low/everyone).
   - App content / Data safety: describe what data the app collects (email for login,
     book data you enter) and that it's stored on your own backend.
5. Go to Production → Create new release, upload the `.aab` file from step 4.5, add
   release notes (e.g. "Initial release"), and save.
6. Submit for review. Google's review can take anywhere from a few hours to a few days
   for a first submission.
7. Once approved, your app is live on the Play Store.

### 4.7 — Updating the app later

Whenever you change the frontend code:

```
npm run android:sync
```

then repeat step 4.5 (Generate Signed Bundle, using the same keystore — Android Studio
remembers it once you've used it once) and upload the new `.aab` as a new release in Play
Console, under the same app listing.

---

## Quick reference: what points at what

- Frontend (web, Vercel) calls the Koyeb backend URL (`VITE_API_BASE_URL` env var on Vercel)
- Frontend (Android app) calls the same Koyeb backend URL, baked in at build time via
  `.env.production`
- Backend (Koyeb) connects to Neon (`DB_URL`/`DB_USERNAME`/`DB_PASSWORD` env vars),
  and allows requests from both the Android app and the Vercel URL (`ALLOWED_ORIGINS`)
- Neon is just the database; nothing points "at" it except the backend
