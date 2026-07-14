import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../services/api';

const BUSINESS_TYPES = [
  'Jewellery Manufacturer',
  'Jewellery Retailer',
  'Jewellery Wholesaler',
  'Designer Jewellery',
  'Online Jewellery Brand',
  'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

const Field = ({ label, children, required }) => (
  <div>
    <label className="label-luxury mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
    {children}
  </div>
);

function PoliciesPanel() {
  return (
    <aside className="rounded-xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-950 space-y-3 lg:sticky lg:top-4">
      <p className="font-bold text-base">Policies &amp; Seller Terms</p>
      <div>
        <p className="font-semibold text-xs uppercase tracking-wider text-amber-800 mb-1">Listing &amp; products</p>
        <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed">
          <li>Only genuine jewellery may be listed. Fake or mislabelled items may lead to suspension.</li>
          <li>Products go <strong>live only after admin approval</strong>.</li>
          <li>No separate vendor storefront — customers buy directly on VK Jewellers.</li>
        </ul>
      </div>
      <div>
        <p className="font-semibold text-xs uppercase tracking-wider text-amber-800 mb-1">Commission &amp; payouts</p>
        <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed">
          <li>Commission is set <strong>per category</strong> by admin (shown on Add Product).</li>
          <li>Cut from your payout — <strong>never added</strong> to customer price.</li>
          <li>GST &amp; delivery (if any) are separate from platform fee.</li>
        </ul>
      </div>
      <div>
        <p className="font-semibold text-xs uppercase tracking-wider text-amber-800 mb-1">Orders &amp; fulfilment</p>
        <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed">
          <li>Update order status / tracking in My Orders promptly.</li>
          <li>Partial-payment orders: ship only after full payment.</li>
          <li>You handle GST invoices and authenticity where applicable.</li>
        </ul>
      </div>
      <div>
        <p className="font-semibold text-xs uppercase tracking-wider text-amber-800 mb-1">Account</p>
        <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed">
          <li>Admin may suspend accounts for policy violations.</li>
          <li>Coupons are managed by platform admin — vendors cannot create them.</li>
        </ul>
      </div>
    </aside>
  );
}

export default function VendorKyc() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kyc, setKyc] = useState({ status: 'incomplete' });
  const [vendorStatus, setVendorStatus] = useState('pending');
  const [form, setForm] = useState({
    businessType: '',
    gstNumber: '',
    panNumber: '',
    aadhaarNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
    agreeTerms: false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    vendorAPI.getKyc()
      .then(({ data }) => {
        const d = data.data || {};
        setKyc(d.kyc || { status: 'incomplete' });
        setVendorStatus(d.vendorStatus || 'pending');
        const vd = d.vendorDetails || {};
        setForm((f) => ({
          ...f,
          businessType: vd.businessType || '',
          gstNumber: vd.gstNumber || '',
          panNumber: vd.panNumber || '',
          aadhaarNumber: vd.aadhaarNumber || '',
          businessAddress: vd.businessAddress || '',
          city: vd.city || '',
          state: vd.state || '',
          pincode: vd.pincode || '',
          bankName: vd.bankName || '',
          accountNumber: vd.accountNumber || '',
          ifscCode: vd.ifscCode || '',
          accountHolder: vd.accountHolder || '',
        }));
      })
      .catch(() => toast.error('Failed to load KYC'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreeTerms) return toast.error('Accept seller Terms & Conditions');
    setSaving(true);
    try {
      const { data } = await vendorAPI.submitKyc({ ...form, agreeTerms: true });
      setKyc(data.data?.kyc || { status: 'submitted' });
      toast.success('KYC submitted for admin review');
    } catch (err) {
      toast.error(err?.message || 'KYC submit failed');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = {
    incomplete: 'bg-amber-100 text-amber-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }[kyc.status] || 'bg-gray-100 text-gray-600';

  const locked = kyc.status === 'submitted' || kyc.status === 'approved' || vendorStatus === 'approved';
  const canEdit = !locked || kyc.status === 'rejected';

  return (
    <VendorLayout>
      <div className="max-w-6xl mx-auto space-y-5 p-1">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">KYC, Policies &amp; Terms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete business, bank &amp; document details, and read marketplace policies before selling.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge}`}>
            KYC: {kyc.status}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Account: {vendorStatus}
          </span>
        </div>

        {kyc.status === 'rejected' && kyc.rejectionReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Rejected: {kyc.rejectionReason}. Update details and re-submit.
          </div>
        )}

        {kyc.status === 'approved' && vendorStatus === 'approved' && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            You&apos;re approved! <Link to="/vendor/products/add" className="font-bold underline">Add products</Link> — they go live after admin product approval.
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left — KYC form */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 card-luxury p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Business details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business type" required>
                  <select className="input-luxury w-full" disabled={!canEdit} value={form.businessType} onChange={(e) => set('businessType', e.target.value)} required>
                    <option value="">Select</option>
                    {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="GST number" required>
                  <input className="input-luxury w-full uppercase" disabled={!canEdit} value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} required />
                </Field>
                <Field label="PAN number" required>
                  <input className="input-luxury w-full uppercase" disabled={!canEdit} value={form.panNumber} onChange={(e) => set('panNumber', e.target.value)} required maxLength={10} />
                </Field>
                <Field label="Aadhaar (optional)">
                  <input className="input-luxury w-full" disabled={!canEdit} value={form.aadhaarNumber} onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} maxLength={12} />
                </Field>
              </div>

              <h2 className="font-semibold text-gray-800 pt-2">Business address</h2>
              <Field label="Address" required>
                <textarea className="input-luxury w-full" rows={2} disabled={!canEdit} value={form.businessAddress} onChange={(e) => set('businessAddress', e.target.value)} required />
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="City" required>
                  <input className="input-luxury w-full" disabled={!canEdit} value={form.city} onChange={(e) => set('city', e.target.value)} required />
                </Field>
                <Field label="State" required>
                  <select className="input-luxury w-full" disabled={!canEdit} value={form.state} onChange={(e) => set('state', e.target.value)} required>
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode" required>
                  <input className="input-luxury w-full" disabled={!canEdit} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
                </Field>
              </div>

              <h2 className="font-semibold text-gray-800 pt-2">Bank / payout details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Bank name" required>
                  <input className="input-luxury w-full" disabled={!canEdit} value={form.bankName} onChange={(e) => set('bankName', e.target.value)} required />
                </Field>
                <Field label="Account holder" required>
                  <input className="input-luxury w-full" disabled={!canEdit} value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} required />
                </Field>
                <Field label="Account number" required>
                  <input className="input-luxury w-full" disabled={!canEdit} value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} required />
                </Field>
                <Field label="IFSC" required>
                  <input className="input-luxury w-full uppercase" disabled={!canEdit} value={form.ifscCode} onChange={(e) => set('ifscCode', e.target.value)} required />
                </Field>
              </div>

              {canEdit && (
                <>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="mt-1" checked={form.agreeTerms} onChange={(e) => set('agreeTerms', e.target.checked)} />
                    <span>I have read and accept the seller Terms &amp; Conditions (right) and confirm my KYC details are accurate.</span>
                  </label>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Submitting…' : kyc.status === 'rejected' ? 'Re-submit KYC' : 'Submit KYC for Approval'}
                  </button>
                </>
              )}
            </form>

            {/* Right — Policies (side by side) */}
            <div className="lg:col-span-2">
              <PoliciesPanel />
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
