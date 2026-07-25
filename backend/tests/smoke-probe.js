/* One-off smoke probe against the running dev server. Run: node tests/smoke-probe.js */
const BASE = 'http://localhost:8000/api';

let pass = 0, fail = 0;
const failures = [];

function check(name, cond, extra = '') {
  if (cond) { pass += 1; console.log(`  OK   ${name}`); }
  else { fail += 1; failures.push(name + (extra ? ` — ${extra}` : '')); console.log(`  FAIL ${name} ${extra}`); }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

(async () => {
  const stamp = Date.now();
  const custEmail = `probe.cust.${stamp}@example.com`;
  const staffEmail = `probe.staff.${stamp}@example.com`;
  let adminToken, custToken, staffToken, custId, staffId;

  console.log('\n— Public endpoints —');
  {
    const r = await req('GET', '/health');
    check('health', r.status === 200 && r.json?.success);
  }
  {
    const r = await req('GET', '/auth/google/client-id');
    check('google client-id enabled', r.status === 200 && r.json?.data?.enabled === true, JSON.stringify(r.json?.data));
  }
  {
    const r = await req('GET', '/auth/push/vapid-key');
    check('vapid public key', r.status === 200 && (r.json?.data?.publicKey || '').length > 40);
  }

  console.log('\n— Customer register/login —');
  {
    const r = await req('POST', '/auth/register', { body: { name: 'Probe Customer', email: custEmail, password: 'Probe@1234', phone: '9876543210' } });
    check('register customer', r.status === 201 && r.json?.token, `status=${r.status} ${r.json?.message || ''}`);
    custToken = r.json?.token;
    custId = r.json?.data?._id;
    check('referral code assigned', !!r.json?.data?.referralCode);
  }
  {
    const r = await req('GET', '/auth/me', { token: custToken });
    check('get me', r.status === 200);
  }
  {
    const r = await req('POST', '/auth/login', { body: { email: custEmail, password: 'Probe@1234' } });
    check('login customer', r.status === 200 && r.json?.token, `status=${r.status} ${r.json?.message || ''}`);
  }

  console.log('\n— Push subscribe/unsubscribe —');
  {
    const sub = { endpoint: `https://fcm.googleapis.com/fcm/send/probe-${stamp}`, keys: { p256dh: 'BProbeKey', auth: 'probeauth' } };
    const r = await req('POST', '/auth/push/subscribe', { token: custToken, body: { subscription: sub } });
    check('push subscribe', r.status === 200, `status=${r.status} ${r.json?.message || ''}`);
    const r2 = await req('POST', '/auth/push/unsubscribe', { token: custToken, body: { endpoint: sub.endpoint } });
    check('push unsubscribe', r2.status === 200);
  }

  console.log('\n— Admin login —');
  {
    const r = await req('POST', '/auth/login', { body: { email: 'admin@test.vkjewellers.com', password: 'VkAdmin@2026' } });
    check('admin login', r.status === 200 && r.json?.data?.role === 'admin', `status=${r.status} ${r.json?.message || ''}`);
    adminToken = r.json?.token;
  }

  if (adminToken) {
    console.log('\n— Admin: users & roles —');
    {
      const r = await req('GET', '/admin/users?limit=5', { token: adminToken });
      check('admin list users', r.status === 200);
    }
    {
      const r = await req('POST', '/admin/users', {
        token: adminToken,
        body: { name: 'Probe Staff', email: staffEmail, password: 'Staff@1234', role: 'child_admin', permissions: ['products', 'notifications', 'bogus_perm'] },
      });
      check('create staff', r.status === 201, `status=${r.status} ${r.json?.message || ''}`);
      staffId = r.json?.data?._id;
      const perms = r.json?.data?.permissions || [];
      check('invalid perm filtered on create', !perms.includes('bogus_perm'), JSON.stringify(perms));
      check('valid perms saved', perms.includes('products') && perms.includes('notifications'), JSON.stringify(perms));
    }
    {
      const r = await req('PUT', `/admin/users/${staffId}/permissions`, { token: adminToken, body: { permissions: ['products', 'support', 'nope'] } });
      const perms = r.json?.data?.permissions || [];
      check('update perms + filter invalid', r.status === 200 && perms.includes('support') && !perms.includes('nope'), JSON.stringify(perms));
      // restore
      await req('PUT', `/admin/users/${staffId}/permissions`, { token: adminToken, body: { permissions: ['products', 'notifications'] } });
    }

    console.log('\n— Staff permission gates —');
    {
      const r = await req('POST', '/auth/login', { body: { email: staffEmail, password: 'Staff@1234' } });
      check('staff login', r.status === 200 && r.json?.data?.role === 'child_admin', `status=${r.status} ${r.json?.message || ''}`);
      staffToken = r.json?.token;
    }
    {
      const r = await req('GET', '/admin/products?limit=2', { token: staffToken });
      check('staff CAN access products', r.status === 200, `status=${r.status}`);
    }
    {
      const r = await req('GET', '/admin/dashboard', { token: staffToken });
      check('staff CANNOT access dashboard', r.status === 403, `status=${r.status}`);
    }
    {
      const r = await req('GET', '/orders/admin/all?limit=1', { token: staffToken });
      check('staff CANNOT access orders', r.status === 403, `status=${r.status}`);
    }
    {
      const r = await req('GET', '/coupons/admin', { token: staffToken });
      check('staff CANNOT access coupons', r.status === 403, `status=${r.status}`);
    }
    {
      const r = await req('GET', '/admin/notifications', { token: staffToken });
      check('staff CAN access notifications', r.status === 200, `status=${r.status}`);
    }
    {
      const r = await req('GET', '/admin/users?limit=2', { token: staffToken });
      check('staff blocked from users list (no customers perm)', r.status === 403, `status=${r.status}`);
    }
    {
      // customer must never reach admin
      const r = await req('GET', '/admin/products', { token: custToken });
      check('customer blocked from admin', r.status === 403, `status=${r.status}`);
    }

    console.log('\n— Browser notifications (admin) —');
    {
      const r = await req('POST', '/admin/notifications/send', { token: adminToken, body: { title: 'Probe test', message: 'Smoke probe notification', audience: 'staff' } });
      check('admin send notification', r.status === 200, `status=${r.status} ${r.json?.message || ''}`);
    }
    {
      const r = await req('POST', '/admin/notifications/send', { token: adminToken, body: { title: '', message: '' } });
      check('send validation rejects empty', r.status === 400, `status=${r.status}`);
    }
    {
      const r = await req('GET', '/admin/notifications', { token: adminToken });
      const items = r.json?.data?.items || [];
      check('notification history has entry', r.status === 200 && items.some((i) => i.title === 'Probe test'), `count=${items.length}`);
    }

    console.log('\n— Cleanup —');
    {
      const r1 = await req('DELETE', `/admin/users/${staffId}`, { token: adminToken });
      check('delete probe staff', r1.status === 200, `status=${r1.status}`);
      const r2 = await req('DELETE', `/admin/users/${custId}`, { token: adminToken });
      check('delete probe customer', r2.status === 200, `status=${r2.status}`);
    }
  } else {
    console.log('  SKIP admin-dependent tests (admin login failed)');
  }

  console.log(`\n===== RESULT: ${pass} passed, ${fail} failed =====`);
  if (failures.length) {
    console.log('Failures:');
    failures.forEach((f) => console.log(' -', f));
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('PROBE CRASHED:', e.message); process.exit(2); });
