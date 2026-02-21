/**
 * Email via SMTP (Gmail or other). Uses MAIL_USERNAME and MAIL_PASSWORD from config.
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

module.exports = { send, getTransporter };
