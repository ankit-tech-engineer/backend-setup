const nodemailer = require('nodemailer');
const dns = require('dns');

// Global override to prioritize IPv4 over IPv6
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { env } = require('../config/env.config');


const transporter = nodemailer.createTransport({
  // Hardcoded IPv4 for Gmail to bypass Render's broken DNS
  host: '173.194.76.108', 
  port: 587, // Port 587 is often more reliable on Render than 465
  secure: false, // secure:false is required for port 587
  pool: true,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  tls: {
    servername: 'smtp.gmail.com',
    rejectUnauthorized: false,
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
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
