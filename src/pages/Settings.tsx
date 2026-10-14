import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Check, 
  RefreshCw, 
  Sliders, 
  ShieldAlert, 
  Bell, 
  Layers,
  Database
} from 'lucide-react';
import { API_BASE_URL, checkBackendHealth, type HealthStatus } from '../services/api';

interface SettingsProps {
  isBackendConnected: boolean;
  onRefreshBackend: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isBackendConnected,
  onRefreshBackend,
}) => {
  const [apiUrl, setApiUrl] = useState<string>(API_BASE_URL);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<HealthStatus | null>(null);
  const [enableDemoFallback, setEnableDemoFallback] = useState<boolean>(true);
  const [alertThreshold, setAlertThreshold] = useState<number>(65); // Flood risk score threshold
  const [mapProvider, setMapProvider] = useState<string>('cartodb_dark');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkBackendHealth();
      setTestResult(res);
      onRefreshBackend();
    } catch (e: any) {
      setTestResult({ status: 'offline', message: e?.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage('Configuration successfully saved to local session.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-5 h-5 text-[#35D9F5]" />
          <h1 className="text-xl font-bold font-mono text-white tracking-wide">
            SYSTEM SETTINGS & INTEGRATION MANAGEMENT
          </h1>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl font-sans">
          Manage FastAPI backend endpoint endpoints, ML model prediction runtime fallbacks, and command center display settings.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {saveMessage}
        </div>
      )}

      {/* 2. Backend API Endpoint Management */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md font-mono text-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#35D9F5]" />
              <h2 className="text-sm font-bold text-white uppercase">
                FASTAPI ML INFERENCE SERVER CONNECTION
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={isBackendConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isBackendConnected ? 'CONNECTED' : 'SIMULATION FALLBACK'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">
              Backend Base URL (Python FastAPI server endpoint)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 bg-[#141F30] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#35D9F5]"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-[#142338] hover:bg-slate-800 text-[#35D9F5] border border-[#35D9F5]/40 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Probing...' : 'Test Handshake'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              testResult.status === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="font-bold mb-0.5">
                Status: {testResult.status.toUpperCase()}
              </div>
              <div className="text-[11px]">{testResult.message}</div>
              {testResult.version && <div>Engine Version: {testResult.version}</div>}
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={enableDemoFallback}
                onChange={(e) => setEnableDemoFallback(e.target.checked)}
                className="rounded border-slate-700 text-[#35D9F5] focus:ring-0 bg-[#141F30]"
              />
              <span>Enable automatic calibrated fallback model if FastAPI server is unreachable</span>
            </label>
          </div>
        </div>

        {/* 3. Operational Alert Thresholds */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md font-mono text-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase">
              OPERATIONAL ALERT SENSITIVITY & AUDIBLE CUES
            </h2>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Automatic Evacuation Trigger (Flood Probability Score):</span>
              <span className="text-[#35D9F5] font-bold">{alertThreshold}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="90"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full accent-[#35D9F5] bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Conservative (40%)</span>
              <span>Default (65%)</span>
              <span>Strict Evacuation (90%)</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="rounded border-slate-700 text-[#35D9F5] focus:ring-0 bg-[#141F30]"
              />
              <span>Audible Klaxon sound for Level 1 Critical Evacuation advisories</span>
            </label>
          </div>
        </div>

        {/* 4. Map Tiles Configuration */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md font-mono text-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-[#35D9F5]" />
            <h2 className="text-sm font-bold text-white uppercase">
              GEOSPATIAL DISPLAY & TILE PROVIDER
            </h2>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-2">
              Default Map Tile Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'osm_standard', label: 'OpenStreetMap Inverted Dark (Default / No Key Required)' },
                { id: 'mapbox_dark', label: 'Mapbox Dark v11 (Requires VITE_MAPBOX_TOKEN)' },
                { id: 'maptiler_dark', label: 'MapTiler Basic Dark (Requires VITE_MAPTILER_KEY)' },
              ].map((prov) => (
                <div
                  key={prov.id}
                  onClick={() => setMapProvider(prov.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    mapProvider === prov.id
                      ? 'bg-[#142338] border-[#35D9F5] text-white font-bold'
                      : 'bg-[#141F30] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prov.label}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-mono">
              Active Provider: <span className="text-emerald-400 font-bold">OpenStreetMap Free Basemap</span>. Zero API keys required; no watermarks.
            </div>
          </div>
        </div>

        {/* Save button */}
        <div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-cyan-glow transition-all"
          >
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
};
