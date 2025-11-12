// utils/emailService.js
require('dotenv').config();

const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  PASSWORD_RESET_URL,
  FRONTEND_URL,
  APP_URL
} = process.env;

const EMAIL_ENABLED = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;

if (EMAIL_ENABLED) {
  try {
    const port = Number(SMTP_PORT);
    const secure =
      typeof SMTP_SECURE === 'string'
        ? SMTP_SECURE.toLowerCase() === 'true'
        : port === 465;

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    transporter.verify().catch((err) => {
      console.warn('⚠️  Email transporter verification failed:', err.message);
    });
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error);
    transporter = null;
  }
}

function isEmailConfigured() {
  return Boolean(transporter);
}

function buildResetUrl(token, role) {
  const baseUrl =
    PASSWORD_RESET_URL ||
    FRONTEND_URL ||
    APP_URL ||
    'http://localhost:3000/reset-password';

  const separator = baseUrl.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    token
  });

  if (role) {
    params.append('role', role);
  }

  return `${baseUrl}${separator}${params.toString()}`;
}

async function sendPasswordResetEmail(email, token, role) {
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const resetUrl = buildResetUrl(token, role);
  const fromAddress = MAIL_FROM || SMTP_USER;

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Reset your Phambili password',
    text: [
      'You requested to reset your Phambili account password.',
      'If this was you, please click the link below or paste it into your browser:',
      '',
      resetUrl,
      '',
      'If you did not request a password reset, you can safely ignore this email.'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="color: #1d4ed8; margin-bottom: 16px;">Reset your password</h2>
        <p>We received a request to reset the password for your Phambili account.</p>
        <p>If you made this request, click the button below to choose a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #1d4ed8; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #1e293b;">${resetUrl}</p>
        <p style="margin-top: 32px;">If you didn’t request this change, you can safely ignore this email.</p>
        <p style="color: #64748b;">This link will expire soon for your security.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);

  return {
    sent: true,
    resetUrl
  };
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
  buildResetUrl
};

