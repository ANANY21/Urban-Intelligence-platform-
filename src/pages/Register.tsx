import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { 
  UserPlus, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Shield, 
  Radio, 
  AlertCircle, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface RegisterProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onNavigateLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Viewer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim() || undefined,
        password,
        role,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Futuristic grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-[#101827]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#142338] border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <UserPlus className="w-7 h-7 text-[#35D9F5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#35D9F5] uppercase flex items-center gap-1.5">
                  <Radio className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                  ACCESS ONBOARDING
                </span>
              </div>
              <h1 className="text-xl font-bold text-white font-sans">
                Operator Registration
              </h1>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Create an operational profile to access geospatial flood, rainfall, and traffic predictive models.
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-200 text-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Registration Error</p>
                <p className="mt-0.5 text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Karthik Raman"
                    className="w-full pl-9 pr-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="karthik_r"
                    className="w-full pl-9 pr-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5]"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karthik@chennai-urban.gov.in"
                  className="w-full pl-9 pr-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
                Requested Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  role === 'Viewer' 
                    ? 'border-[#35D9F5] bg-[#35D9F5]/10 text-white' 
                    : 'border-slate-700 bg-[#080D16] text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="Viewer"
                    checked={role === 'Viewer'}
                    onChange={() => setRole('Viewer')}
                    className="sr-only"
                  />
                  <Shield className="w-4 h-4 text-[#35D9F5]" />
                  <div>
                    <p className="text-xs font-bold">Viewer</p>
                    <p className="text-[10px] text-slate-400">Dashboards & AI Query</p>
                  </div>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  role === 'Analyst' 
                    ? 'border-[#35D9F5] bg-[#35D9F5]/10 text-white' 
                    : 'border-slate-700 bg-[#080D16] text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="Analyst"
                    checked={role === 'Analyst'}
                    onChange={() => setRole('Analyst')}
                    className="sr-only"
                  />
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold">Analyst</p>
                    <p className="text-[10px] text-slate-400">ML Simulations & Ingest</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full pl-9 pr-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#35D9F5]"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#35D9F5]"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#35D9F5] to-blue-600 hover:from-[#35D9F5]/90 hover:to-blue-500 text-[#080D16] font-bold rounded-xl shadow-lg shadow-[#35D9F5]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#080D16] border-t-transparent rounded-full animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Operator Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {onNavigateLogin && (
            <div className="mt-5 text-center">
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-[#35D9F5] font-semibold hover:underline ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
