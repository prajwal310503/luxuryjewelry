import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../services/api';

// ── Icon helper ────────────────────────────────────────────────────────────────
const I = ({ d, d2, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

// ── Status badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ ok }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
    ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-amber-500'}`} />
    {ok ? 'Configured' : 'Not Configured'}
  </span>
);

// ── Field component ────────────────────────────────────────────────────────────
const Field = ({ label, name, type = 'text', placeholder, value, onChange, hint }) => (
  <div>
    <label className="label-luxury">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      className="input-luxury"
    />
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

// ── Section groups ─────────────────────────────────────────────────────────────
const GROUPS = [
  {
    id: 'cloudinary',
    label: 'Cloudinary',
    statusKey: 'cloudinary',
    icon: <I d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    description: 'Image upload & CDN for product photos, banners, and avatars.',
    docsUrl: 'https://cloudinary.com/console',
    fields: [
      { name: 'cloud_name',  label: 'Cloud Name',  type: 'text',     placeholder: 'e.g. my-cloud' },
      { name: 'api_key',     label: 'API Key',     type: 'text',     placeholder: 'Enter API key' },
      { name: 'api_secret',  label: 'API Secret',  type: 'password', placeholder: 'Enter API secret' },
    ],
  },
  {
    id: 'stripe',
    label: 'Stripe',
    statusKey: 'stripe',
    icon: <I d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    description: 'International card payments via Stripe.',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [
      { name: 'secret_key',      label: 'Secret Key',      type: 'password', placeholder: 'sk_live_...' },
      { name: 'webhook_secret',  label: 'Webhook Secret',  type: 'password', placeholder: 'whsec_...' },
    ],
  },
  {
    id: 'razorpay',
    label: 'Razorpay',
    statusKey: 'razorpay',
    icon: <I d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    description: 'Indian payment gateway for UPI, Net Banking, Cards.',
    docsUrl: 'https://dashboard.razorpay.com/app/keys',
    fields: [
      { name: 'key_id',     label: 'Key ID',     type: 'text',     placeholder: 'rzp_live_...' },
      { name: 'key_secret', label: 'Key Secret', type: 'password', placeholder: 'Enter key secret' },
    ],
  },
  {
    id: 'smtp',
    label: 'Email / SMTP',
    statusKey: 'smtp',
    icon: <I d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    description: 'Transactional emails — order confirmations, password resets.',
    docsUrl: null,
    fields: [
      { name: 'host',     label: 'SMTP Host',  type: 'text', placeholder: 'smtp.gmail.com' },
      { name: 'port',     label: 'SMTP Port',  type: 'text', placeholder: '587' },
      { name: 'email',    label: 'From Email', type: 'email', placeholder: 'noreply@yourstore.com' },
      { name: 'password', label: 'Password / App Password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  {
    id: 'general',
    label: 'General',
    statusKey: null,
    icon: <I d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    description: 'Store-wide settings — name, currency, contact info.',
    docsUrl: null,
    fields: [
      { name: 'store_name',    label: 'Store Name',    type: 'text',  placeholder: 'Luxury Jewelry' },
      { name: 'currency',      label: 'Currency Code', type: 'text',  placeholder: 'INR', hint: 'ISO 4217 — e.g. INR, USD, EUR' },
      { name: 'currency_symbol', label: 'Currency Symbol', type: 'text', placeholder: '₹' },
      { name: 'support_email', label: 'Support Email', type: 'email', placeholder: 'support@yourstore.com' },
      { name: 'support_phone', label: 'Support Phone', type: 'text',  placeholder: '+91 98765 43210' },
    ],
  },
];

export default function AdminSettings() {
  const [status, setStatus] = useState({});
  const [forms, setForms] = useState({});
  const [saving, setSaving] = useState({});
  const [activeTab, setActiveTab] = useState('cloudinary');

  useEffect(() => {
    // Load status
    settingsAPI.getStatus()
      .then((r) => setStatus(r.data.data || {}))
      .catch(() => {});

    // Load saved settings (masked values pre-filled)
    settingsAPI.getAll()
      .then((r) => {
        const data = r.data.data || {};
        const init = {};
        GROUPS.forEach(({ id }) => {
          init[id] = data[id] || {};
        });
        setForms(init);
      })
      .catch(() => {});
  }, []);

  const handleChange = (group, name, value) => {
    setForms((prev) => ({ ...prev, [group]: { ...(prev[group] || {}), [name]: value } }));
  };

  const handleSave = async (group) => {
    setSaving((p) => ({ ...p, [group]: true }));
    try {
      await settingsAPI.update(group, forms[group] || {});
      toast.success('Settings saved and applied.');
      // Refresh status
      const r = await settingsAPI.getStatus();
      setStatus(r.data.data || {});
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving((p) => ({ ...p, [group]: false }));
    }
  };

  const active = GROUPS.find((g) => g.id === activeTab);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage API integrations, payment gateways, and store configuration.</p>
      </div>

      {/* Notice */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-green-700 leading-relaxed">
          Credentials are applied <strong>immediately</strong> — no server restart needed. To make them permanent across restarts, also update your <code className="bg-green-100 px-1 rounded">backend/.env</code> file.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === g.id
                  ? 'bg-primary/8 text-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={activeTab === g.id ? 'text-primary' : 'text-gray-400'}>{g.icon}</span>
              <span className="flex-1">{g.label}</span>
              {g.statusKey && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status[g.statusKey] ? 'bg-green-500' : 'bg-amber-400'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Content panel */}
        {active && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">
            {/* Panel header */}
            <div className="flex items-start justify-between mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary flex-shrink-0">
                  {active.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-bold text-gray-900 text-base">{active.label}</h2>
                    {active.statusKey && <StatusBadge ok={status[active.statusKey]} />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{active.description}</p>
                </div>
              </div>
              {active.docsUrl && (
                <a
                  href={active.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Get Keys
                </a>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {active.fields.map((f) => (
                <Field
                  key={f.name}
                  label={f.label}
                  name={f.name}
                  type={f.type}
                  placeholder={f.placeholder}
                  hint={f.hint}
                  value={forms[active.id]?.[f.name] || ''}
                  onChange={(e) => handleChange(active.id, f.name, e.target.value)}
                />
              ))}
            </div>

            {/* Save */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => handleSave(active.id)}
                disabled={saving[active.id]}
                className="btn-primary min-w-[130px] flex items-center justify-center gap-2"
              >
                {saving[active.id] ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save {active.label}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
