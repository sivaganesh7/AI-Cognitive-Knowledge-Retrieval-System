'use client';

import { useAuth } from '@/context/AuthContext';
import {
  resetPassword,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/firebase';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.replace('/');
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSocial = async (provider) => {
    setLoading(provider);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      // Redirect-based Google auth causes a navigation; do not show a failure toast.
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      setError(getFriendlyError(err.code));
      toast.error('Sign in failed');
    } finally {
      setLoading('');
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading('email');
    setError('');

    try {
      if (mode === 'signin') {
        setError('Use Google sign-in to continue.');
        return;
      }

      if (mode === 'reset') {
        await resetPassword(email);
        toast.success('Password reset email sent!');
        setMode('signin');
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
        toast.success('Account created! Welcome to AI Cognitive Knowledge Retrieval System 🧠');
        router.push('/dashboard');
      }
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading('');
    }
  };

  function getFriendlyError(code) {
    const errors = {
      'auth/user-not-found':       'No account found with this email.',
      'auth/wrong-password':       'Incorrect password. Try again.',
      'auth/email-already-in-use': 'Email already registered. Sign in instead.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Invalid email address.',
      'auth/invalid-credential':   'Invalid email or password.',
      'auth/invalid-login-credentials': 'Invalid email or password.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Auth.',
      'auth/too-many-requests':    'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign in was cancelled.',
    };
    return errors[code] || 'Something went wrong. Please try again.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4 text-3xl">
            🧠
          </div>
          <h1 className="text-2xl font-bold text-white">AI Cognitive Knowledge Retrieval System</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'signin' ? 'Sign in to your knowledge base' :
             mode === 'signup' ? 'Create your personal knowledge base' :
             'Reset your password'}
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Social Buttons */}
          {mode !== 'reset' && (
            <>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSocial('google')}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'google' ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Sign In Directly With Google
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/8" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-gray-500" style={{ background: 'var(--color-surface-2)' }}>or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-500 transition-all"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!!loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading === 'email' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'reset' ? 'Sending...' : 'Loading...'}
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Email'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => { setMode('reset'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
                >
                  Forgot password?
                </button>
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Sign up free
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(''); }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => { setMode('signin'); setError(''); }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

