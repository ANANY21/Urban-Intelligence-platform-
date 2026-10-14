import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { AlertDrawer } from './components/alerts/AlertDrawer';
import { AssistantDrawer } from './components/assistant/AssistantDrawer';
import { StreamingBar } from './components/streaming/StreamingBar';

// Authentication Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Operational Command Pages
import { Overview } from './pages/Overview';
import { StreamingBigData } from './pages/StreamingBigData';
import { FloodIntelligence } from './pages/FloodIntelligence';
import { RainfallWeather } from './pages/RainfallWeather';
import { TrafficIntelligence } from './pages/TrafficIntelligence';
import { RiskZones } from './pages/RiskZones';
import { Assistant } from './pages/Assistant';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { UserManagement } from './pages/UserManagement';
import { AIInsights } from './pages/AIInsights';
import { AlertsCenter } from './pages/AlertsCenter';
import { ModelPerformance } from './pages/ModelPerformance';
import { DataSources } from './pages/DataSources';
import { Settings } from './pages/Settings';

import { checkBackendHealth } from './services/api';
import { DEMO_ALERTS } from './data/demoData';
import { Bot, Sparkles, Radio, Shield } from 'lucide-react';

function CommandCenter() {
  const { user, loading, isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [alertDrawerOpen, setAlertDrawerOpen] = useState<boolean>(false);
  const [assistantDrawerOpen, setAssistantDrawerOpen] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  // Probe backend on mount and on refresh
  const refreshBackendStatus = async () => {
    const health = await checkBackendHealth();
    setIsBackendConnected(health.status === 'online');
  };

  useEffect(() => {
    refreshBackendStatus();
    const interval = setInterval(refreshBackendStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlertsCount = DEMO_ALERTS.filter((a) => !a.acknowledged).length;

  const handleSelectHotspot = (hotspotKey: string, lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setCurrentTab('flood');
  };

  const handleSelectAlertLocation = (coords: [number, number]) => {
    setSelectedLocation(coords);
    setCurrentTab('overview');
  };

  // 1. Initial Authentication Loading State
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#080D16] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#35D9F5]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#101827] border border-[#35D9F5]/40 flex items-center justify-center text-[#35D9F5] mb-5 shadow-2xl shadow-[#35D9F5]/20 animate-pulse">
            <Radio className="w-8 h-8 text-[#35D9F5]" />
          </div>
          <p className="text-[11px] font-mono tracking-widest text-[#35D9F5] uppercase mb-1">
            CHENNAI METROPOLITAN GEOSPATIAL COMMAND
          </p>
          <h2 className="text-xl font-bold text-white font-sans tracking-wide">
            INITIALIZING SECURE SESSION
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Validating cryptographic credentials &bull; Connecting to FastAPI ML Cluster
          </p>
          <div className="mt-6 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#35D9F5] animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Render Command Center Login or Registration
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register
          onSuccess={() => setCurrentTab('overview')}
          onNavigateLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onSuccess={() => setCurrentTab('overview')}
        onNavigateRegister={() => setAuthView('register')}
      />
    );
  }

  // 3. Authenticated State -> Render Full Platform
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080D16] text-slate-100 font-sans selection:bg-[#35D9F5]/30 selection:text-white">
      {/* Scanline Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none scanline-overlay z-50 opacity-40" />

      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        unreadAlertsCount={unreadAlertsCount}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          currentTab={currentTab}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          isBackendConnected={isBackendConnected}
          onRefreshBackend={refreshBackendStatus}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => setAlertDrawerOpen(true)}
          onToggleAssistantDrawer={() => setAssistantDrawerOpen((prev) => !prev)}
        />

        {/* Real-Time Kafka & Spark Streaming Status & Quick Controls */}
        <StreamingBar onOpenStreamingTab={() => setCurrentTab('streaming')} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          {currentTab === 'overview' && (
            <Overview
              onNavigateTab={setCurrentTab}
              onSelectHotspot={handleSelectHotspot}
              isBackendConnected={isBackendConnected}
            />
          )}

          {currentTab === 'assistant' && (
            <Assistant />
          )}

          {currentTab === 'knowledge-base' && (
            <KnowledgeBase />
          )}

          {currentTab === 'user-management' && (
            <UserManagement />
          )}

          {currentTab === 'streaming' && (
            <StreamingBigData />
          )}

          {currentTab === 'flood' && (
            <FloodIntelligence />
          )}

          {currentTab === 'rainfall' && (
            <RainfallWeather />
          )}

          {currentTab === 'traffic' && (
            <TrafficIntelligence />
          )}

          {currentTab === 'risk-zones' && (
            <RiskZones />
          )}

          {currentTab === 'ai-insights' && (
            <AIInsights />
          )}

          {currentTab === 'alerts' && (
            <AlertsCenter />
          )}

          {currentTab === 'model-performance' && (
            <ModelPerformance />
          )}

          {currentTab === 'data-sources' && (
            <DataSources />
          )}

          {currentTab === 'settings' && (
            <Settings
              isBackendConnected={isBackendConnected}
              onRefreshBackend={refreshBackendStatus}
            />
          )}
        </main>
      </div>

      {/* Slide-out Alert Drawer */}
      <AlertDrawer
        isOpen={alertDrawerOpen}
        onClose={() => setAlertDrawerOpen(false)}
        onSelectAlertLocation={handleSelectAlertLocation}
      />

      {/* Slide-out AI Assistant Drawer */}
      <AssistantDrawer
        isOpen={assistantDrawerOpen}
        onClose={() => setAssistantDrawerOpen(false)}
        onOpenFullPage={() => {
          setAssistantDrawerOpen(false);
          setCurrentTab('assistant');
        }}
      />

      {/* Floating Action Button for AI Assistant Drawer */}
      {!assistantDrawerOpen && currentTab !== 'assistant' && (
        <button
          onClick={() => setAssistantDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-r from-[#35D9F5] to-blue-600 hover:from-[#35D9F5]/90 hover:to-blue-500 text-[#080D16] font-bold rounded-2xl shadow-xl shadow-[#35D9F5]/25 flex items-center gap-2 group transition-all transform hover:scale-105"
          title="Open AI Command Copilot"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-mono tracking-wider font-extrabold uppercase">
            Ask Copilot
          </span>
          <span className="w-2 h-2 rounded-full bg-[#080D16] animate-ping" />
        </button>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <CommandCenter />
    </AuthProvider>
  );
}

export default App;
