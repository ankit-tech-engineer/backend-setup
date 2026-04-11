const nodemailer = require('nodemailer');
const { env } = require('../config/env.config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  family: 4, // Still force IPv4
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
