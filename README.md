# Home Library — Frontend

React + Vite + Tailwind v4, styled as a card-catalog: index-card book listings, a
drawer-front sidebar, and a ledger-paper background. Talks to the Spring Boot
backend for everything (auth, books, ISBN lookup, the research agent).

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and point it at your running backend:
   ```
   VITE_API_BASE_URL=http://localhost:8080
   ```
3. `npm run dev` — opens at http://localhost:5173

You'll need the backend running (see the `library-backend` project) and a Neon
database with `schema.sql` applied, since there's no data without it.

## What's here

- `/login`, `/register` — auth, backed by the Spring Boot JWT endpoints
- `/` — the library (owned books), with genre/language/author filters
- `/wishlist` — wishlist items, with a "mark as purchased" modal (asks the price paid, then
  moves the book to owned)
- `/add` — add a book either by ISBN (looks up via the backend, shows a preview,
  then "Add to library" or "Add to wishlist") or by a manual form
- `/books/:id` — full detail view, including an "Edit" link that swaps the card into an
  editable form (all fields, saved via `PUT /api/books/:id`), delete, and a "Research this
  book" button that calls the research agent and shows whatever it finds (price, when
  available, plus catalog/marketplace links)

The JWT is stored in `localStorage` after login/register and sent as
`Authorization: Bearer <token>` on every request. There's no refresh-token flow,
matching the backend's 7-day token lifetime — you'll need to log in again after
that.

## Deploying (free)

Any static host works since this builds to plain static files:

1. `npm run build` → outputs to `dist/`
2. Deploy `dist/` to **Vercel** or **Netlify** (both have generous free tiers for
   static sites). Either can also build directly from a GitHub repo — just set
   the build command to `npm run build`, output directory to `dist`, and add
   `VITE_API_BASE_URL` as an environment variable pointing at your Koyeb backend
   URL.

## Android app (Capacitor)

This wraps the same web app in a native Android shell, so there's one codebase for both.
Full beginner-friendly, step-by-step instructions (Android Studio setup, signing, Play Store
submission) are in `DEPLOYMENT.md` at the project root. Quick reference once you've read that:

```
npm install                 # pulls in @capacitor/core, @capacitor/cli, @capacitor/android
cp .env.production.example .env.production   # then edit it with your real Koyeb URL
npm run android:add         # one-time -- generates the native android/ project
npm run android:sync        # after every change -- rebuilds and copies into android/
npm run android:open        # opens the android/ folder in Android Studio
```

**One manual step after `npm run android:add`:** the ISBN barcode scanner needs camera
access, but Capacitor's default Android template doesn't request the camera permission
(it's only added automatically if you use a native camera plugin, which this project
doesn't -- it scans via the browser's camera API instead). Open
`android/app/src/main/AndroidManifest.xml` and add this line inside the `<manifest>` tag,
alongside the existing `<uses-permission android:name="android.permission.INTERNET" />`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

Do this once, right after `npm run android:add` creates the folder -- it won't be
overwritten by future `npm run android:sync` runs (that command only touches the web
assets, not the manifest).

## Scanning barcodes

The "Add a book" page can look up a book by ISBN two ways: typing it in, or scanning the
barcode on the back of the book with a camera. Scanning works the same way on the web app
(webcam) and the Android app (rear camera) since both use the browser's camera API
(`getUserMedia`) via the `@zxing/browser` library -- there's no separate native code path.
It only detects EAN-13 codes starting with 978/979 (how ISBNs are encoded), to avoid
false positives from other barcodes.

Camera access requires a secure context (HTTPS or localhost) -- already true for the
Vercel deployment, `npm run dev` on localhost, and the Android app (which uses
`androidScheme: 'https'`), so this should work everywhere without extra configuration
beyond the manifest permission above.

**Before your first Play Store upload**, change `"appId"` in `capacitor.config.json` from the
placeholder `com.homelibrary.app` to something you own (reverse-domain form, e.g.
`com.yourname.library`) — this can't be changed afterward without publishing as a new app.

## Not yet built

- App icon / splash screen customization for the Android build (uses Capacitor's placeholder)
