const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'letsshare.donotreply@gmail.com',
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Helps with some cloud hosting environments
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: '"LetsShare" <letsshare.donotreply@gmail.com>',
      to,
      subject,
      text,
      html
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};

module.exports = { sendEmail };
