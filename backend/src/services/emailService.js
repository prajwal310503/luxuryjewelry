const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

const sendWelcomeEmail = async (user, verificationUrl) => {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5a413f; padding: 30px; text-align: center;">
        <h1 style="color: white; font-family: 'Playfair Display', serif; margin: 0;">VK Jewellers</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2>Welcome, ${user.name}!</h2>
        <p>Thank you for joining VK Jewellers Marketplace.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; background: #5a413f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Welcome to VK Jewellers — Verify Your Email', html });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5a413f; padding: 30px; text-align: center;">
        <h1 style="color: white; font-family: 'Playfair Display', serif; margin: 0;">VK Jewellers</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #5a413f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 12px;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'VK Jewellers — Password Reset Request', html });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.subtotal.toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5a413f; padding: 30px; text-align: center;">
        <h1 style="color: white; font-family: 'Playfair Display', serif; margin: 0;">VK Jewellers</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2>Order Confirmed!</h2>
        <p>Thank you for your order, ${user.name}.</p>
        <p><strong>Order #${order.orderNumber}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>₹${order.total.toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `Order Confirmed — #${order.orderNumber}`, html });
};

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
