import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';

function FieldError({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function ReadOnlyField({ label, value, note }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="input-luxury h-10 px-3 flex items-center bg-gray-50 cursor-not-allowed opacity-70 select-none">
        <span className="text-sm text-gray-600">{value || '—'}</span>
      </div>
      {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
    </div>
  );
}

// Password strength indicator
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [password.length >= 6, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[11px] mt-0.5 ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        Password strength: {labels[score - 1] || ''}
      </p>
    </div>
  );
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
      {show
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      }
    </button>
  );
}

function PwInput({ label, field, value, error, show, onToggle, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className={`input-luxury w-full h-10 px-3 pr-10 text-sm ${error ? 'border-red-400 focus:ring-red-200' : ''}`}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <EyeToggle show={show} onToggle={onToggle} />
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  const [pw, setPw]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors]  = useState({});
  const [serverErr, setServerErr] = useState('');
  const [success, setSuccess]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);

  const handlePwChange = (field, val) => {
    setPw((p) => ({ ...p, [field]: val }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setServerErr('');
    setSuccess('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    try {
      const fd = new FormData();
      fd.append('name', profile.name);
      if (profile.phone) fd.append('phone', profile.phone);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await authAPI.updateProfile(fd);
      updateUser(data.data?.user || data.data);
      setProfileSuccess('Profile updated successfully!');
      setAvatarFile(null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!pw.currentPassword)                              e.currentPassword  = 'Current password is required';
    if (!pw.newPassword)                                  e.newPassword      = 'New password is required';
    else if (pw.newPassword.length < 6)                   e.newPassword      = 'Must be at least 6 characters';
    if (!pw.confirmPassword)                              e.confirmPassword  = 'Please confirm your new password';
    else if (pw.newPassword !== pw.confirmPassword)       e.confirmPassword  = 'Passwords do not match';
    return e;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setServerErr('');
    setSuccess('');
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setSuccess('Password updated successfully!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setServerErr(err?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet><title>My Account | LUXURY JEWELRY</title></Helmet>
      <div className="container-luxury py-10 max-w-4xl">

        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden group">
            {avatarPreview || user?.avatar
              ? <img src={avatarPreview || user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-xl font-bold text-primary">{user?.name?.[0]?.toUpperCase()}</span>}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">Edit</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-400 capitalize">{user?.role} Account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ── Profile Details ── */}
          <div className="card-luxury p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-heading text-lg font-semibold text-gray-900">Profile Details</h2>
            </div>

            {profileSuccess && (
              <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">{profileSuccess}</p>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input className="input-luxury w-full h-10 px-3 text-sm" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <ReadOnlyField label="Email Address" value={user?.email} note="Contact support to change your email" />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
                <input className="input-luxury w-full h-10 px-3 text-sm" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <ReadOnlyField label="Account Type" value={user?.role?.replace('_', ' ')} />
              <button type="submit" disabled={profileSaving} className="btn-primary w-full justify-center disabled:opacity-60">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* ── Change Password ── */}
          <div className="card-luxury p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-heading text-lg font-semibold text-gray-900">Change Password</h2>
            </div>

            {/* Server error */}
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

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-4 flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700 font-medium">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handlePasswordUpdate} className="space-y-4" noValidate>
              <PwInput label="Current Password"     field="currentPassword"  value={pw.currentPassword}  error={errors.currentPassword}  show={showCur} onToggle={() => setShowCur((v) => !v)} onChange={handlePwChange} />
              <div>
                <PwInput label="New Password"       field="newPassword"      value={pw.newPassword}      error={errors.newPassword}      show={showNew} onToggle={() => setShowNew((v) => !v)} onChange={handlePwChange} />
                <PasswordStrength password={pw.newPassword} />
              </div>
              <PwInput label="Confirm New Password" field="confirmPassword"  value={pw.confirmPassword}  error={errors.confirmPassword}  show={showCon} onToggle={() => setShowCon((v) => !v)} onChange={handlePwChange} />

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-60"
              >
                {saving
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating...</>
                  : 'Update Password'
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
