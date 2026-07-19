import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import DeviceMockup from './DeviceMockup';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateToHome: () => void;
}

export default function LoginPage({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToHome,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      let errMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email address or password.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Too many failed attempts. Please try again later.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Mockup Illustration */}
        <div className="lg:col-span-5 hidden lg:flex justify-center animate-in slide-in-from-left duration-500">
          <DeviceMockup />
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 sm:p-10 border border-slate-100 shadow-xl space-y-6 max-w-md mx-auto w-full animate-in slide-in-from-right duration-500">
          
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Sign in to manage your unlock orders.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100/50 rounded-xl p-3 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-600 block">Password</label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-[11px] text-[#1E4DFF] hover:underline font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1 select-none">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E4DFF] focus:ring-[#1E4DFF]/20"
                />
                <span>Remember Me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-extrabold tracking-widest">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Register Call to Action */}
          <div className="space-y-3.5 text-center">
            <p className="text-slate-400 text-xs font-semibold">
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="w-full border border-blue-200 hover:bg-blue-50/50 text-[#1E4DFF] font-bold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer text-center"
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Go Back Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateToHome}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
            >
              ← Back to Homepage
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
