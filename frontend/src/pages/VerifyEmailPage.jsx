import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authAPI.verifyEmail(token)
      .then(async () => {
        setStatus('success');
        await fetchMe();
        toast.success('Email verified!');
        setTimeout(() => navigate('/account'), 2000);
      })
      .catch(() => setStatus('error'));
  }, [token, fetchMe, navigate]);

  return (
    <>
      <Helmet><title>Verify Email | VK Jewellers</title></Helmet>
      <div className="min-h-[60vh] flex items-center justify-center container-luxury py-20 text-center">
        {status === 'loading' && <p className="text-gray-500">Verifying your email...</p>}
        {status === 'success' && (
          <div>
            <p className="text-2xl font-bold text-green-700 mb-2">Email Verified!</p>
            <p className="text-gray-500 mb-6">Redirecting to your account...</p>
            <Link to="/account" className="btn-primary">Go to Account</Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p className="text-xl font-bold text-red-600 mb-2">Verification Failed</p>
            <p className="text-gray-500 mb-6">The link may be invalid or expired.</p>
            <Link to="/login" className="btn-primary">Back to Login</Link>
          </div>
        )}
      </div>
    </>
  );
}
