/**
 * OAuth redirect handler for production: Google redirects to our HTTPS URL,
 * we exchange the code for tokens and redirect the user back to the app with a one-time code.
 * This lets you use a stable .com/.dev redirect in Google Console instead of exp:// or custom schemes.
 */
const express = require('express');
const config = require('../config');
const crypto = require('crypto');

const router = express.Router();

// One-time codes: otc -> { idToken, expiresAt }. In production with multiple servers, use Redis.
const oneTimeCodes = new Map();
const OTC_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function cleanupExpired() {
  const now = Date.now();
  for (const [key, data] of oneTimeCodes.entries()) {
    if (data.expiresAt < now) oneTimeCodes.delete(key);
  }
}

function createOneTimeCode(idToken) {
  cleanupExpired();
  const otc = crypto.randomBytes(24).toString('base64url');
  oneTimeCodes.set(otc, { idToken, expiresAt: Date.now() + OTC_EXPIRY_MS });
  return otc;
}

function consumeOneTimeCode(otc) {
  const data = oneTimeCodes.get(otc);
  if (!data) return null;
  oneTimeCodes.delete(otc);
  if (data.expiresAt < Date.now()) return null;
  return data.idToken;
}

// Expose for apiAuth to use
module.exports.consumeOneTimeCode = consumeOneTimeCode;

const SCHEMES = {
  victim: 'com.sheguard.victim',
  guardian: 'com.sheguard.guardian',
};

async function handleOAuthRedirect(req, res, appKey) {
  const base = config.OAUTH_REDIRECT_HTTPS_BASE;
  if (!base || !config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    return res.status(503).send('OAuth redirect not configured.');
  }

  const { code, state, error } = req.query;
  const scheme = SCHEMES[appKey];
  const redirectToApp = (params) => {
    const qs = new URLSearchParams(params).toString();
    res.redirect(302, `${scheme}://oauth?${qs}`);
  };

  if (error) {
    redirectToApp({ error: error || 'access_denied' });
    return;
  }

  if (!code) {
    redirectToApp({ error: 'missing_code' });
    return;
  }

  const redirectUri = `${base.replace(/\/$/, '')}/oauth/redirect/${appKey}`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error('[oauth-redirect] Token exchange failed:', tokenData.error);
      redirectToApp({ error: tokenData.error });
      return;
    }

    const idToken = tokenData.id_token;
    if (!idToken) {
      redirectToApp({ error: 'no_id_token' });
      return;
    }

    const otc = createOneTimeCode(idToken);
    redirectToApp({ otc, state: state || '' });
  } catch (err) {
    console.error('[oauth-redirect] Error:', err);
    redirectToApp({ error: 'server_error' });
  }
}

router.get('/redirect/victim', (req, res) => handleOAuthRedirect(req, res, 'victim'));
router.get('/redirect/guardian', (req, res) => handleOAuthRedirect(req, res, 'guardian'));

module.exports.router = router;
