'use strict';

const { SessionExpiredError } = require('./printifyProductPage');

function isSessionError(err) {
  if (!err) return false;
  if (err instanceof SessionExpiredError || err.code === 'SESSION_EXPIRED') return true;
  const m = (err.message || '').toLowerCase();
  return (
    m.includes('session expired') ||
    m.includes('redirected to printify login') ||
    m.includes('refresh session')
  );
}

function isToggleNotFoundError(err) {
  if (!err) return false;
  const m = (err.message || '').toLowerCase();
  return m.includes('toggle not found') || m.includes('label and toggle not found');
}

module.exports = { isSessionError, isToggleNotFoundError, SessionExpiredError };
