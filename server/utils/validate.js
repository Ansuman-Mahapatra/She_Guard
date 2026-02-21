const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(str) {
  if (!str || typeof str !== 'string') return false;
  return EMAIL_REGEX.test(str.trim());
}

module.exports = { isValidEmail };
