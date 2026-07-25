import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { tryEnableBrowserPushQuiet } from '../../utils/pushNotifications';

const ICONS = {
  user:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  email: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  phone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  lock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  gift:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
};

const EyeOn  = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOff = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;

function FieldError({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function IconInput({ icon, rightEl, error, ...props }) {
  return (
    <div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input
          {...props}
          className={`input-luxury w-full h-11 pl-10 ${rightEl ? 'pr-11' : 'pr-4'} text-sm text-gray-800 placeholder:text-gray-400 ${error ? 'border-red-400 focus:ring-red-200' : ''}`}
        />
        {rightEl && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[11px] mt-0.5 ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        {labels[score - 1] || ''}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const refFromUrl = (searchParams.get('ref') || '').trim().toUpperCase();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: refFromUrl,
  });
  const [errors, setErrors]       = useState({});
  const [serverErr, setServerErr] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const { register, googleLogin, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (refFromUrl) {
      setForm((f) => ({ ...f, referralCode: refFromUrl }));
    }
  }, [refFromUrl]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setServerErr('');
  };

  const handleGoogle = async (credential) => {
    setServerErr('');
    try {
      const user = await googleLogin(credential, form.referralCode || undefined);
      tryEnableBrowserPushQuiet();
      if (user) navigate('/');
    } catch (err) {
      setServerErr(err?.response?.data?.message || 'Google sign-up failed');
    }
  };

  const validate = () => {
    const e = {};

    if (!form.name.trim())
      e.name = 'Full name is required';
    else if (form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';

    if (!form.email.trim())
      e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address';

    if (!form.phone.trim())
      e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim()))
      e.phone = 'Enter a valid 10-digit phone number';

    if (!form.password)
      e.password = 'Password is required';
    else if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword)
      e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr('');
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };
      if (form.referralCode?.trim()) {
        payload.referralCode = form.referralCode.trim().toUpperCase();
      }
      const user = await register(payload);
      if (user) navigate('/');
    } catch (err) {
      setServerErr(err?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        </div>
        <div>
          <h2 className="font-heading text-[1.35rem] font-bold text-gray-900 leading-tight">Create Account</h2>
          <p className="text-xs text-gray-400">Join LUXURY JEWELRY today.</p>
        </div>
      </div>

      <AnimatePresence>
        {serverErr && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{serverErr}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>

        <IconInput
          type="text" value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Full name"
          icon={ICONS.user} error={errors.name}
          autoComplete="name"
        />

        <IconInput
          type="email" value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="Email address"
          icon={ICONS.email} error={errors.email}
          autoComplete="email"
        />

        <IconInput
          type="tel" value={form.phone}
          onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit phone number"
          icon={ICONS.phone} error={errors.phone}
          autoComplete="tel"
          inputMode="numeric"
        />

        <div>
          <IconInput
            type={showPass ? 'text' : 'password'} value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Password (min. 6 characters)"
            icon={ICONS.lock} error={errors.password}
            autoComplete="new-password"
            rightEl={
              <button type="button" onClick={() => setShowPass((v) => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? EyeOff : EyeOn}
              </button>
            }
          />
          <PasswordStrength password={form.password} />
        </div>

        <IconInput
          type={showConf ? 'text' : 'password'} value={form.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          placeholder="Confirm password"
          icon={ICONS.lock} error={errors.confirmPassword}
          autoComplete="new-password"
          rightEl={
            <button type="button" onClick={() => setShowConf((v) => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
              {showConf ? EyeOff : EyeOn}
            </button>
          }
        />

        <div>
          <IconInput
            type="text"
            value={form.referralCode}
            onChange={(e) => set('referralCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16))}
            placeholder="Referral code (optional)"
            icon={ICONS.gift}
            error={errors.referralCode}
            autoComplete="off"
          />
          {refFromUrl && form.referralCode === refFromUrl && (
            <p className="text-[11px] text-green-600 mt-1">Referral code applied from your invite link.</p>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-primary/30 mt-1">
          {loading
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating Account...</>
            : <>Create Account<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></>
          }
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 tracking-wider">OR</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <GoogleAuthButton onSuccess={handleGoogle} referralCode={form.referralCode || undefined} />

      <p className="text-center text-sm text-gray-400 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">Sign In</Link>
      </p>
    </motion.div>
  );
}
