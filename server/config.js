/**
 * Server config from .env (loaded by server.js via dotenv).
 * Use this in routes/services instead of process.env directly.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency_db',

  // CORS: comma-separated origins or '*' for all (default: * for dev)
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // API base URL (for links in emails/reports if needed)
  API_URL: process.env.API_URL || 'http://localhost:5000',

  // GPS / Maps (for server-side geocoding or validation if needed)
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || '',

  // Image / Media upload (Cloudinary)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  UPLOAD_API_URL: process.env.UPLOAD_API_URL || '',

  // Push (FCM) — path to Firebase service account JSON (e.g. firebase-key.json at project root)
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',

  // Mail (e.g. Gmail SMTP) — used for all guardian/SOS alerts (hackathon: email only, no SMS)
  MAIL_USERNAME: process.env.MAIL_USERNAME || process.env.SPRING_MAIL_USERNAME || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || process.env.SPRING_MAIL_PASSWORD || '',
  GUARDIAN_ALERT_EMAIL: process.env.GUARDIAN_ALERT_EMAIL || '',
  // Comma-separated list of emails to receive alerts (hackathon: use instead of SMS)
  ALERT_EMAILS: process.env.ALERT_EMAILS ? process.env.ALERT_EMAILS.split(',').map((e) => e.trim()).filter(Boolean) : [],

  // SMS (Twilio) — not used for hackathon; alerts go by email only
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  // Auth (JWT)
  JWT_SECRET: process.env.JWT_SECRET || 'sheguard-dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  SESSION_INACTIVITY_DAYS: parseInt(process.env.SESSION_INACTIVITY_DAYS || '30', 10),
};
