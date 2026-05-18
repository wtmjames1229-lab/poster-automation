'use strict';

const { SessionExpiredError } = require('./printifyProductPage');

class CaptchaRequiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CaptchaRequiredError';
    this.code = 'CAPTCHA_REQUIRED';
  }
}

function isSessionError(err) {
  if (!err) return false;
  if (err instanceof SessionExpiredError || err.code === 'SESSION_EXPIRED') return true;
  const m = (err.message || '').toLowerCase();
  return (
    m.includes('session expired') ||
    m.includes('redirected to printify login') ||
    m.includes('refresh session') ||
    m.includes('captcha')
  );
}

function isCaptchaError(err) {
  return err && (err.code === 'CAPTCHA_REQUIRED' || err.name === 'CaptchaRequiredError');
}

function isToggleNotFoundError(err) {
  if (!err) return false;
  const m = (err.message || '').toLowerCase();
  return m.includes('toggle not found') || m.includes('label and toggle not found');
}

module.exports = {
  isSessionError,
  isToggleNotFoundError,
  isCaptchaError,
  SessionExpiredError,
  CaptchaRequiredError,
};
