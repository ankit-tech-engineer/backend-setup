const nodemailer = require('nodemailer');
const { env } = require('../config/env.config');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  tls: {
    rejectUnauthorized: false, // Helps with some cloud network restrictions
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  family: 4, // Force IPv4 to resolve ENETUNREACH IPv6 errors
});


// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[Nodemailer] SMTP Connection Error:', error);
  } else {
    console.log('[Nodemailer] SMTP Server is ready to take messages');
  }
});

const sendMail = ({ to, subject, html }) =>
  transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });


module.exports = { sendMail };
