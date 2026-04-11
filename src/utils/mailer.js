const nodemailer = require('nodemailer');
const { env } = require('../config/env.config');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { 
    user: env.SMTP_USER, 
    pass: env.SMTP_PASS 
  },
  pool: true,
  connectionTimeout: 10000,
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('[Nodemailer] SMTP Connection Error:', error);
  } else {
    console.log('[Nodemailer] SMTP Server is ready');
  }
});

const sendMail = ({ to, subject, html }) =>
  transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });

module.exports = { sendMail };
