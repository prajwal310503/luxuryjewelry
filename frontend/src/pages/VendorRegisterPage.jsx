import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { vendorAPI } from '../services/api';

const Field = ({ label, error, children, required }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11.5px] font-semibold text-gray-600 uppercase tracking-wider">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-red-500">{error}</p>}
  </div>
);

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    shopName: '',
    city: '',
    agreeTerms: false,
  });

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = '10-digit phone required';
    if (!form.shopName.trim()) e.shopName = 'Shop name is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.agreeTerms) e.agreeTerms = 'Accept Terms & Conditions to continue';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await vendorAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
        shopName: form.shopName.trim(),
        city: form.city.trim(),
        agreeTerms: true,
      });
      setDone(true);
      toast.success('Registered! Complete KYC after login.');
    } catch (err) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <>
        <Helmet><title>Seller Registered | LUXURY JEWELRY</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">You&apos;re registered</h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Next: log in and complete <strong>KYC</strong> (GST, PAN, bank &amp; documents).
              Admin will approve your seller account — then you can upload products for review.
            </p>
            <button type="button" onClick={() => navigate('/login')} className="btn-primary w-full">
              Go to Login
            </button>
            <Link to="/" className="block mt-4 text-sm text-gray-500 hover:text-primary">Back to store</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Become a Seller | LUXURY JEWELRY</title></Helmet>
      <div className="min-h-screen bg-[#faf7f2] py-10 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Seller Marketplace</p>
            <h1 className="font-heading text-3xl font-bold text-gray-900">Create seller account</h1>
            <p className="text-sm text-gray-500 mt-2">Basic details only. KYC &amp; documents come after login.</p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
          >
            <Field label="Full name" required error={errors.name}>
              <input className="input-luxury w-full" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" className="input-luxury w-full" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password" required error={errors.password}>
                <input type="password" className="input-luxury w-full" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </Field>
              <Field label="Confirm" required error={errors.confirmPassword}>
                <input type="password" className="input-luxury w-full" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
              </Field>
            </div>
            <Field label="Phone" required error={errors.phone}>
              <input className="input-luxury w-full" value={form.phone} maxLength={10} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </Field>
            <Field label="Shop name" required error={errors.shopName}>
              <input className="input-luxury w-full" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
            </Field>
            <Field label="City" required error={errors.city}>
              <input className="input-luxury w-full" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>

            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={form.agreeTerms} onChange={(e) => set('agreeTerms', e.target.checked)} />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-primary font-semibold underline" target="_blank">Terms &amp; Conditions</Link>
                {' '}and seller marketplace policies.
              </span>
            </label>
            {errors.agreeTerms && <p className="text-[11px] text-red-500">{errors.agreeTerms}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Register as Seller'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-primary font-semibold">Login</Link>
            </p>
          </motion.form>
        </div>
      </div>
    </>
  );
}
