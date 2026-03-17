import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Minimum 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
      <p className="text-gray-500 mb-8">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" className="input-luxury" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} placeholder="Re-enter password" className="input-luxury" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </motion.div>
  );
}
