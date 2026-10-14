import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User, UserRole } from '../types';
import { listAllUsers, updateUserRole } from '../services/api';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Search
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await listAllUsers();
      setUsers(data);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await updateUserRole(userId, newRole);
      setActionSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800 flex items-center justify-center text-red-400 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Restricted Command Portal</h2>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          User directory and role-based access control (RBAC) modification requires verified Administrator privileges.
        </p>
        <div className="p-3 bg-[#101827] border border-slate-800 rounded-xl text-slate-400 font-mono text-xs">
          Current Role: <span className="text-[#35D9F5] font-bold">{currentUser?.role || 'Viewer'}</span>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const adminCount = users.filter((u) => u.role === 'Admin').length;
  const analystCount = users.filter((u) => u.role === 'Analyst').length;
  const viewerCount = users.filter((u) => u.role === 'Viewer').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header */}
      <div className="relative bg-gradient-to-r from-[#101827] via-[#142338] to-[#0A101D] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35D9F5]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-[#35D9F5] uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                SECURITY GOVERNANCE &bull; ROLE-BASED ACCESS CONTROL
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-sans">
              Personnel &amp; User Directory
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl font-sans">
              Manage cryptographic access roles, operational authorization tiers, and account security states across GCC command teams.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Success / Error Banners */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 3. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>TOTAL OPERATORS</span>
            <Users className="w-4 h-4 text-[#35D9F5]" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">{users.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Registered Personnel</p>
        </div>

        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>ADMINISTRATORS</span>
            <ShieldCheck className="w-4 h-4 text-[#35D9F5]" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">{adminCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Full System Governance</p>
        </div>

        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>CRISIS ANALYSTS</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">{analystCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">ML Inference &amp; Data Ingestion</p>
        </div>

        <div className="bg-[#101827] border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>VIEWERS</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">{viewerCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Monitoring &amp; Assistant Access</p>
        </div>
      </div>

      {/* 4. Search Filter */}
      <div className="flex items-center gap-3 bg-[#101827] border border-slate-800 rounded-xl px-4 py-2.5 max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name, username or email..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* 5. Users Table */}
      <div className="bg-[#101827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0A101D] border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Modify Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No operators match search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#142338]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">
                          {u.full_name || u.username}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">@{u.username}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase border ${
                        u.role === 'Admin'
                          ? 'bg-[#35D9F5]/10 text-[#35D9F5] border-[#35D9F5]/30'
                          : u.role === 'Analyst'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {u.created_at ? u.created_at.split('T')[0] : 'System Seed'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        disabled={u.id === currentUser?.id}
                        className="bg-[#080D16] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#35D9F5] disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
