# Google OAuth setup for SheGuard (fix “Access blocked” / 400 invalid_request)

If you see **“Access blocked: Authorization Error”** or **“Error 400: invalid_request”** when signing in with Google in the Victim (or Guardian) app, the app is not yet allowed by Google’s OAuth settings. Fix it in **Google Cloud Console**, not in code.

## 1. Open your project in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select the project that owns your OAuth credentials (the one where you created the Web/Android client IDs).

## 2. OAuth consent screen — allow your account as a test user

The “Access blocked” message usually means the app is in **Testing** mode and your Google account is not in the test users list.

1. Go to **APIs & Services** → **OAuth consent screen**.
2. Under **Publishing status** you’ll see either **Testing** or **In production**.
3. If it’s **Testing**:
   - Scroll to **Test users**.
   - Click **+ ADD USERS**.
   - Add **every Google account** you use to sign in (e.g. `ansumanmahapatra998@gmail.com`).
   - Save.
4. If it’s **In production** and you haven’t completed Google’s verification, either:
   - Switch back to **Testing** and add test users as above, or  
   - Complete [App verification](https://support.google.com/cloud/answer/9110914) (needed for any non-test user).

## 3. Credentials — correct client IDs and redirect URIs

1. Go to **APIs & Services** → **Credentials**.
2. You need at least one **OAuth 2.0 Client ID** of type **Web application** (used by Expo in the victim app).
3. Open that **Web application** client:
   - **Authorized JavaScript origins**: add your web origin if you use Google sign-in on web (e.g. `https://yourdomain.com` or Expo web URL).
   - **Authorized redirect URIs**: must include the **exact** redirect URI the app uses.
     - Run the victim app and check the console/logs. The app logs something like:  
       `COPY THIS TO GCP AUTHORIZED REDIRECT URIS: <redirect_uri>`  
     - Copy that value and add it to **Authorized redirect URIs** in the Web client.
     - Common redirects:
       - **Expo Go (dev):** app logs e.g. `exp://10.247.26.215:8081` — add that exact URI (IP/port may differ).
       - **Production (recommended):** use a stable domain. In `.env` set `OAUTH_REDIRECT_HTTPS_BASE=https://api.yourdomain.com` (your backend URL), run `npm run sync-env`, then in Google add **Authorized redirect URIs**: `https://api.yourdomain.com/oauth/redirect/victim` and `https://api.yourdomain.com/oauth/redirect/guardian`. No more `exp://` or changing IPs.
       - Custom scheme (standalone build): e.g. `com.sheguard.victim://` if not using the domain redirect.
       - Add every redirect URI you actually use.
4. Use the **same Web client ID** in:
   - **Backend**: `.env` → `GOOGLE_CLIENT_ID=` (this value).
   - **Mobile**: run `npm run sync-env` so `GOOGLE_WEB_CLIENT_ID` in the mobile app matches.  
   If you use an Android client ID for native Android, add it to `.env` as `EXPO_GOOGLE_ANDROID_CLIENT_ID` and sync again.

## 4. After changing settings

- Consent screen / test users: changes apply quickly; try sign-in again.
- Redirect URIs: save the credential, then retry (no redeploy needed if the app was already using the same redirect).

## 5. Checklist

- [ ] **OAuth consent screen** → Test users include `ansumanmahapatra998@gmail.com` (and any other accounts you sign in with).
- [ ] **Credentials** → Web client **Authorized redirect URIs** include the exact redirect URI from the app logs.
- [ ] **.env** has `GOOGLE_CLIENT_ID=` set to that Web client ID; run `npm run sync-env` so mobile uses it.
- [ ] Backend and mobile use the **same** Web client ID for Google sign-in.

If it still fails, in the error screen click **“If you are a developer of She_Guard, see error details”** and check the exact reason (e.g. redirect_uri_mismatch, unregistered client, or app not allowed for this user).

---

## Production: stable .com / .dev redirect (recommended)

Google accepts **HTTPS redirect URIs** (e.g. `https://api.sheguard.com/oauth/redirect/victim`). You then don't depend on `exp://` or changing IPs.

1. **Backend** must be reachable at HTTPS (e.g. `https://api.yourdomain.com`).
2. **.env**: set `OAUTH_REDIRECT_HTTPS_BASE=https://api.yourdomain.com` and `GOOGLE_CLIENT_SECRET=` (from the same Web client in Google Console). Run `npm run sync-env`.
3. **Google Console** → Credentials → your Web client → **Authorized redirect URIs**: add `https://api.yourdomain.com/oauth/redirect/victim` and `https://api.yourdomain.com/oauth/redirect/guardian`.
4. When the user signs in, the app opens the browser with that redirect; your server exchanges the code and redirects back to the app with a one-time code. No `exp://` in Google.
