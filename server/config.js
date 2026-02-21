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

  // Mail (e.g. Gmail SMTP)
  MAIL_USERNAME: process.env.MAIL_USERNAME || process.env.SPRING_MAIL_USERNAME || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || process.env.SPRING_MAIL_PASSWORD || '',
  GUARDIAN_ALERT_EMAIL: process.env.GUARDIAN_ALERT_EMAIL || '',

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
};
