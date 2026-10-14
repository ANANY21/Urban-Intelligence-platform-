import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { forgotPassword, resetPassword } from '../services/api';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Radio, 
  AlertCircle, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2,
  Sparkles,
  Server
} from 'lucide-react';

interface LoginProps {
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stepReset, setStepReset] = useState<'request' | 'submit'>('request');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please provide your operational email/username and secure password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(usernameOrEmail.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials or security status.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (role: 'Admin' | 'Analyst' | 'Viewer') => {
    if (role === 'Admin') {
      setUsernameOrEmail('admin@chennai-urban.gov.in');
      setPassword('Admin@Chennai2026!');
    } else if (role === 'Analyst') {
      setUsernameOrEmail('analyst@chennai-urban.gov.in');
      setPassword('Analyst@Chennai2026!');
    } else {
      setUsernameOrEmail('viewer@chennai-urban.gov.in');
      setPassword('Viewer@Chennai2026!');
    }
    setError(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setForgotLoading(true);
      setForgotSuccess(null);
      const res = await forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setStepReset('submit');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setForgotLoading(true);
      const res = await resetPassword(resetToken.trim(), newPassword);
      setForgotSuccess(res.message + ' You can now sign in with your new password.');
      setTimeout(() => {
        setShowForgotModal(false);
        setPassword(newPassword);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial cyan glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#35D9F5]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Futuristic grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Command Center Header Card */}
        <div className="bg-[#101827]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#142338] border border-[#35D9F5]/30 flex items-center justify-center shadow-lg shadow-[#35D9F5]/10">
              <ShieldCheck className="w-7 h-7 text-[#35D9F5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#35D9F5] uppercase flex items-center gap-1.5">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  AUTHENTICATION GATEWAY
                </span>
              </div>
              <h1 className="text-xl font-bold text-white font-sans">
                Chennai Geospatial Portal
              </h1>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Authorized personnel login for Greater Chennai Disaster Management, Traffic Police & Hydrological Command.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-200 text-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Access Denied</p>
                <p className="mt-0.5 text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Operator ID / Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin@chennai-urban.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#080D16] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5] focus:ring-1 focus:ring-[#35D9F5] transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#35D9F5] hover:text-[#35D9F5]/80 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-[#080D16] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5] focus:ring-1 focus:ring-[#35D9F5] transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#35D9F5] to-blue-600 hover:from-[#35D9F5]/90 hover:to-blue-500 text-[#080D16] font-bold rounded-xl shadow-lg shadow-[#35D9F5]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#080D16] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Pre-fill Bar for Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-[#35D9F5]" />
                Demo Command Credentials
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('Admin')}
                className="px-2 py-1.5 bg-[#142338] hover:bg-[#1b2f4a] border border-[#35D9F5]/20 rounded-lg text-[11px] font-mono text-[#35D9F5] transition-all text-center"
              >
                Admin (GCC)
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('Analyst')}
                className="px-2 py-1.5 bg-[#142338] hover:bg-[#1b2f4a] border border-slate-700 rounded-lg text-[11px] font-mono text-slate-300 transition-all text-center"
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('Viewer')}
                className="px-2 py-1.5 bg-[#142338] hover:bg-[#1b2f4a] border border-slate-700 rounded-lg text-[11px] font-mono text-slate-400 transition-all text-center"
              >
                Viewer
              </button>
            </div>
          </div>

          {/* Registration link */}
          {onNavigateRegister && (
            <div className="mt-5 text-center">
              <p className="text-xs text-slate-400">
                New operator workstation?{' '}
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="text-[#35D9F5] font-semibold hover:underline ml-1"
                >
                  Register Access
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Security watermark footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-mono text-slate-500">
            ENCRYPTED WITH ARGON2-ID &bull; SHORT-LIVED JWT WITH REFRESH ROTATION
          </p>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101827] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#35D9F5]" />
              Password Recovery
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered official email. The system will issue a cryptographic recovery token.
            </p>

            {forgotSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {stepReset === 'request' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="operator@chennai-urban.gov.in"
                    className="w-full px-3.5 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#35D9F5]"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-[#35D9F5] text-[#080D16] font-bold text-xs rounded-xl hover:bg-[#35D9F5]/90 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Processing...' : 'Generate Reset Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    New Secure Password (Min 8 characters)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="NewPassword2026!"
                    className="w-full px-3.5 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white"
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Resetting...' : 'Confirm Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
