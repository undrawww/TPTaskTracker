import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'intern'>('intern');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError(null);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: role
        }]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        setError(`Profile creation failed: ${profileError.message || JSON.stringify(profileError)}`);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-teal via-[#004d5e] to-[#003946] relative overflow-hidden flex-col justify-center items-center p-12">
        {/* Floating orbs */}
        <div className="absolute top-20 right-16 w-64 h-64 bg-gold/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-20 left-12 w-48 h-48 bg-cream/8 rounded-full blur-[60px]" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-gold/5 rounded-full blur-[50px]" style={{ animation: 'pulse 6s ease-in-out infinite reverse' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f5e7c6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-gold/15 backdrop-blur-sm border border-gold/20 mx-auto flex items-center justify-center mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbc04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="font-poppins text-4xl font-bold text-cream tracking-tight leading-tight">
            Join the Team
          </h1>
          <p className="text-cream/40 text-sm font-medium mt-4 leading-relaxed">
            Create your account and start collaborating with Team Padua today.
          </p>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-10">
            <div className="w-2 h-2 rounded-full bg-gold/20" />
            <div className="w-2 h-2 rounded-full bg-gold" />
            <div className="w-2 h-2 rounded-full bg-gold/20" />
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 bg-cream dark:bg-[#001a22] flex flex-col justify-center relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-gold/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-teal/5 rounded-full blur-[80px] translate-y-1/3 translate-x-1/3 pointer-events-none" />

        <div className="w-full max-w-[400px] mx-auto px-6 relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-[#004d5e] flex items-center justify-center shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbc04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
          </div>

          {success ? (
            <div className="text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-status-done/10 border-2 border-status-done/30 mx-auto flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-status-done" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-poppins text-xl font-bold text-teal dark:text-cream">Registration Successful</h3>
              <p className="text-sm text-teal/50 dark:text-cream/40 mt-3 leading-relaxed">
                We've sent a verification link to <strong className="text-teal dark:text-cream">{email}</strong>. Check your inbox and click the link to activate your account.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex w-full justify-center py-3.5 rounded-xl bg-gradient-to-r from-gold to-[#f5d44a] text-teal text-sm font-bold shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <>
              <div className="animate-slide-up">
                <h2 className="font-poppins text-2xl font-bold text-teal dark:text-cream tracking-tight">
                  Create account
                </h2>
                <p className="text-teal/50 dark:text-cream/40 text-sm mt-1.5">
                  Fill in your details to get started
                </p>
              </div>

              <form className="mt-7 space-y-4 animate-slide-up" onSubmit={handleRegister} style={{ animationDelay: '80ms' }}>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="block text-[11px] font-bold uppercase tracking-[0.1em] text-teal/50 dark:text-cream/40">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/25 dark:text-cream/25">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      placeholder="Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-teal/8 dark:border-white/8 text-[#003946] dark:text-cream text-sm placeholder:text-[#003946]/40 dark:placeholder:text-cream/20 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/30 transition-all"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label htmlFor="role" className="block text-[11px] font-bold uppercase tracking-[0.1em] text-teal/50 dark:text-cream/40">
                    Register as
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('intern')}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                        role === 'intern'
                          ? 'bg-teal text-cream border-teal shadow-md shadow-teal/20'
                          : 'bg-white dark:bg-white/5 text-teal/50 dark:text-cream/40 border-teal/8 dark:border-white/8 hover:border-teal/20 dark:hover:border-white/15'
                      }`}
                    >
                      Intern
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                        role === 'admin'
                          ? 'bg-teal text-cream border-teal shadow-md shadow-teal/20'
                          : 'bg-white dark:bg-white/5 text-teal/50 dark:text-cream/40 border-teal/8 dark:border-white/8 hover:border-teal/20 dark:hover:border-white/15'
                      }`}
                    >
                      Administrator
                    </button>
                  </div>
                </div>

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
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-teal/8 dark:border-white/8 text-[#003946] dark:text-cream text-sm placeholder:text-[#003946]/40 dark:placeholder:text-cream/20 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/30 transition-all"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="block text-[11px] font-bold uppercase tracking-[0.1em] text-teal/50 dark:text-cream/40">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/25 dark:text-cream/25">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-teal/8 dark:border-white/8 text-teal dark:text-cream text-sm placeholder:text-teal/25 dark:placeholder:text-cream/20 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/30 transition-all"
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-[#f5d44a] text-teal text-sm font-bold shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 hover:translate-y-[-1px] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-cream dark:focus:ring-offset-[#001a22] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : 'Create account'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-teal/10 dark:to-cream/10" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal/25 dark:text-cream/25">or</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-teal/10 dark:to-cream/10" />
              </div>

              <p className="text-center text-sm text-teal/50 dark:text-cream/40 animate-slide-up" style={{ animationDelay: '200ms' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-gold hover:text-gold-light transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
