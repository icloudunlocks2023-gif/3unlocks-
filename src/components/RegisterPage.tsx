import React, { useState } from 'react';
import { Mail, Lock, User, Globe, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, cleanFirestoreData } from '../firebase';
import DeviceMockup from './DeviceMockup';

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export default function RegisterPage({
  onSuccess,
  onNavigateToLogin,
  onNavigateToHome,
}: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [accountType, setAccountType] = useState('Personal User');
  const [deviceOwnership, setDeviceOwnership] = useState('Personal Devices');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Set Display Name (Username)
      await updateProfile(user, {
        displayName: username,
      });

      // 3. Automatically create user document in Firestore users collection
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        username,
        email,
        country,
        whatsApp: whatsApp || '',
        accountType,
        deviceOwnership,
        registrationDate: new Date().toISOString(),
        role: 'Customer',
        status: 'Active',
      });

      // 4. Create automatic welcome notification for the user
      const welcomeNotifId = `notif_${Date.now()}_welcome`;
      await setDoc(doc(db, 'notifications', welcomeNotifId), cleanFirestoreData({
        id: welcomeNotifId,
        icon: 'Info',
        title: 'Welcome to 3uUnlocks Server!',
        description: `Hello ${username}! Welcome to the official 3uUnlocks hardware activation unlock platform. Your account is active and ready.`,
        time: new Date().toISOString(),
        read: false,
        type: 'info',
        userId: user.uid,
        targetUserId: user.uid,
        targetEmail: email.toLowerCase()
      }));

      // 5. Trigger success callback
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      let errMsg = 'Failed to create your account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email address is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. It must be at least 6 characters.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-page" className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Mockup Illustration */}
        <div className="lg:col-span-5 hidden lg:flex justify-center animate-in slide-in-from-left duration-500">
          <DeviceMockup />
        </div>

        {/* Right Side: Register Card */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 sm:p-10 border border-slate-100 shadow-xl space-y-6 max-w-lg mx-auto w-full animate-in slide-in-from-right duration-500">
          
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              Create Your Account
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Create your 3uUnlocks account.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100/50 rounded-xl p-3 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Username */}
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">Username</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5 text-left sm:col-span-1">
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
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">Password</label>
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
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer animate-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer animate-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">Country</label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>

              {/* WhatsApp Number (Optional) */}
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">WhatsApp (Optional)</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+1 555-123-4567"
                    value={whatsApp}
                    onChange={(e) => setWhatsApp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-semibold shadow-sm"
                >
                  <option value="Personal User">Personal User</option>
                  <option value="Technician">Technician</option>
                  <option value="Repair Shop">Repair Shop</option>
                  <option value="Reseller">Reseller</option>
                </select>
              </div>

              {/* Device Ownership */}
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="text-xs font-bold text-slate-600 block pl-1">Device Ownership</label>
                <select
                  value={deviceOwnership}
                  onChange={(e) => setDeviceOwnership(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-semibold shadow-sm"
                >
                  <option value="Personal Devices">Personal Devices</option>
                  <option value="Customer Devices">Customer Devices</option>
                </select>
              </div>

            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 pt-2 select-none">
              <input
                id="agree-terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-slate-300 text-[#1E4DFF] mt-0.5 focus:ring-[#1E4DFF]/20"
              />
              <label htmlFor="agree-terms" className="text-[11px] leading-tight text-slate-500 font-medium cursor-pointer">
                I agree to the <span className="text-[#1E4DFF] font-bold hover:underline">Terms of Service</span> and authorize compatibility checks.
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Bottom redirection */}
          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#1E4DFF] hover:underline font-bold cursor-pointer"
              >
                Login
              </button>
            </p>
          </div>

          {/* Go Back Link */}
          <div className="text-center">
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
