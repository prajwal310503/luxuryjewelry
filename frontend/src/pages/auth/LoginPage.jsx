import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const inputCls = 'w-full h-11 border border-gray-200 rounded-xl text-sm text-gray-800 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400 bg-gray-50/60';

const IconInput = ({ icon, rightEl, ...props }) => (
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
    <input {...props} className={props.className || inputCls} />
    {rightEl && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>}
  </div>
);

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await login(form);
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'vendor') navigate('/vendor/dashboard');
      else navigate(from);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="font-heading text-[1.35rem] font-bold text-gray-900 leading-tight">Welcome Back</h2>
          <p className="text-xs text-gray-400">Sign in to continue your jewelry journey.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <IconInput
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          placeholder="Email address"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />

        <div>
          <IconInput
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            placeholder="Password"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            className="w-full h-11 border border-gray-200 rounded-xl text-sm text-gray-800 pl-10 pr-11 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400 bg-gray-50/60"
            rightEl={
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600 transition-colors">
                {showPass
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            }
          />
          <div className="flex justify-end mt-1">
            <Link to="/forgot-password" className="text-[11px] text-primary font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-primary/30 mt-1">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 tracking-wider">NEW HERE?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <Link to="/register"
        className="w-full h-11 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-primary hover:text-primary text-sm font-semibold text-gray-600 rounded-xl transition-all duration-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        Create an Account
      </Link>

    </motion.div>
  );
}
