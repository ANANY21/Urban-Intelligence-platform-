import React, { useState } from 'react';
import { DEMO_ALERTS } from '../data/demoData';
import type { Alert, AlertSeverity, AlertCategory } from '../types';
import { SeverityBadge } from '../components/common/Badge';
import { 
  Bell, 
  ShieldAlert, 
  Check, 
  Filter, 
  Radio, 
  Send, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  MapPin,
  ExternalLink
} from 'lucide-react';

export const AlertsCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [integrationStatus, setIntegrationStatus] = useState<string>('Architecture Ready — Gateway Inactive');

  const toggleAcknowledge = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acknowledged: !a.acknowledged } : a))
    );
  };

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-red-400" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                TACTICAL EMERGENCY ALERT & DISPATCH CENTER
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Real-time multi-agency notifications across Greater Chennai Corporation, Traffic Police, and Tamil Nadu State Disaster Management Authority (TNSDMA).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              Total Alerts: <strong className="text-white">{alerts.length}</strong> | Unacknowledged: <strong className="text-red-400">{alerts.filter(a => !a.acknowledged).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dispatch Gateway Readiness (SMS / Webhooks architecture) */}
      <div className="bg-[#141F30]/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold">EMERGENCY BROADCAST GATEWAYS (SMS / NDMA C-DOT CAP)</div>
            <div className="text-[11px] text-slate-400">Configured endpoints for Common Alerting Protocol (CAP) and bulk citizen push</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
            {integrationStatus}
          </span>
          <button
            onClick={() => setIntegrationStatus('Simulated Handshake Verified (No Live SMS Sent)')}
            className="px-3 py-1 bg-[#35D9F5]/20 hover:bg-[#35D9F5]/30 text-[#35D9F5] border border-[#35D9F5]/40 rounded text-[11px] font-bold uppercase transition-colors"
          >
            Test Gateway Handshake
          </button>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {(['all', 'critical', 'high', 'moderate'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded uppercase transition-colors ${
                severityFilter === sev
                  ? 'bg-[#35D9F5] text-black font-bold'
                  : 'bg-[#141F30] text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#141F30] border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-[#35D9F5]"
          >
            <option value="all">All Categories</option>
            <option value="flood">Flood Inundation</option>
            <option value="reservoir">Dam Outflows</option>
            <option value="rainfall">Precipitation Weather</option>
            <option value="traffic">Traffic Obstructions</option>
          </select>
        </div>
      </div>

      {/* 4. Alerts Detailed Feed */}
      <div className="space-y-4">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-xl border transition-all ${
              alert.acknowledged
                ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                : 'bg-[#101827]/90 border-slate-700 hover:border-[#35D9F5]/40 shadow-hud'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-mono">
              <div className="flex items-center gap-2.5">
                <SeverityBadge severity={alert.severity} />
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {alert.category}
                </span>
                {alert.isSimulated && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    DEMO DATA
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{alert.timestamp}</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              {alert.title}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
              {alert.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs font-mono">
              <div className="bg-[#141F30] p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AFFECTED LOCALITY</span>
                <span className="text-white font-semibold">{alert.location}</span>
              </div>
              <div className="bg-[#141F30] p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AUTHORITY SOURCE</span>
                <span className="text-[#35D9F5] font-semibold">{alert.source}</span>
              </div>
            </div>

            {alert.recommendedAction && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs mb-3 text-amber-200">
                <strong className="text-amber-400">DISPATCH ACTION: </strong>
                {alert.recommendedAction}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-500 text-[11px]">
                Coordinates: [{alert.coordinates[0].toFixed(4)}°N, {alert.coordinates[1].toFixed(4)}°E]
              </span>

              <button
                onClick={() => toggleAcknowledge(alert.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                  alert.acknowledged
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {alert.acknowledged ? 'Duty Officer Acknowledged' : 'Mark as Acknowledged'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
