import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Personal Info',  desc: 'Your name, email & password' },
  { id: 2, label: 'Shop Details',   desc: 'Shop name, type & GST' },
  { id: 3, label: 'Location',       desc: 'Business address' },
  { id: 4, label: 'Review',         desc: 'Confirm & submit' },
];

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

// ─── Input component ──────────────────────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11.5px] font-semibold text-gray-600 uppercase tracking-wider">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-red-500">{error}</p>}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`input-luxury ${className}`}
    {...props}
  />
);

const Select = ({ children, className = '', ...props }) => (
  <select
    className={`input-luxury appearance-none cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </select>
);

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    // Step 1 — Personal
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    // Step 2 — Shop
    shopName: '', businessType: '', gstNumber: '', panNumber: '',
    // Step 3 — Location
    businessAddress: '', city: '', state: '', pincode: '',
    // Agreements
    agreeTerms: false,
  });

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim())     e.name = 'Full name is required';
      if (!form.email.trim())    e.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
      if (form.password.length < 6)          e.password = 'Minimum 6 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!form.phone.trim())   e.phone = 'Phone is required';
    }
    if (step === 2) {
      if (!form.shopName.trim())     e.shopName = 'Shop name is required';
      if (!form.businessType)        e.businessType = 'Select a business type';
    }
    if (step === 3) {
      if (!form.businessAddress.trim()) e.businessAddress = 'Address is required';
      if (!form.city.trim())            e.city = 'City is required';
      if (!form.state)                  e.state = 'Select a state';
      if (!form.pincode.trim())         e.pincode = 'Pincode is required';
    }
    if (step === 4) {
      if (!form.agreeTerms) e.agreeTerms = 'You must agree to the terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 4)); };
  const back = () => { setStep((s) => Math.max(s - 1, 1)); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/vendor/register`, {
        name:            form.name,
        email:           form.email,
        password:        form.password,
        phone:           form.phone,
        shopName:        form.shopName,
        businessType:    form.businessType,
        gstNumber:       form.gstNumber,
        panNumber:       form.panNumber,
        businessAddress: form.businessAddress,
        city:            form.city,
        state:           form.state,
        pincode:         form.pincode,
      }, { withCredentials: true });
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #fdf9f6 0%, #f9f3ee 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
            <CheckCircleIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-500 mb-2">
            Thank you, <strong>{form.name}</strong>! Your shop <strong>"{form.shopName}"</strong> registration has been submitted.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Our team will review your application and activate your store within <strong>24–48 hours</strong>.
            You'll receive a confirmation email at <strong>{form.email}</strong>.
          </p>
          <Link to="/" className="btn-primary">
            Back to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Register Your Shop — LUXURY JEWELRY MARKETPLACE</title>
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf9f6 0%, #f9f3ee 100%)' }}>
        <div className="container-luxury py-12">

          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/become-a-seller" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Back to Seller Info
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Register Your Jewellery Shop</h1>
            <p className="text-gray-500 text-sm">Join the LUXURY JEWELRY MARKETPLACE in 4 simple steps</p>
          </div>

          {/* Step indicator */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-between relative">
              {/* Connector bar */}
              <div className="absolute top-5 left-0 right-0 h-0.5 -z-0" style={{ background: '#e8e0d8' }} />
              <div
                className="absolute top-5 left-0 h-0.5 transition-all duration-500 -z-0"
                style={{ background: 'linear-gradient(to right, #C9A84C, #E2C97E)', width: `${((step - 1) / 3) * 100}%` }}
              />
              {STEPS.map((s) => (
                <div key={s.id} className="flex flex-col items-center z-10">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                    style={{
                      background: s.id <= step
                        ? 'linear-gradient(135deg, #C9A84C, #E2C97E)'
                        : 'white',
                      color: s.id <= step ? '#1a0e08' : '#9ca3af',
                      border: s.id <= step ? 'none' : '2px solid #e8e0d8',
                      boxShadow: s.id === step ? '0 4px 14px rgba(201,168,76,0.45)' : 'none',
                    }}
                  >
                    {s.id < step ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : s.id}
                  </div>
                  <p className="hidden sm:block text-[11px] font-semibold mt-2 text-center"
                    style={{ color: s.id <= step ? '#5a413f' : '#9ca3af' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>

              {/* Step label */}
              <div className="px-8 py-5 border-b border-gray-100"
                style={{ background: 'linear-gradient(to right, #fdf9f6, #f9f3ee)' }}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Step {step} of 4</p>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{STEPS[step - 1].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step - 1].desc}</p>
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >

                    {/* ── Step 1: Personal Info ── */}
                    {step === 1 && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Field label="Full Name" error={errors.name} required>
                            <Input placeholder="Rajesh Kumar" value={form.name} onChange={(e) => set('name', e.target.value)} />
                          </Field>
                          <Field label="Mobile Number" error={errors.phone} required>
                            <Input placeholder="+91 9876543210" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                          </Field>
                        </div>
                        <Field label="Email Address" error={errors.email} required>
                          <Input type="email" placeholder="you@yourshop.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Field label="Password" error={errors.password} required>
                            <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
                          </Field>
                          <Field label="Confirm Password" error={errors.confirmPassword} required>
                            <Input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
                          </Field>
                        </div>
                      </>
                    )}

                    {/* ── Step 2: Shop Details ── */}
                    {step === 2 && (
                      <>
                        <Field label="Shop / Brand Name" error={errors.shopName} required>
                          <Input placeholder="e.g. Patel Gold House" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
                        </Field>
                        <Field label="Business Type" error={errors.businessType} required>
                          <Select value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                            <option value="">Select business type</option>
                            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </Select>
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Field label="GST Number" error={errors.gstNumber}>
                            <Input placeholder="27AFCPR0683K1Z4" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} />
                          </Field>
                          <Field label="PAN Number" error={errors.panNumber}>
                            <Input placeholder="ABCDE1234F" value={form.panNumber} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} />
                          </Field>
                        </div>
                        <div className="p-4 rounded-xl text-sm text-gray-600"
                          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                          <strong className="text-gray-800">Note:</strong> GST is required for approval. PAN is optional but recommended.
                        </div>
                      </>
                    )}

                    {/* ── Step 3: Location ── */}
                    {step === 3 && (
                      <>
                        <Field label="Business Address" error={errors.businessAddress} required>
                          <textarea
                            rows={3}
                            placeholder="Shop No., Building, Street Name"
                            value={form.businessAddress}
                            onChange={(e) => set('businessAddress', e.target.value)}
                            className="input-luxury resize-none"
                          />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Field label="City" error={errors.city} required>
                            <Input placeholder="Mumbai" value={form.city} onChange={(e) => set('city', e.target.value)} />
                          </Field>
                          <Field label="Pincode" error={errors.pincode} required>
                            <Input placeholder="400001" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
                          </Field>
                        </div>
                        <Field label="State" error={errors.state} required>
                          <Select value={form.state} onChange={(e) => set('state', e.target.value)}>
                            <option value="">Select state</option>
                            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                      </>
                    )}

                    {/* ── Step 4: Review & Submit ── */}
                    {step === 4 && (
                      <div className="space-y-5">
                        <div className="space-y-3">
                          {[
                            { label: 'Name',         value: form.name },
                            { label: 'Email',        value: form.email },
                            { label: 'Phone',        value: form.phone },
                            { label: 'Shop Name',    value: form.shopName },
                            { label: 'Business Type',value: form.businessType },
                            { label: 'GST Number',   value: form.gstNumber || '—' },
                            { label: 'City / State', value: `${form.city}, ${form.state}` },
                            { label: 'Pincode',      value: form.pincode },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                              <span className="text-gray-500 font-medium">{label}</span>
                              <span className="text-gray-800 font-semibold text-right max-w-[60%]">{value}</span>
                            </div>
                          ))}
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer mt-4">
                          <input
                            type="checkbox"
                            checked={form.agreeTerms}
                            onChange={(e) => set('agreeTerms', e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-primary"
                          />
                          <span className="text-sm text-gray-600 leading-relaxed">
                            I agree to the{' '}
                            <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                            {' '}and{' '}
                            <Link to="/vendor-policy" className="text-primary hover:underline">Vendor Policy</Link>.
                            I confirm that all details provided are accurate.
                          </span>
                        </label>
                        {errors.agreeTerms && <p className="text-[11px] text-red-500">{errors.agreeTerms}</p>}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  {step > 1 ? (
                    <button
                      onClick={back}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                      Back
                    </button>
                  ) : (
                    <Link to="/become-a-seller" className="text-sm text-gray-500 hover:text-primary transition-colors">
                      Cancel
                    </Link>
                  )}

                  {step < 4 ? (
                    <button
                      onClick={next}
                      className="btn-primary"
                      style={{ background: 'linear-gradient(135deg, #1a0e08 0%, #3a2520 100%)' }}
                    >
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="btn-primary disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #a07828 100%)' }}
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>Submit Application</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Already have a vendor account?{' '}
              <Link to="/login" className="text-primary hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
