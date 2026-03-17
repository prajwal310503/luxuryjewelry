import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
      <p className="text-gray-500 mb-8">Enter your email and we'll send you a reset link.</p>

      {sent ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📧</div>
          <h3 className="font-heading text-xl text-gray-800 mb-2">Check your inbox</h3>
          <p className="text-gray-500 text-sm mb-6">We sent a password reset link to <strong>{email}</strong></p>
          <Link to="/login" className="btn-primary">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="input-luxury"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-primary hover:underline">← Back to Login</Link>
      </p>
    </motion.div>
  );
}
