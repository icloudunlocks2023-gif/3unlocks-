import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import DeviceMockup from './DeviceMockup';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export default function ForgotPasswordPage({
  onNavigateToLogin,
  onNavigateToHome,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errMsg = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        errMsg = 'No user found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="forgot-password-page" className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Mockup Illustration */}
        <div className="lg:col-span-5 hidden lg:flex justify-center animate-in slide-in-from-left duration-500">
          <DeviceMockup />
        </div>

        {/* Right Side: Card Panel */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 sm:p-10 border border-slate-100 shadow-xl space-y-6 max-w-md mx-auto w-full animate-in slide-in-from-right duration-500">
          
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              Reset Password
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              We'll send you an email with reset instructions.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100/50 rounded-xl p-3 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4 py-4 text-center lg:text-left">
              <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-4 text-emerald-800 text-xs flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Reset Email Dispatched</p>
                  <p className="mt-1 font-medium text-emerald-700">Password reset email has been sent.</p>
                </div>
              </div>

              <p className="text-slate-500 text-xs font-medium">
                Please check your inbox and follow the instructions to secure your account.
              </p>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer text-center shadow-md shadow-blue-500/10"
              >
                RETURN TO LOGIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block pl-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
              >
                {loading ? 'Sending Instructions...' : 'SEND RESET EMAIL'}
              </button>
            </form>
          )}

          {/* Redirection Links */}
          {!success && (
            <div className="text-center pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#1E4DFF] hover:underline font-bold cursor-pointer"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={onNavigateToHome}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                Homepage
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
