import React from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  CloudRain, 
  Car, 
  Grid3X3, 
  Sparkles, 
  Bell, 
  Cpu, 
  Database, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Radio,
  Layers,
  Bot,
  BookOpen,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 
  | 'overview' 
  | 'streaming'
  | 'flood' 
  | 'rainfall' 
  | 'traffic' 
  | 'risk-zones' 
  | 'assistant'
  | 'knowledge-base'
  | 'user-management'
  | 'ai-insights' 
  | 'alerts' 
  | 'model-performance' 
  | 'data-sources' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  unreadAlertsCount: number;
  isBackendConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  unreadAlertsCount,
  isBackendConnected,
}) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Command Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'assistant', label: 'AI Urban Assistant', icon: <Bot className="w-4 h-4 text-[#35D9F5]" /> },
    { id: 'knowledge-base', label: 'Knowledge Base (RAG)', icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
    ...(isAdmin ? [{ id: 'user-management', label: 'User Directory (RBAC)', icon: <Users className="w-4 h-4 text-purple-400" /> }] : []),
    { id: 'streaming', label: 'Kafka & Spark Stream', icon: <Radio className="w-4 h-4 text-cyan-400" /> },
    { id: 'flood', label: 'Flood Intelligence', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'rainfall', label: 'Rainfall & Weather', icon: <CloudRain className="w-4 h-4" /> },
    { id: 'traffic', label: 'Traffic Mobility', icon: <Car className="w-4 h-4" /> },
    { id: 'risk-zones', label: 'Risk Zones (K-Means)', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'ai-insights', label: 'AI Tactical Insights', icon: <Sparkles className="w-4 h-4" /> },
    { 
      id: 'alerts', 
      label: 'Alerts & Dispatch', 
      icon: <Bell className="w-4 h-4" />, 
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined 
    },
    { id: 'model-performance', label: 'Model Performance', icon: <Cpu className="w-4 h-4" /> },
    { id: 'data-sources', label: 'Data Sources Catalog', icon: <Database className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ] as const;

  return (
    <aside
      className={`relative h-screen bg-[#0A101D] border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Custom Smart City Hexagon Logo Mark */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#35D9F5] to-blue-700 flex items-center justify-center shrink-0 shadow-cyan-sm">
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Layers className="w-5 h-5 text-black" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-mono text-xs font-black tracking-wider text-white">
                  URBAN<span className="text-[#35D9F5]">INTEL</span>
                </span>
                <span className="font-mono text-[9px] tracking-widest text-slate-400">
                  CHENNAI COMMAND
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#142338] text-[#35D9F5] font-semibold border border-[#35D9F5]/30 shadow-cyan-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:bg-[#101827]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#35D9F5] rounded-r-full" />
                )}

                <div className={`shrink-0 ${isActive ? 'text-[#35D9F5]' : 'group-hover:text-white'}`}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}

                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Operational Telemetry Footer */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="bg-[#101827] rounded-lg p-2.5 border border-slate-800/80 font-mono text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Radio className={`w-3 h-3 ${isBackendConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                SYSTEM STATE
              </span>
              <span className={isBackendConnected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {isBackendConnected ? 'ONLINE' : 'DEMO'}
              </span>
            </div>
            <div className="text-slate-400 truncate">
              CORE: <span className="text-slate-200">FastAPI ML v2.4</span>
            </div>
            <div className="text-slate-400 truncate">
              ZONE: <span className="text-[#35D9F5]">Greater Chennai (GCC)</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={isBackendConnected ? 'FastAPI Online' : 'Simulation Demo'}>
            <span className={`w-3 h-3 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
        )}
      </div>
    </aside>
  );
};
