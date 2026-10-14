import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  User, 
  ChevronDown,
  Bot,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CHENNAI_ZONES } from '../../data/chennaiGeo';
import type { NavTab } from './Sidebar';

interface TopNavbarProps {
  currentTab: NavTab;
  selectedZone: number | null;
  onSelectZone: (zoneId: number | null) => void;
  isBackendConnected: boolean;
  onRefreshBackend: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onGlobalSearch?: (query: string) => void;
  onToggleAssistantDrawer?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab,
  selectedZone,
  onSelectZone,
  isBackendConnected,
  onRefreshBackend,
  unreadAlertsCount,
  onOpenAlerts,
  onGlobalSearch,
  onToggleAssistantDrawer,
}) => {
  const { user, logout } = useAuth();
  const [timeString, setTimeString] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ' ' + now.toLocaleTimeString('en-GB', { hour12: false }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: { title: 'COMMAND OVERVIEW', subtitle: 'Integrated Urban Situational Awareness' },
    streaming: { title: 'KAFKA & SPARK STREAMING', subtitle: 'Distributed Big Data & Real-Time ML Pipelines' },
    flood: { title: 'FLOOD INTELLIGENCE', subtitle: 'Hydrological Modeling & Inundation Prediction' },
    rainfall: { title: 'RAINFALL & WEATHER', subtitle: 'Doppler Radar & Station Precipitation Observations' },
    traffic: { title: 'TRAFFIC INTELLIGENCE', subtitle: 'Arterial Corridor Velocity & Waterlog Chokepoints' },
    'risk-zones': { title: 'RISK ZONES & CLUSTERS', subtitle: 'K-Means Geospatial Archetype Segmentation' },
    assistant: { title: 'AI URBAN ASSISTANT', subtitle: 'Grounded RAG & On-Demand Machine Learning Execution' },
    'knowledge-base': { title: 'KNOWLEDGE BASE & SOPs', subtitle: 'Disaster Management Documents & Vector Store' },
    'user-management': { title: 'SECURITY GOVERNANCE', subtitle: 'Operator Directory & Role-Based Access Control' },
    'ai-insights': { title: 'TACTICAL AI INSIGHTS', subtitle: 'Deterministic Multi-Source Operational Analysis' },
    alerts: { title: 'ALERTS & EMERGENCY DISPATCH', subtitle: 'Greater Chennai Disaster Management Protocols' },
    'model-performance': { title: 'MODEL MONITORING', subtitle: 'Random Forest & Clustering Benchmarks' },
    'data-sources': { title: 'DATA SOURCES CATALOG', subtitle: 'Municipal Telemetry & API Endpoints' },
    settings: { title: 'SYSTEM SETTINGS', subtitle: 'Simulation Parameters & Service Connectors' },
  };

  const meta = titles[currentTab] || titles.overview;

  return (
    <header className="h-16 px-6 bg-[#0A101D] border-b border-slate-800 flex items-center justify-between gap-4 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>CHENNAI METRO</span>
            <span>/</span>
            <span className="text-[#35D9F5]">{meta.title}</span>
          </div>
          <h1 className="text-sm font-bold font-mono tracking-wider text-white">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Center Controls: Zone Selector & Search */}
      <div className="hidden md:flex items-center gap-3">
        {/* Chennai Zone / Ward Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#101827] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-mono">
          <MapPin className="w-3.5 h-3.5 text-[#35D9F5]" />
          <select
            value={selectedZone ?? ''}
            onChange={(e) => onSelectZone(e.target.value ? parseInt(e.target.value) : null)}
            className="bg-transparent text-slate-200 focus:outline-none text-xs font-mono cursor-pointer"
          >
            <option value="" className="bg-[#101827]">All Chennai Wards (15 Zones)</option>
            {CHENNAI_ZONES.map((zone) => (
              <option key={zone.id} value={zone.id} className="bg-[#101827]">
                {zone.zoneNo} — {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-[#101827] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search road or ward..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              if (onGlobalSearch) onGlobalSearch(e.target.value);
            }}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-36 font-mono"
          />
        </div>
      </div>

      {/* Right Controls: Backend Status, Clock, Alerts & User */}
      <div className="flex items-center gap-4">
        {/* Live Backend Indicator */}
        <div className="flex items-center gap-2">
          {isBackendConnected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>FASTAPI LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>DEMO MODE</span>
            </div>
          )}
          <button
            onClick={onRefreshBackend}
            title="Refresh backend status"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Ticking Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-[#101827] px-2.5 py-1 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-[#35D9F5]" />
          <span>{timeString}</span>
        </div>

        {/* AI Copilot Quick Drawer Trigger */}
        {onToggleAssistantDrawer && (
          <button
            onClick={onToggleAssistantDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142338] hover:bg-[#1b2f4a] border border-[#35D9F5]/40 text-[#35D9F5] text-xs font-mono font-bold transition-all shadow-sm"
            title="Open AI Urban Copilot"
          >
            <Bot className="w-4 h-4 animate-pulse" />
            <span className="hidden lg:inline">AI COPILOT</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg bg-[#101827] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Open Alerts Center"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Command Operator Avatar Badge & Logout */}
        <div className="flex items-center gap-2 bg-[#101827] border border-slate-800 px-2.5 py-1 rounded-lg">
          <div className="w-6 h-6 rounded bg-[#35D9F5]/20 text-[#35D9F5] border border-[#35D9F5]/40 flex items-center justify-center text-xs font-mono font-bold">
            {user?.role === 'Admin' ? 'AD' : user?.role === 'Analyst' ? 'AN' : 'OP'}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[11px] font-bold text-white font-mono leading-none truncate max-w-[120px]">
              {user?.full_name || user?.username || 'COMMANDER'}
            </span>
            <span className="text-[9px] text-[#35D9F5] font-mono uppercase">
              {user?.role || 'GCC DISASTER UNIT'}
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="ml-1 p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Sign out of command session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
