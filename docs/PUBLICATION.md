# SheGuard: Publish Victim & Guardian Apps and Google Redirect URL

This guide covers building the **Victim** and **Guardian** apps for publication, downloading the installable files (APK), and adding the **redirect URL in Google** so Sign in with Google works in production.

---

## Prerequisites

1. **Expo account** — Sign up at [expo.dev](https://expo.dev) and log in.
2. **EAS CLI** — Install and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Backend live on HTTPS** — Your API must be reachable at a URL like `https://api.yourdomain.com` (or your real domain). The mobile apps will call this URL and use it for Google OAuth redirect.
4. **Google Cloud Console** — You already have OAuth credentials (Web client ID). You will add the **production redirect URLs** there (see below).

---

## Step 1: Set production config (root `.env`)

In the **repo root** `.env` (copy from `.env.example` if needed), set:

```env
# Your live API URL (must be HTTPS in production)
API_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Google OAuth — same Web client ID as in Google Console
GOOGLE_CLIENT_ID=your-....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Production redirect base (same as API URL so backend can receive Google redirect)
OAUTH_REDIRECT_HTTPS_BASE=https://api.yourdomain.com
```

Then sync config into both mobile apps (for local dev):

```bash
cd d:\SheGuard
npm run sync-env
```

**Important:** EAS Build runs in the cloud and does **not** use your local `.env`. You must set the same values as **EAS environment variables** so the built app has the correct API URL and Google client ID. See **Step 2a** below.

---

## Step 2a: Set EAS environment variables (required for production build)

So the built APK uses your production API and Google OAuth, set these in EAS **before** running `eas build`:

1. Go to [expo.dev](https://expo.dev) → **Your account** → **Projects** → open **sheguard-victim** (and later repeat for guardian).
2. Go to **Settings** (or **Environment variables** / **Secrets**).
3. Under **Production** (or the environment used by your `production` profile), add:

   | Name | Value | Visibility |
   |------|--------|------------|
   | `EXPO_PUBLIC_BASE_URL` | `https://api.yourdomain.com` | Plain text |
   | `EXPO_PUBLIC_OAUTH_REDIRECT_HTTPS_BASE` | `https://api.yourdomain.com` | Plain text |
   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Your Web client ID (same as `GOOGLE_CLIENT_ID`) | Plain text |

   Replace `api.yourdomain.com` with your real API host.

4. Save. Then run the build again:  
   `eas build --platform android --profile production`

You should no longer see *"No environment variables with visibility Plain text and Sensitive found for the production environment"*. The built app will then use these values.

Repeat the same variables for the **guardian** project when you build that app.

---

## Step 2: Add redirect URLs in Google Cloud Console

So that **Sign in with Google** works in the published apps, add the **exact** redirect URIs your backend uses.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. Go to **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** of type **Web application** (the one whose ID is in `GOOGLE_CLIENT_ID`).
4. Under **Authorized redirect URIs** click **+ ADD URI** and add:
   - `https://api.yourdomain.com/oauth/redirect/victim`
   - `https://api.yourdomain.com/oauth/redirect/guardian`  
   Replace `api.yourdomain.com` with your real API host (same as `OAUTH_REDIRECT_HTTPS_BASE`).
5. Under **Authorized JavaScript origins** add (if not already):
   - `https://api.yourdomain.com`
6. Save.

After this, when users open the **published** Victim or Guardian app and tap “Sign in with Google”, the app will use these HTTPS redirect URLs and Google will accept them.

---

## Step 3: Build the Victim app

From the **repo root**:

```bash
cd mobile-victim
eas build --platform android --profile production
```

- First time: EAS will ask to create a project and link it; accept.
- When the build finishes, you get a link in the terminal (and an email). Open it in the browser.

To build for **iOS** as well (requires Apple Developer account and provisioning):

```bash
eas build --platform ios --profile production
```

---

## Step 4: Build the Guardian app

From the **repo root**:

```bash
cd mobile-guardian
eas build --platform android --profile production
```

Same as victim: first time you may need to create/link the project; then wait for the build to finish.

---

## Step 5: Download the APK (or AAB)

1. Go to [expo.dev](https://expo.dev) → **Your account** → **Projects**.
2. Open the project (**SheGuard** for victim, **Me** or the guardian project name for guardian).
3. Open the latest **Build** (e.g. Android production).
4. On the build page you’ll see:
   - **Download** button for the built file.  
   For the `production` profile we set `"android": { "buildType": "apk" }`, so you get an **APK** you can download and install directly on Android devices (or share for testing).
5. Download the APK and install on a device (enable “Install from unknown sources” if needed).

If you prefer an **AAB** (for Play Store upload), change in `eas.json` to remove `"buildType": "apk"` under the `production` profile so EAS produces an AAB by default; then download the AAB from the same build page.

---

## Step 6 (optional): Suppress “Expo Go” and “appVersionSource” warnings

- To hide the *"Detected that your app uses Expo Go for development"* warning when building production, set env before building:  
  `$env:EAS_BUILD_NO_EXPO_GO_WARNING="true"` (PowerShell) or `export EAS_BUILD_NO_EXPO_GO_WARNING=true` (bash).
- To fix *"cli.appVersionSource is not set"*, add to `app.json` under `expo`:  
  `"cli": { "appVersionSource": "local" }`. Then the version in `app.json` is used for the build.

---

## Quick checklist

- [ ] Backend is deployed and reachable at `https://api.yourdomain.com`.
- [ ] Root `.env` has `API_URL`, `OAUTH_REDIRECT_HTTPS_BASE`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; ran `npm run sync-env`.
- [ ] **EAS** → project (victim / guardian) → **Environment variables** (or Secrets) for **production**: set `EXPO_PUBLIC_BASE_URL`, `EXPO_PUBLIC_OAUTH_REDIRECT_HTTPS_BASE`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- [ ] In **Google Console** → Credentials → Web client, added redirect URIs:  
  `https://api.yourdomain.com/oauth/redirect/victim` and  
  `https://api.yourdomain.com/oauth/redirect/guardian`.
- [ ] Built Victim: `cd mobile-victim && eas build --platform android --profile production`.
- [ ] Built Guardian: `cd mobile-guardian && eas build --platform android --profile production`.
- [ ] Downloaded APK from Expo build page for each app and tested Sign in with Google on a device.

For more on Google OAuth (testing, consent screen, troubleshooting), see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).
