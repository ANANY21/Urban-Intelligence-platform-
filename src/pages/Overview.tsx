import React from 'react';
import { ChennaiCommandMap } from '../components/maps/ChennaiCommandMap';
import { MetricCard } from '../components/metrics/MetricCard';
import { RainfallTimelineChart } from '../components/charts/RainfallTimelineChart';
import { TrafficFlowChart } from '../components/charts/TrafficFlowChart';
import { 
  DEMO_CITY_METRICS, 
  DEMO_ALERTS, 
  DEMO_AI_INSIGHTS, 
  DEMO_CLUSTERS 
} from '../data/demoData';
import { CHENNAI_ZONES } from '../data/chennaiGeo';
import { 
  ShieldAlert, 
  CloudRain, 
  Car, 
  Bell, 
  Sparkles, 
  Radio, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Droplets,
  Layers
} from 'lucide-react';
import { RiskBadge, SeverityBadge } from '../components/common/Badge';

interface OverviewProps {
  onNavigateTab: (tab: any) => void;
  onSelectHotspot: (hotspotKey: string, lat: number, lng: number) => void;
  isBackendConnected: boolean;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigateTab,
  onSelectHotspot,
  isBackendConnected,
}) => {
  const metrics = DEMO_CITY_METRICS;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Hero Section */}
      <div className="relative bg-gradient-to-r from-[#101827] via-[#142338] to-[#0A101D] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35D9F5]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-[#35D9F5] uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                GREATER CHENNAI CORPORATION // UNIFIED CRISIS PLATFORM
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Chennai Urban Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans leading-relaxed">
              Unified situational awareness for rainfall, flooding, mobility, and urban risk. Live telemetry synchronized across 15 GCC administrative zones.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-md flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">CITY SURGE STATUS</div>
                <div className="text-xs font-mono font-black text-red-400">
                  {metrics.monsoonWatchLevel}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#35D9F5]" />
              <span>CYCLE: 5-MIN SYNCHRONIZATION</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Flood Risk Index */}
        <MetricCard
          title="Flood Risk Index"
          value={metrics.floodRiskIndex.value}
          unit="/ 100"
          definition="Aggregated catchment run-off index"
          trend={metrics.floodRiskIndex.trend}
          statusText={metrics.floodRiskIndex.statusText}
          statusVariant="red"
          sparkline={metrics.floodRiskIndex.sparkline}
          isDemo={!isBackendConnected}
          icon={<ShieldAlert className="w-4 h-4" />}
          onClick={() => onNavigateTab('flood')}
        />

        {/* Metric 2: Current Rainfall Intensity */}
        <MetricCard
          title="Rainfall Intensity"
          value={metrics.rainfallIntensity.currentMmPerHour}
          unit="mm/h"
          definition="Peak IMD radar precipitation rate"
          trend={metrics.rainfallIntensity.trend}
          statusText={metrics.rainfallIntensity.statusText}
          statusVariant="blue"
          sparkline={metrics.rainfallIntensity.sparkline}
          isDemo={!isBackendConnected}
          icon={<CloudRain className="w-4 h-4" />}
          onClick={() => onNavigateTab('rainfall')}
        />

        {/* Metric 3: Traffic Congestion Index */}
        <MetricCard
          title="Traffic Congestion"
          value={metrics.trafficCongestion.index}
          unit="%"
          definition="Average arterial corridor travel delay"
          trend={metrics.trafficCongestion.trend}
          statusText={metrics.trafficCongestion.statusText}
          statusVariant="amber"
          sparkline={metrics.trafficCongestion.sparkline}
          isDemo={!isBackendConnected}
          icon={<Car className="w-4 h-4" />}
          onClick={() => onNavigateTab('traffic')}
        />

        {/* Metric 4: Active Critical Alerts */}
        <MetricCard
          title="Active Alerts"
          value={metrics.activeAlerts.total}
          unit="ALERTS"
          definition="3 critical flood & subway closures"
          trend={metrics.activeAlerts.trend}
          statusText={metrics.activeAlerts.statusText}
          statusVariant="red"
          sparkline={metrics.activeAlerts.sparkline}
          isDemo={!isBackendConnected}
          icon={<Bell className="w-4 h-4" />}
          onClick={() => onNavigateTab('alerts')}
        />
      </div>

      {/* 3. Centerpiece Layout: Chennai Map (60%) + Tactical Feeds (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Map (7 Cols on desktop = ~58%) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#35D9F5]" />
              <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                CHENNAI METROPOLITAN GEOSPATIAL COMMAND CENTER
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              CLICK MARKER TO INSPECT & SIMULATE
            </span>
          </div>

          <ChennaiCommandMap
            className="h-[560px]"
            onSelectHotspot={onSelectHotspot}
          />
        </div>

        {/* Side Panel (5 Cols = ~42%): AI Summary + Critical Alerts */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* AI Situational Summary Box */}
          <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#35D9F5]" />
                <h3 className="text-xs font-mono font-bold text-white tracking-wider">
                  TACTICAL SITUATIONAL SYNTHESIS
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-[#35D9F5] border border-cyan-500/30">
                DETERMINISTIC
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
              Heavy convective rainfall (<span className="text-blue-400 font-bold">34.6 mm/h</span>) over the Adyar and Chembarambakkam basins has elevated spillway discharge to <span className="text-amber-400 font-bold">4,500 cusecs</span>. Lowland sectors in <span className="text-red-400 font-bold">Velachery (Zone XIV)</span> and <span className="text-red-400 font-bold">Saidapet</span> face compound tidal retarding between 01:30 and 03:00 IST.
            </p>

            <div className="space-y-2">
              {DEMO_AI_INSIGHTS.slice(0, 2).map((item) => (
                <div key={item.id} className="p-3 bg-[#141F30]/80 rounded-lg border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white truncate">{item.title}</span>
                    <SeverityBadge severity={item.severity} />
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mb-1.5">{item.description}</div>
                  <div className="text-[10px] text-[#35D9F5] font-sans flex items-center gap-1">
                    <span>Action:</span> {item.suggestedAction}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('ai-insights')}
              className="mt-3 w-full py-1.5 text-xs font-mono text-[#35D9F5] hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded transition-colors flex items-center justify-center gap-1"
            >
              View Full Tactical Advisory Report &rarr;
            </button>
          </div>

          {/* Active Priority Alerts Drawer Teaser */}
          <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md flex-1">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-mono font-bold text-white tracking-wider">
                  CRITICAL DISPATCH FEED
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-[11px] font-mono text-[#35D9F5] hover:underline"
              >
                View All ({DEMO_ALERTS.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {DEMO_ALERTS.slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-3 bg-[#141F30]/60 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-[10px] font-mono text-slate-500">{alert.timestamp}</span>
                  </div>
                  <div className="font-bold text-slate-100 font-sans text-xs mb-1">{alert.title}</div>
                  <div className="text-[11px] text-slate-400 font-sans line-clamp-1">{alert.description}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">{alert.location}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Secondary Analytics Row: 24h Rainfall Timeline + Arterial Corridor Mobility */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <RainfallTimelineChart />
        </div>
        <div className="lg:col-span-6">
          <TrafficFlowChart />
        </div>
      </div>

      {/* 5. Monitored Chennai Zones Quick Matrix */}
      <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
              GREATER CHENNAI CORPORATION — 15 ADMINISTRATIVE ZONES STATUS
            </div>
            <div className="text-[11px] text-slate-500 font-sans">
              Real-time cross-zonal inundation and traffic delay telemetry
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">15 MONITORED WARDS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CHENNAI_ZONES.map((zone) => (
            <div
              key={zone.id}
              onClick={() => {
                const key = zone.name.toLowerCase().includes('velachery') ? 'velachery' : 'adyar';
                onSelectHotspot(key, zone.center[0], zone.center[1]);
              }}
              className="p-3 bg-[#141F30]/60 hover:bg-[#141F30] border border-slate-800 hover:border-[#35D9F5]/40 rounded-lg cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>{zone.zoneNo}</span>
                <span className={`w-2 h-2 rounded-full ${
                  zone.riskLevel === 'critical' ? 'bg-red-500 animate-pulse' :
                  zone.riskLevel === 'high' ? 'bg-orange-500' :
                  zone.riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              </div>
              <div className="font-bold text-white text-xs truncate mb-2">{zone.name}</div>
              <div className="space-y-0.5 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Rain:</span> <span className="text-blue-400 font-semibold">{zone.rainfallMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Traffic:</span> <span className="text-amber-400 font-semibold">{zone.congestionIndex}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
