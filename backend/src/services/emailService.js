const nodemailer = require('nodemailer');
const { emailShell, ctaButton, money, BRAND, FRONTEND } = require('./emailTemplates');

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
};

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL) {
    console.warn('[email] SMTP not configured — skipped:', subject);
    return null;
  }
  const transporter = createTransporter();
  const mailOptions = {
    from: `${process.env.FROM_NAME || BRAND} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
    text: text || subject,
  };
  if (attachments?.length) mailOptions.attachments = attachments;

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error('[email] send failed:', err.message);
    throw err;
  }
};

const sendWelcomeEmail = async (user, verificationUrl) => {
  const html = emailShell({
    title: `Welcome to ${BRAND}`,
    preheader: 'Verify your email to start shopping.',
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Welcome, ${user.name}!</h2>
      <p style="margin:0 0 16px;line-height:1.6;color:#4b5563;">Thank you for joining ${BRAND}. Please verify your email to activate your account.</p>
      <div style="text-align:center;margin:28px 0;">${ctaButton(verificationUrl, 'Verify Email')}</div>
      <p style="margin:0;font-size:12px;color:#9ca3af;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    `,
  });
  return sendEmail({ to: user.email, subject: `Welcome to ${BRAND} — Verify Your Email`, html });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = emailShell({
    title: 'Reset your password',
    preheader: 'Password reset link inside.',
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Reset your password</h2>
      <p style="margin:0 0 16px;line-height:1.6;color:#4b5563;">Hi ${user.name}, we received a request to reset your password. Click below to continue:</p>
      <div style="text-align:center;margin:28px 0;">${ctaButton(resetUrl, 'Reset Password')}</div>
      <p style="margin:0;font-size:12px;color:#9ca3af;">This link expires in 15 minutes. If you did not request this, ignore this email — your password will stay the same.</p>
    `,
  });
  return sendEmail({ to: user.email, subject: `${BRAND} — Password Reset Request`, html });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${item.title}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">${money(item.subtotal)}</td>
      </tr>`
    )
    .join('');

  const html = emailShell({
    title: `Order #${order.orderNumber} confirmed`,
    preheader: `Thanks for your order — ${money(order.total)}`,
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Order confirmed</h2>
      <p style="margin:0 0 8px;line-height:1.6;color:#4b5563;">Hi ${user.name}, thank you for shopping with ${BRAND}.</p>
      <p style="margin:0 0 20px;"><strong>Order #${order.orderNumber}</strong></p>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#faf7f4;">
            <th style="padding:10px;text-align:left;font-size:12px;color:#6b7280;">Item</th>
            <th style="padding:10px;text-align:center;font-size:12px;color:#6b7280;">Qty</th>
            <th style="padding:10px;text-align:right;font-size:12px;color:#6b7280;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0 0;text-align:right;font-weight:600;">Order total</td>
            <td style="padding:14px 0 0;text-align:right;font-weight:700;font-size:16px;">${money(order.total)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="text-align:center;">${ctaButton(`${FRONTEND()}/orders/${order._id}`, 'View Order')}</div>
    `,
  });
  return sendEmail({ to: user.email, subject: `Order Confirmed — #${order.orderNumber}`, html });
};

const STATUS_COPY = {
  confirmed:  { title: 'Order confirmed',   line: 'We have confirmed your order and it will be processed shortly.' },
  processing: { title: 'Order processing',  line: 'Your order is being prepared by our team.' },
  shipped:    { title: 'Order shipped',     line: 'Great news — your order is on the way.' },
  delivered:  { title: 'Order delivered',   line: 'Your order has been delivered. We hope you love it.' },
  cancelled:  { title: 'Order cancelled',   line: 'Your order has been cancelled.' },
  returned:   { title: 'Order returned',    line: 'Your return request has been processed.' },
  refunded:   { title: 'Order refunded',    line: 'A refund has been issued for your order.' },
};

const sendOrderStatusEmail = async (user, order, status, comment = '') => {
  const copy = STATUS_COPY[status] || {
    title: `Order update: ${status}`,
    line: `Your order status is now “${status}”.`,
  };
  const html = emailShell({
    title: copy.title,
    preheader: `Order #${order.orderNumber} — ${status}`,
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">${copy.title}</h2>
      <p style="margin:0 0 8px;line-height:1.6;color:#4b5563;">Hi ${user.name},</p>
      <p style="margin:0 0 16px;line-height:1.6;color:#4b5563;">${copy.line}</p>
      <div style="background:#faf7f4;border-radius:12px;padding:16px 18px;margin:0 0 24px;">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Order number</p>
        <p style="margin:0;font-weight:700;font-size:16px;">#${order.orderNumber}</p>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">New status: <strong style="color:#111827;text-transform:capitalize;">${status}</strong></p>
        ${comment ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Note: ${comment}</p>` : ''}
      </div>
      <div style="text-align:center;">${ctaButton(`${FRONTEND()}/orders/${order._id}`, 'Track Order')}</div>
    `,
  });
  return sendEmail({
    to: user.email,
    subject: `${BRAND} — Order #${order.orderNumber} ${copy.title}`,
    html,
  });
};

const sendAdminBroadcastEmail = async (user, { title, message, link }) => {
  const html = emailShell({
    title: title || 'Notification',
    preheader: message?.slice(0, 80) || '',
    bodyHtml: `
      <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">${title || 'Notification'}</h2>
      <p style="margin:0 0 16px;line-height:1.7;color:#4b5563;white-space:pre-wrap;">${message || ''}</p>
      ${link ? `<div style="text-align:center;margin-top:24px;">${ctaButton(link, 'Open')}</div>` : ''}
    `,
  });
  return sendEmail({ to: user.email, subject: `${BRAND} — ${title || 'Notification'}`, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendAdminBroadcastEmail,
};
