/**
 * Email via SMTP (Gmail or other). Uses MAIL_USERNAME and MAIL_PASSWORD from config.
 * Hackathon: all guardian/SOS alerts go by email only (no SMS).
 */
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.MAIL_USERNAME || !config.MAIL_PASSWORD) {
    console.log('[mail] No MAIL_USERNAME/MAIL_PASSWORD — email disabled');
    return null;
  }
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.MAIL_USERNAME,
        pass: config.MAIL_PASSWORD,
      },
    });
    console.log('[mail] SMTP configured:', config.MAIL_USERNAME);
    return transporter;
  } catch (err) {
    console.warn('[mail] Init failed:', err.message);
    return null;
  }
}

/**
 * Send an email.
 * @param {string} to - recipient
 * @param {string} subject
 * @param {string} text - plain body
 * @param {string} html - optional HTML body
 */
async function send(to, subject, text, html) {
  if (!to || !to.trim()) return;
  const trans = getTransporter();
  if (!trans) return;
  try {
    await trans.sendMail({
      from: config.MAIL_USERNAME,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    });
    console.log('[mail] Sent to', to);
  } catch (err) {
    console.error('[mail] Send error:', err.message);
  }
}

/**
 * Send verification code email (victim and guardian registration).
 */
async function sendVerificationEmail(to, code) {
  const subject = 'SheGuard — Verify your email';
  const text = `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`;
  const html = `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you didn't request this, ignore this email.</p>`;
  await send(to, subject, text, html);
}

/**
 * Send alert to a list of emails (guardian emails from victim's linked guardians).
 * If no emails provided, falls back to config GUARDIAN_ALERT_EMAIL/ALERT_EMAILS for demo.
 */
async function sendAlertToEmails(emails, subject, text) {
  const list = Array.isArray(emails) ? emails.filter((e) => e && typeof e === 'string' && e.trim()) : [];
  if (list.length === 0) {
    if (config.GUARDIAN_ALERT_EMAIL && config.GUARDIAN_ALERT_EMAIL.trim()) {
      list.push(config.GUARDIAN_ALERT_EMAIL.trim());
    }
    if (config.ALERT_EMAILS && config.ALERT_EMAILS.length) {
      list.push(...config.ALERT_EMAILS);
    }
  }
  const unique = [...new Set(list)];
  for (const to of unique) {
    await send(to, subject, text).catch((err) => console.error('[mail] Alert to', to, err.message));
  }
}

/** @deprecated Use sendAlertToEmails(emails, subject, text) with guardian emails */
async function sendAlertToGuardians(subject, text) {
  await sendAlertToEmails([], subject, text);
}

module.exports = { send, sendVerificationEmail, sendAlertToEmails, sendAlertToGuardians, getTransporter };
