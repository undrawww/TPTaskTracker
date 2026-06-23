import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!isSupabaseConfigured) {
      setError('Database connection is not configured.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#002a35] dark:bg-[#001a22] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Abstract background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#003946] dark:bg-[#002a35] mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-40 -left-40 w-96 h-96 rounded-full bg-teal/50 dark:bg-teal/30 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-20 w-96 h-96 rounded-full bg-[#004d5e] dark:bg-[#003946] mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f5e7c6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-6 drop-shadow-xl">
            <img src="https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782145581/ICOZ_aatvaa.png" alt="Task Tracker Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-poppins font-bold text-cream tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-cream/60">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/5 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 animate-fade-in">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-status-done/20 mb-4">
                <svg className="h-6 w-6 text-status-done" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-cream mb-2">Check your email</h3>
              <p className="text-sm text-cream/60 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-3 px-4 border border-teal/20 rounded-xl shadow-sm text-sm font-medium text-gold bg-transparent hover:bg-white/5 focus:outline-none transition-all duration-200"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cream/80 mb-2">
                  Email address
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
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

              <div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-gold/20 text-sm font-bold text-teal bg-gradient-to-r from-gold to-[#f5d44a] hover:shadow-xl hover:shadow-gold/30 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold/50 focus:ring-offset-cream dark:focus:ring-offset-[#001a22] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? 'Sending link...' : 'Send reset link'}
                </button>
              </div>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-teal/20 dark:border-white/10 rounded-xl text-sm font-medium text-cream hover:bg-white/5 focus:outline-none transition-all duration-200"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
