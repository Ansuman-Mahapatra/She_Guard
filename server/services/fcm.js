/**
 * FCM (Firebase Cloud Messaging) via Firebase Admin SDK.
 * Uses service account JSON file path from config (e.g. firebase-key.json).
 */
const path = require('path');
const config = require('../config');

let admin = null;
let messaging = null;

function init() {
  if (messaging) return messaging;
  const keyPath = config.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) {
    console.log('[fcm] No FIREBASE_SERVICE_ACCOUNT_PATH — push disabled');
    return null;
  }
  const absolutePath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(__dirname, '..', '..', keyPath);
  try {
    const serviceAccount = require(absolutePath);
    if (!admin) {
      admin = require('firebase-admin');
    }
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    messaging = admin.messaging();
    console.log('[fcm] Initialized with service account:', keyPath);
    return messaging;
  } catch (err) {
    console.warn('[fcm] Init failed (push disabled):', err.message);
    return null;
  }
}

/**
 * Send FCM to a device token or topic.
 * @param {string} token - FCM device token
 * @param {object} notification - { title, body }
 * @param {object} data - optional key-value payload
 */
async function sendToDevice(token, notification, data = {}) {
  const m = init();
  if (!m || !token) return;
  try {
    await m.send({
      token,
      notification: { title: notification.title || 'Alert', body: notification.body || '' },
      data: typeof data === 'object' ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ) : {},
    });
    console.log('[fcm] Sent to token');
  } catch (err) {
    console.error('[fcm] Send error:', err.message);
  }
}

/**
 * Send to a topic (e.g. 'guardians').
 */
async function sendToTopic(topic, notification, data = {}) {
  const m = init();
  if (!m || !topic) return;
  try {
    await m.send({
      topic,
      notification: { title: notification.title || 'Alert', body: notification.body || '' },
      data: typeof data === 'object' ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ) : {},
    });
    console.log('[fcm] Sent to topic:', topic);
  } catch (err) {
    console.error('[fcm] Send to topic error:', err.message);
  }
}

module.exports = { init, sendToDevice, sendToTopic };
