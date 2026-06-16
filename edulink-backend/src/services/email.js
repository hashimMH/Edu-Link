const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Check if email is configured
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Email] SMTP configured:', process.env.SMTP_HOST);
  } else if (process.env.SENDGRID_API_KEY) {
    // SendGrid fallback
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    });
    console.log('[Email] SendGrid configured');
  } else {
    // Dev mode: use Ethereal (fake SMTP for testing)
    console.log('[Email] No SMTP configured — using Ethereal test account');
    nodemailer.createTestAccount().then(account => {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: account.user, pass: account.pass },
      });
      console.log('[Email] Ethereal account:', account.user);
    });
    return null;
  }

  return transporter;
}

/**
 * Send an email
 * @param {object} options - { to, subject, html }
 * @returns {object} info from nodemailer
 */
async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Email] Not configured — skipping email to:', to);
      console.log('[Email] Subject:', subject);
    }
    return null;
  }

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"EduLink" <noreply@edulink.app>',
    to,
    subject,
    html,
  });

  // Log Ethereal preview URL in dev
  if (info.messageId && (!process.env.SMTP_HOST)) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('[Email] Preview:', previewUrl);
  }

  return info;
}

module.exports = { sendEmail };
