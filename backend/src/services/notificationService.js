const { sendEmail } = require('./emailService');
const { emailShell: brandedShell, ctaButton, BRAND } = require('./emailTemplates');
const { generateInvoiceBuffer } = require('./invoiceService');

const frontendBase = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function orderDetailUrl(orderId) {
  return `${frontendBase()}/orders/${orderId}`;
}

function ordersListUrl() {
  return `${frontendBase()}/orders`;
}

function normalizeIndianPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

function formatInr(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function emailShell(title, bodyHtml) {
  return brandedShell({ title, preheader: title, bodyHtml });
}

function orderItemsTable(order) {
  const rows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatInr(item.subtotal || item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f9f9f9;">
          <th style="padding: 10px; text-align: left;">Item</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 10px; text-align: right;"><strong>${formatInr(order.total)}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;
}

function actionLinks(detailLink, listLink, extraHtml = '') {
  return `
    <div style="margin: 28px 0; text-align: center;">
      ${extraHtml || ''}
      <div style="margin: 8px 0;">${ctaButton(detailLink, 'View Order')}</div>
      <div style="margin: 8px 0;">${ctaButton(listLink, 'Order History')}</div>
    </div>
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Invoice PDF is attached. You can also download it from Order History on ${BRAND}.</p>
  `;
}

async function buildInvoiceAttachment(order, user) {
  try {
    const buffer = await generateInvoiceBuffer(order, user);
    return [{
      filename: `invoice-${order.orderNumber}.pdf`,
      content: buffer,
      contentType: 'application/pdf',
    }];
  } catch (err) {
    console.error('[Invoice attachment failed]', err.message);
    return [];
  }
}

function buildPartialPaymentMessage(order) {
  const remaining = Math.max(0, (order.total || 0) - (order.payment?.amount || 0));
  const payLink = orderDetailUrl(order._id);
  const listLink = ordersListUrl();
  return {
    remaining,
    payLink,
    listLink,
    smsText: `VK Jewellers: Order #${order.orderNumber} confirmed (50% paid ${formatInr(order.payment?.amount || 0)}). Pay remaining ${formatInr(remaining)} to dispatch. Order: ${payLink} | History: ${listLink} | Invoice in email.`,
  };
}

function buildOrderConfirmedMessage(order) {
  const detailLink = orderDetailUrl(order._id);
  const listLink = ordersListUrl();
  return {
    detailLink,
    listLink,
    smsText: `VK Jewellers: Order #${order.orderNumber} confirmed! Total ${formatInr(order.total)}. View: ${detailLink} | Order History: ${listLink} | Invoice attached in email.`,
  };
}

function buildPaymentCompleteMessage(order) {
  const detailLink = orderDetailUrl(order._id);
  const listLink = ordersListUrl();
  return {
    detailLink,
    listLink,
    smsText: `VK Jewellers: Payment complete for Order #${order.orderNumber}. Total ${formatInr(order.total)} received. Your order will dispatch soon. View: ${detailLink} | History: ${listLink}`,
  };
}

async function sendSMS(phone, message) {
  const mobile = normalizeIndianPhone(phone);
  if (!mobile) return { channel: 'sms', sent: false, reason: 'no_phone' };

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.log(`[SMS → ${mobile}] ${message}`);
    return { channel: 'sms', sent: false, reason: 'not_configured', preview: message };
  }

  try {
    const params = new URLSearchParams({
      authkey: authKey,
      mobiles: mobile,
      message,
      sender: process.env.MSG91_SENDER_ID || 'VKJWLR',
      route: '4',
      country: '91',
    });
    const res = await fetch(`https://api.msg91.com/api/sendhttp.php?${params.toString()}`);
    const body = await res.text();
    return { channel: 'sms', sent: res.ok, response: body };
  } catch (err) {
    console.error('[SMS error]', err.message);
    return { channel: 'sms', sent: false, error: err.message };
  }
}

async function sendWhatsApp(phone, message) {
  const mobile = normalizeIndianPhone(phone);
  if (!mobile) return { channel: 'whatsapp', sent: false, reason: 'no_phone' };

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.log(`[WhatsApp → ${mobile}] ${message}`);
    return { channel: 'whatsapp', sent: false, reason: 'not_configured', preview: message };
  }

  try {
    const to = mobile.startsWith('+') ? mobile : `+${mobile}`;
    const body = new URLSearchParams({
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      To: `whatsapp:${to}`,
      Body: message,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const data = await res.json().catch(() => ({}));
    return { channel: 'whatsapp', sent: res.ok, response: data };
  } catch (err) {
    console.error('[WhatsApp error]', err.message);
    return { channel: 'whatsapp', sent: false, error: err.message };
  }
}

async function sendAllChannels({ user, order, phone, smsText, subject, html, text }) {
  const attachments = await buildInvoiceAttachment(order, user);
  const results = await Promise.allSettled([
    user.email
      ? sendEmail({ to: user.email, subject, html, text: text || smsText, attachments })
          .then(() => ({ channel: 'email', sent: true }))
      : Promise.resolve({ channel: 'email', sent: false, reason: 'no_email' }),
    sendSMS(phone, smsText),
    sendWhatsApp(phone, smsText),
  ]);
  return results.map((r) => (r.status === 'fulfilled' ? r.value : { sent: false, error: r.reason?.message }));
}

/** Order placed — full or partial payment (email + WhatsApp + SMS + invoice PDF) */
async function sendOrderPlacedNotifications(user, order) {
  const phone = order.shippingAddress?.phone || user.phone;
  const detailLink = orderDetailUrl(order._id);
  const listLink = ordersListUrl();
  const isPartial = order.payment?.status === 'partial';

  if (isPartial) {
    const msg = buildPartialPaymentMessage(order);
    const payBtn = `<a href="${msg.payLink}" style="display: inline-block; background: #b45309; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 8px 12px;">Pay Remaining 50%</a>`;
    const html = emailShell(
      'Order Confirmed — 50% Payment Pending',
      `
        <h2 style="color: #1f2937;">Order Confirmed!</h2>
        <p>Hi ${user.name || 'Customer'},</p>
        <p>Your order <strong>#${order.orderNumber}</strong> is confirmed with <strong>50% payment</strong> (${formatInr(order.payment?.amount || 0)}).</p>
        <p style="font-size: 16px; color: #b45309; font-weight: 600;">Remaining: ${formatInr(msg.remaining)} — pay to dispatch</p>
        ${orderItemsTable(order)}
        ${actionLinks(detailLink, listLink, payBtn)}
      `
    );
    return sendAllChannels({
      user,
      order,
      phone,
      smsText: msg.smsText,
      subject: `Order #${order.orderNumber} — Pay remaining 50% (Invoice attached)`,
      html,
      text: msg.smsText,
    });
  }

  const msg = buildOrderConfirmedMessage(order);
  const html = emailShell(
    'Order Confirmed',
    `
      <h2 style="color: #1f2937;">Order Confirmed!</h2>
      <p>Hi ${user.name || 'Customer'},</p>
      <p>Thank you for your order <strong>#${order.orderNumber}</strong>.</p>
      ${orderItemsTable(order)}
      ${actionLinks(msg.detailLink, msg.listLink)}
    `
  );
  return sendAllChannels({
    user,
    order,
    phone,
    smsText: msg.smsText,
    subject: `Order Confirmed — #${order.orderNumber} (Invoice attached)`,
    html,
    text: msg.smsText,
  });
}

/** Remaining 50% paid — notify all channels */
async function sendPaymentCompleteNotifications(user, order) {
  const phone = order.shippingAddress?.phone || user.phone;
  const msg = buildPaymentCompleteMessage(order);
  const html = emailShell(
    'Payment Complete',
    `
      <h2 style="color: #1f2937;">Payment Complete!</h2>
      <p>Hi ${user.name || 'Customer'},</p>
      <p>Full payment received for order <strong>#${order.orderNumber}</strong>.</p>
      <p style="color: #16a34a; font-weight: 600;">Your order will be dispatched soon.</p>
      ${orderItemsTable(order)}
      ${actionLinks(msg.detailLink, msg.listLink)}
    `
  );
  return sendAllChannels({
    user,
    order,
    phone,
    smsText: msg.smsText,
    subject: `Payment Complete — Order #${order.orderNumber}`,
    html,
    text: msg.smsText,
  });
}

/** @deprecated use sendOrderPlacedNotifications */
async function sendPartialPaymentReminder(user, order) {
  return sendOrderPlacedNotifications(user, order);
}

module.exports = {
  sendOrderPlacedNotifications,
  sendPaymentCompleteNotifications,
  sendPartialPaymentReminder,
  sendSMS,
  sendWhatsApp,
  orderDetailUrl,
  ordersListUrl,
  buildPartialPaymentMessage,
};
