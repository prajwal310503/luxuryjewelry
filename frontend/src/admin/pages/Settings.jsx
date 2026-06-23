import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsAPI, pincodeAPI } from '../../services/api';

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
      { name: 'store_name',    label: 'Store Name',    type: 'text',  placeholder: 'LUXURY JEWELRY' },
      { name: 'currency',      label: 'Currency Code', type: 'text',  placeholder: 'INR', hint: 'ISO 4217 — e.g. INR, USD, EUR' },
      { name: 'currency_symbol', label: 'Currency Symbol', type: 'text', placeholder: '₹' },
      { name: 'support_email', label: 'Support Email', type: 'email', placeholder: 'support@yourstore.com' },
      { name: 'support_phone', label: 'Support Phone', type: 'text',  placeholder: '+91 98765 43210' },
    ],
  },
  {
    id: 'pincodes',
    label: 'Pincodes',
    statusKey: null,
    icon: <I d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" d2="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
    description: 'Upload an Excel file of serviceable pincodes for delivery check.',
    docsUrl: null,
    fields: [],
  },
  {
    id: 'siteImages',
    label: 'Site Images',
    statusKey: null,
    icon: <I d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    description: 'Page banner images shown on desktop and mobile.',
    docsUrl: null,
    fields: [],
  },
];

export default function AdminSettings() {
  const [status, setStatus] = useState({});
  const [forms, setForms] = useState({});
  const [saving, setSaving] = useState({});
  const [activeTab, setActiveTab] = useState('cloudinary');
  const [siteImages, setSiteImages] = useState({});
  const [uploadingImg, setUploadingImg] = useState({});
  const [pincodeCount, setPincodeCount] = useState(null);
  const [uploadingPincodes, setUploadingPincodes] = useState(false);
  const desktopRef  = useRef(null);
  const mobileRef   = useRef(null);
  const pincodeRef  = useRef(null);

  const loadSiteImages = () =>
    settingsAPI.getSiteImages().then((r) => setSiteImages(r.data.data || {})).catch(() => {});

  useEffect(() => {
    settingsAPI.getStatus()
      .then((r) => setStatus(r.data.data || {}))
      .catch(() => {});

    settingsAPI.getAll()
      .then((r) => {
        const data = r.data.data || {};
        const init = {};
        GROUPS.forEach(({ id }) => { init[id] = data[id] || {}; });
        setForms(init);
      })
      .catch(() => {});

    loadSiteImages();
    pincodeAPI.adminGetStats().then((r) => setPincodeCount(r.data.count ?? 0)).catch(() => {});
  }, []);

  const handleSiteImageUpload = async (key, file) => {
    if (!file) return;
    setUploadingImg((p) => ({ ...p, [key]: true }));
    try {
      await settingsAPI.uploadSiteImage(key, file);
      await loadSiteImages();
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingImg((p) => ({ ...p, [key]: false }));
    }
  };

  const handlePincodeUpload = async (file) => {
    if (!file) return;
    setUploadingPincodes(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await pincodeAPI.adminUpload(fd);
      toast.success(data.message || 'Pincodes uploaded');
      const r = await pincodeAPI.adminGetStats();
      setPincodeCount(r.data.count ?? 0);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingPincodes(false);
      if (pincodeRef.current) pincodeRef.current.value = '';
    }
  };

  const handlePincodeClear = async () => {
    if (!window.confirm('Clear ALL serviceable pincodes? Users will see all areas as available.')) return;
    try {
      await pincodeAPI.adminClear();
      setPincodeCount(0);
      toast.success('Pincodes cleared');
    } catch (err) {
      toast.error(err.message || 'Failed to clear');
    }
  };

  const handleSiteImageDelete = async (key) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await settingsAPI.deleteSiteImage(key);
      await loadSiteImages();
      toast.success('Image removed');
    } catch (err) {
      toast.error(err.message || 'Failed to remove');
    }
  };

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

            {/* Pincodes — custom UI */}
            {active.id === 'pincodes' ? (
              <div className="space-y-5">
                {/* Stats card */}
                <div className="flex items-center gap-4 bg-[#fdf8f5] border border-[#eedfd8] rounded-2xl p-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">
                      {pincodeCount === null ? 'Loading…' : pincodeCount === 0 ? 'No pincodes uploaded' : `${pincodeCount.toLocaleString()} serviceable pincodes`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pincodeCount === 0
                        ? 'When no pincodes are set, all areas show as available.'
                        : 'Only these pincodes will show delivery as available on product pages.'}
                    </p>
                  </div>
                  {pincodeCount > 0 && (
                    <button
                      onClick={handlePincodeClear}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 bg-white px-3 py-2 rounded-xl transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </button>
                  )}
                </div>

                {/* Upload section */}
                <div className="border border-gray-100 rounded-2xl p-5">
                  <p className="label-luxury mb-1">Upload Pincodes File</p>
                  <p className="text-[11px] text-gray-400 mb-4">
                    Upload an Excel (.xlsx / .xls) or CSV file. Any column with 6-digit numbers will be treated as pincodes.
                    New pincodes are <strong>added</strong> to existing ones — existing records are preserved.
                  </p>

                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 py-10 bg-gray-50 cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all"
                    onClick={() => pincodeRef.current?.click()}
                  >
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Click to select Excel / CSV file</p>
                      <p className="text-xs text-gray-400 mt-1">Max 5 MB · .xlsx, .xls, .csv</p>
                    </div>
                  </div>

                  <input
                    ref={pincodeRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handlePincodeUpload(e.target.files[0])}
                  />

                  <button
                    onClick={() => pincodeRef.current?.click()}
                    disabled={uploadingPincodes}
                    className="btn-primary mt-4 flex items-center gap-2"
                  >
                    {uploadingPincodes ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Pincodes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : active.id === 'siteImages' ? (
              <div className="space-y-6">
                {[
                  { key: 'categoryBannerDesktop', label: 'Category Header — Desktop', hint: 'Shown on screens ≥ 768 px. Recommended: 1440 × 320 px', ref: desktopRef },
                  { key: 'categoryBannerMobile',  label: 'Category Header — Mobile',  hint: 'Shown on screens < 768 px. Recommended: 768 × 400 px',  ref: mobileRef  },
                ].map(({ key, label, hint, ref }) => (
                  <div key={key} className="border border-gray-100 rounded-2xl p-5">
                    <p className="label-luxury mb-1">{label}</p>
                    <p className="text-[11px] text-gray-400 mb-3">{hint}</p>

                    {siteImages[key] ? (
                      <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-3" style={{ height: 140 }}>
                        <img src={siteImages[key]} alt={label} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleSiteImageDelete(key)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center mb-3" style={{ height: 120 }}>
                        <p className="text-sm text-gray-400">No image set — gradient shown</p>
                      </div>
                    )}

                    <input
                      ref={ref}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSiteImageUpload(key, e.target.files[0])}
                    />
                    <button
                      onClick={() => ref.current?.click()}
                      disabled={uploadingImg[key]}
                      className="btn-outline text-sm flex items-center gap-2"
                    >
                      {uploadingImg[key] ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      {uploadingImg[key] ? 'Uploading…' : siteImages[key] ? 'Replace Image' : 'Upload Image'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Standard text fields */}
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
