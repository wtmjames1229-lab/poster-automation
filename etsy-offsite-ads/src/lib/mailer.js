'use strict';

/**
 * Email alerts for watch mode (SMTP or SendGrid HTTP API).
 * If mail is not configured, logs a warning and returns { sent: false }.
 */

const https = require('https');

function isMailConfigured() {
  if (process.env.MAIL_TO && process.env.SENDGRID_API_KEY) return true;
  if (
    process.env.MAIL_TO &&
    process.env.MAIL_SMTP_HOST &&
    process.env.MAIL_SMTP_USER &&
    process.env.MAIL_SMTP_PASS
  ) {
    return true;
  }
  return false;
}

function buildTransport() {
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.MAIL_SMTP_HOST) return 'smtp';
  return null;
}

function sendViaSendGrid({ to, from, subject, text, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const body = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: 'text/plain', value: text },
      ...(html ? [{ type: 'text/html', value: html }] : []),
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ sent: true, provider: 'sendgrid' });
          } else {
            reject(
              new Error(
                `SendGrid ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 300)}`
              )
            );
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendViaSmtp({ to, from, subject, text }) {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    throw new Error(
      'MAIL_SMTP_* set but nodemailer not installed. Run: npm install nodemailer'
    );
  }

  const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_SMTP_USER,
      pass: process.env.MAIL_SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({ from, to, subject, text });
  return { sent: true, provider: 'smtp', messageId: info.messageId };
}

async function sendMail({ subject, text, html, category = 'watch' }) {
  const to = process.env.MAIL_TO;
  const from = process.env.MAIL_FROM || process.env.MAIL_SMTP_USER || 'ads-watch@localhost';

  if (!to) {
    console.warn('[mailer] MAIL_TO not set — skipping email:', subject);
    return { sent: false, reason: 'MAIL_TO not set' };
  }

  const transport = buildTransport();
  if (!transport) {
    console.warn('[mailer] No SENDGRID_API_KEY or MAIL_SMTP_* — skipping:', subject);
    return { sent: false, reason: 'mail not configured' };
  }

  const prefix = process.env.MAIL_SUBJECT_PREFIX || '[Etsy Ads Watch]';
  const fullSubject = `${prefix} ${subject}`;

  try {
    if (transport === 'sendgrid') {
      return await sendViaSendGrid({ to, from, subject: fullSubject, text, html });
    }
    return await sendViaSmtp({ to, from, subject: fullSubject, text });
  } catch (err) {
    console.error('[mailer] Send failed:', err.message);
    return { sent: false, reason: err.message, category };
  }
}

async function notifySecretsMissing(missing) {
  return sendMail({
    subject: 'CRITICAL — Missing secrets / env',
    text:
      `The ads watch job could not start.\n\nMissing:\n${missing.map((m) => `  - ${m}`).join('\n')}\n\n` +
      `Fix GitHub Actions secrets or your .env file, then re-run.\n`,
    category: 'secrets',
  });
}

async function notifySessionExpired(detail) {
  return sendMail({
    subject: 'CRITICAL — Printify session expired',
    text:
      `Browser session is no longer valid.\n\n${detail}\n\n` +
      `Action required:\n` +
      `  1. Locally: cd etsy-offsite-ads && npm run login && npm run session:export\n` +
      `  2. Update PRINTIFY_SESSION_B64 in GitHub secrets (see scripts/sessionToBase64.js)\n`,
    category: 'session',
  });
}

async function notifyRunSummary(summary) {
  const lines = [
    `Mode: ${summary.mode}`,
    `Target ads: ${summary.targetEnable ? 'ON' : 'OFF'}`,
    `Shop: ${summary.shopId}`,
    `Catalog (Etsy): ${summary.catalogCount}`,
    `Queued: ${summary.queued}`,
    `Processed: ${summary.processed}`,
    `Changed: ${summary.changed}`,
    `Unchanged: ${summary.unchanged}`,
    `Failed: ${summary.failed}`,
    `Duration: ${summary.durationSec}s`,
  ];

  if (summary.failed > 0 && summary.failedIds?.length) {
    lines.push('', 'Failed product IDs (first 20):');
    summary.failedIds.slice(0, 20).forEach((id) => lines.push(`  - ${id}`));
  }

  const subject =
    summary.failed > 0
      ? `Run completed with ${summary.failed} failure(s)`
      : summary.queued === 0
        ? 'Run OK — no new products'
        : 'Run completed successfully';

  return sendMail({
    subject,
    text: lines.join('\n'),
    category: summary.failed > 0 ? 'failure' : 'success',
  });
}

module.exports = {
  isMailConfigured,
  sendMail,
  notifySecretsMissing,
  notifySessionExpired,
  notifyRunSummary,
};
