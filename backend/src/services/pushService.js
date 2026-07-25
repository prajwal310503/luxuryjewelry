const webpush = require('web-push');
const { PushSubscription, BrowserNotification } = require('../models/BrowserNotification');
const User = require('../models/User');
const { sendAdminBroadcastEmail } = require('./emailService');

function ensureVapid() {
  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
    console.warn('[push] VAPID keys auto-generated for this process. Set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env for persistence.');
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:no-reply@royalbutterfly.in',
    publicKey,
    privateKey
  );
  return { publicKey, privateKey };
}

ensureVapid();

function getVapidPublicKey() {
  return ensureVapid().publicKey;
}

async function saveSubscription(userId, subscription, userAgent = '') {
  const endpoint = subscription?.endpoint;
  if (!endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid push subscription');
  }
  return PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      user: userId,
      endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent,
    },
    { upsert: true, new: true }
  );
}

async function removeSubscription(endpoint) {
  if (!endpoint) return;
  await PushSubscription.deleteOne({ endpoint });
}

async function audienceUserFilter(audience, targetUser) {
  if (audience === 'user' && targetUser) return { _id: targetUser, isActive: true };
  if (audience === 'customers') return { role: 'customer', isActive: true };
  if (audience === 'vendors') return { role: 'vendor', isActive: true };
  if (audience === 'staff') return { role: { $in: ['admin', 'child_admin'] }, isActive: true };
  return { isActive: true };
}

async function sendBrowserNotification({
  title,
  message,
  link = '',
  audience = 'customers',
  targetUser = null,
  sentBy = null,
  emailAlso = false,
}) {
  ensureVapid();
  const userFilter = await audienceUserFilter(audience, targetUser);
  const users = await User.find(userFilter).select('_id email name').lean();
  const userIds = users.map((u) => u._id);

  const subs = await PushSubscription.find({ user: { $in: userIds } });
  const payload = JSON.stringify({
    title,
    body: message,
    url: link || '/',
  });

  let sentCount = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
        sentCount += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );

  if (emailAlso) {
    await Promise.allSettled(
      users.map((u) => sendAdminBroadcastEmail(u, { title, message, link }).catch(() => null))
    );
  }

  const doc = await BrowserNotification.create({
    title,
    message,
    link,
    audience,
    targetUser: audience === 'user' ? targetUser : null,
    sentBy,
    sentCount,
    emailAlso,
  });

  return { notification: doc, sentCount, audienceSize: users.length };
}

module.exports = {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  sendBrowserNotification,
};
