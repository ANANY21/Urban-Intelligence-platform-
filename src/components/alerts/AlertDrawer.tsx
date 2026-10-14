import React, { useState } from 'react';
import type { Alert, AlertSeverity, AlertCategory } from '../../types';
import { DEMO_ALERTS } from '../../data/demoData';
import { SeverityBadge } from '../common/Badge';
import { 
  X, 
  Bell, 
  Check, 
  Filter, 
  AlertTriangle, 
  ShieldAlert, 
  Car, 
  CloudRain, 
  Droplets,
  ExternalLink
} from 'lucide-react';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlertLocation?: (coords: [number, number]) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAlertLocation,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const toggleAcknowledge = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acknowledged: !a.acknowledged } : a))
    );
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    return true;
  });

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'flood': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'rainfall': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'traffic': return <Car className="w-4 h-4 text-amber-400" />;
      case 'reservoir': return <Droplets className="w-4 h-4 text-[#35D9F5]" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0D1524] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Drawer Header */}
        <div className="p-4 bg-[#101827] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#35D9F5]" />
            <h3 className="font-mono text-sm font-bold text-white tracking-wider">
              TACTICAL ALERT DISPATCH CENTER
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-[#141F30] border-b border-slate-800 flex flex-wrap gap-2 text-xs font-mono">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#080D16] border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#35D9F5]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="moderate">Moderate Only</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#080D16] border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#35D9F5]"
          >
            <option value="all">All Categories</option>
            <option value="flood">Flood Inundation</option>
            <option value="reservoir">Dam Outflows</option>
            <option value="rainfall">Cloudburst Weather</option>
            <option value="traffic">Traffic Obstructions</option>
          </select>

          <div className="ml-auto text-slate-400 text-[11px] self-center">
            {filteredAlerts.length} Active
          </div>
        </div>

        {/* Alert Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border transition-all ${
                alert.acknowledged
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-[#141F30]/90 border-slate-700/80 hover:border-[#35D9F5]/40 shadow-hud'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(alert.category)}
                  <SeverityBadge severity={alert.severity} />
                  {alert.isSimulated && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                      DEMO
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {alert.timestamp}
                </span>
              </div>

              <div className="font-bold text-xs text-white mb-1">
                {alert.title}
              </div>
              <div className="text-[11px] text-slate-300 mb-2 leading-relaxed font-sans">
                {alert.description}
              </div>

              <div className="text-[10px] font-mono text-slate-400 mb-2 bg-[#080D16]/60 p-2 rounded border border-slate-800">
                <div className="text-slate-500">LOCATION & SOURCE</div>
                <div className="text-slate-300 font-semibold">{alert.location}</div>
                <div className="text-[#35D9F5]">{alert.source}</div>
              </div>

              {alert.recommendedAction && (
                <div className="text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20 mb-3">
                  <span className="font-bold">RECOMMENDED ACTION: </span>
                  {alert.recommendedAction}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                {onSelectAlertLocation && (
                  <button
                    onClick={() => {
                      onSelectAlertLocation(alert.coordinates);
                      onClose();
                    }}
                    className="text-[#35D9F5] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" /> Focus on Map
                  </button>
                )}
                <button
                  onClick={() => toggleAcknowledge(alert.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ml-auto flex items-center gap-1 ${
                    alert.acknowledged
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
