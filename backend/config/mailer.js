const nodemailer = require('nodemailer');

// Create transporter (using Gmail as example - configure for your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
    },
});

// For production, consider using SendGrid or Mailgun
/*
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
*/

// Test transporter
transporter.verify((error, success) => {
    if (error) {
        console.log('Mailer configuration error:', error);
    } else {
        console.log('Mailer is ready to send emails');
    }
});

module.exports = transporter;
