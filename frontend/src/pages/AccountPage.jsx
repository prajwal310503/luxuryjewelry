import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, fetchMe } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updatePassword(pwForm);
      toast.success('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    }
  };

  return (
    <>
      <Helmet><title>My Account | Luxury Jewelry</title></Helmet>
      <div className="container-luxury py-10">
        <h1 className="font-heading text-3xl font-bold mb-8">My Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-luxury p-6">
            <h2 className="font-heading text-lg font-semibold mb-5">Profile Details</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-luxury" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" value={user?.email} disabled className="input-luxury opacity-60 cursor-not-allowed" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-luxury" /></div>
              <button type="submit" className="btn-primary w-full justify-center">Update Profile</button>
            </form>
          </div>
          <div className="card-luxury p-6">
            <h2 className="font-heading text-lg font-semibold mb-5">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label><input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} className="input-luxury" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label><input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} className="input-luxury" minLength={6} /></div>
              <button type="submit" className="btn-primary w-full justify-center">Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
