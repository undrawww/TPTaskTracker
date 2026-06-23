import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-teal via-[#004d5e] to-[#003946] relative overflow-hidden flex-col justify-center items-center p-12">
        {/* Floating orbs */}
        <div className="absolute top-20 left-16 w-64 h-64 bg-gold/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-32 right-12 w-48 h-48 bg-cream/8 rounded-full blur-[60px]" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-gold/5 rounded-full blur-[50px]" style={{ animation: 'pulse 6s ease-in-out infinite reverse' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f5e7c6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-sm text-center">
          <div className="w-24 h-24 mx-auto flex items-center justify-center mb-8 drop-shadow-xl">
            <img src="https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782145581/ICOZ_aatvaa.png" alt="Task Tracker Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-poppins text-4xl font-bold text-cream tracking-tight leading-tight">
            Task Tracker
          </h1>
          <p className="text-cream/40 text-sm font-medium mt-4 leading-relaxed">
            Track progress, manage tasks, and collaborate seamlessly with your team.
          </p>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-10">
            <div className="w-2 h-2 rounded-full bg-gold" />
            <div className="w-2 h-2 rounded-full bg-gold/40" />
            <div className="w-2 h-2 rounded-full bg-gold/20" />
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 bg-cream dark:bg-[#001a22] flex flex-col justify-center relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="w-full max-w-[400px] mx-auto px-6 relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-[#004d5e] flex items-center justify-center shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbc04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
          </div>

          <div className="animate-slide-up">
            <h2 className="font-poppins text-2xl font-bold text-teal dark:text-cream tracking-tight">
              Welcome back
            </h2>
            <p className="text-teal/50 dark:text-cream/40 text-sm mt-1.5">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form className="mt-8 space-y-5 animate-slide-up" onSubmit={handleLogin} style={{ animationDelay: '80ms' }}>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-[0.1em] text-teal/50 dark:text-cream/40">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/25 dark:text-cream/25">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-teal/8 dark:border-white/8 text-[#003946] dark:text-cream text-sm placeholder:text-[#003946]/40 dark:placeholder:text-cream/20 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.1em] text-teal/50 dark:text-cream/40">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/25 dark:text-cream/25">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-teal/8 dark:border-white/8 text-[#003946] dark:text-cream text-sm placeholder:text-[#003946]/40 dark:placeholder:text-cream/20 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/30 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-status-hold/10 border border-status-hold/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-status-hold shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p className="text-sm text-status-hold font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-[#f5d44a] text-teal text-sm font-bold shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 hover:translate-y-[-1px] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-cream dark:focus:ring-offset-[#001a22] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal/10 dark:to-cream/10" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal/25 dark:text-cream/25">or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal/10 dark:to-cream/10" />
          </div>

          <p className="text-center text-sm text-teal/50 dark:text-cream/40 animate-slide-up" style={{ animationDelay: '200ms' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-gold hover:text-gold-light transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
