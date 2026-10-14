import React, { useState } from 'react';
import type { RainfallClusterResult } from '../../types';
import { clusterRainfall } from '../../services/api';
import { 
  CloudRain, 
  Droplets, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Play, 
  Sliders, 
  Activity,
  Compass,
  Search
} from 'lucide-react';

interface RainfallZone {
  id: number;
  name: string;
  zoneCategory: string;
  color: string;
  description: string;
  stationCount: number;
  avgDailyRainfallMm: number;
  maxStormRecordMm: number;
  annualHeavyRainDays: number;
  keyStations: string[];
  drainageInfrastructureStrategy: string;
}

const RAINFALL_ZONES: RainfallZone[] = [
  {
    id: 0,
    name: 'Inland & Leeward Lower Precipitation Zone',
    zoneCategory: 'Lower Rainfall Zone',
    color: '#10B981',
    description: 'Inland western catchments experiencing reduced coastal cloud moisture and lower extreme storm surges.',
    stationCount: 22,
    avgDailyRainfallMm: 8.4,
    maxStormRecordMm: 112.5,
    annualHeavyRainDays: 6.2,
    keyStations: ['Ambathur', 'Puzhal', 'Madhavaram', 'Valasaravakkam', 'Zone 07 Ambattur', 'Zone 11 Maduravoyal'],
    drainageInfrastructureStrategy: 'Local percolation ponds, lake rejuvenation (Puzhal/Chembarambakkam feeders), and localized tertiary storm drains.'
  },
  {
    id: 1,
    name: 'Metropolitan Core Intermediate Precipitation Zone',
    zoneCategory: 'Medium Rainfall Zone',
    color: '#35D9F5',
    description: 'Central urbanized GCC wards subjected to moderate cyclonic downpours and high impervious surface runoff.',
    stationCount: 26,
    avgDailyRainfallMm: 12.1,
    maxStormRecordMm: 184.2,
    annualHeavyRainDays: 11.8,
    keyStations: ['Anna Nagar', 'Kodambakkam', 'Teynampet', 'Mylapore-Triplicane', 'Alandur', 'Govt Arts College', 'DGP Office'],
    drainageInfrastructureStrategy: 'Micro-canal widening into Buckingham Canal, Cooum river interlinking, and stormwater pumping stations for railway underpasses.'
  },
  {
    id: 2,
    name: 'Coastal & Estuary Heavy Surge Zone',
    zoneCategory: 'High Rainfall Zone',
    color: '#EF4444',
    description: 'Marine-facing coastal fringe receiving direct cyclonic cloudbursts, oceanic moisture convergence, and tidal backwater challenges.',
    stationCount: 14,
    avgDailyRainfallMm: 18.2,
    maxStormRecordMm: 286.0,
    annualHeavyRainDays: 19.4,
    keyStations: ['Chennai nungambakkam', 'Sholinganallur', 'Chennai port trust', 'Adyar Eco Park', 'Zone 15 Uthandi', 'Zone 01 Thiruvottiyur'],
    drainageInfrastructureStrategy: 'Tidal flap gates to prevent high-tide sea water backflow, massive cut-and-cover surplus storm channels, and wetland mangrove preservation.'
  }
];

export const RainfallClusterPanel: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<number>(2);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Form state for custom station clustering
  const [testMean, setTestMean] = useState<number>(18.5);
  const [testMax, setTestMax] = useState<number>(240);
  const [testHeavyDays, setTestHeavyDays] = useState<number>(18);
  const [clusterResult, setClusterResult] = useState<RainfallClusterResult | null>(null);

  const activeZone = RAINFALL_ZONES.find(z => z.id === selectedZoneId) || RAINFALL_ZONES[0];

  const handleTestCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await clusterRainfall({
        mean_rainfall: testMean,
        max_rainfall: testMax,
        heavy_rain_days: testHeavyDays,
        moderate_rain_days: 15,
      });
      setClusterResult(res);
      setSelectedZoneId(res.cluster_id);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = activeZone.keyStations.filter(s => 
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold font-mono text-white tracking-wide">
              K-MEANS PRECIPITATION REGIME & VULNERABILITY ZONES
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Clustering 62 Chennai IMD & GCC meteorological stations into 3 empirical macro-catchment precipitation zones.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Total Observatories:</span>
          <span className="text-[#35D9F5] font-bold">62 IMD Stations Clustered</span>
        </div>
      </div>

      {/* 3 Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RAINFALL_ZONES.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer font-mono select-none ${
                isSelected
                  ? 'bg-[#142338] border-[#35D9F5] shadow-cyan-sm'
                  : 'bg-[#141F30]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 uppercase">ZONE #{zone.id}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
              </div>

              <div className="font-bold text-white text-xs mb-2">
                {zone.zoneCategory}
              </div>

              <div className="space-y-1 text-[10px] text-slate-400">
                <div className="flex justify-between">
                  <span>Stations:</span>
                  <span className="text-white font-bold">{zone.stationCount} Observatories</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Avg:</span>
                  <span className="text-[#35D9F5] font-bold">{zone.avgDailyRainfallMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Cloudburst:</span>
                  <span className="text-red-400 font-bold">{zone.maxStormRecordMm} mm</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Grid: Zone Details (7 Cols) + Custom Profiler (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Zone Details */}
        <div className="lg:col-span-7 bg-[#141F30]/80 p-5 rounded-xl border border-slate-800 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">ZONE #{activeZone.id} DETAILED PROFILE</span>
              <h3 className="text-base font-bold text-white mt-0.5">{activeZone.name}</h3>
            </div>
            <span
              className="px-2.5 py-1 rounded text-[11px] font-bold uppercase"
              style={{ backgroundColor: `${activeZone.color}20`, color: activeZone.color, border: `1px solid ${activeZone.color}40` }}
            >
              {activeZone.zoneCategory}
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {activeZone.description}
          </p>

          {/* Meteorological Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">DAILY MEAN</span>
              <span className="text-sm font-bold text-[#35D9F5]">{activeZone.avgDailyRainfallMm} mm</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">MAX RECORD</span>
              <span className="text-sm font-bold text-red-400">{activeZone.maxStormRecordMm} mm</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">HEAVY DAYS/YR</span>
              <span className="text-sm font-bold text-amber-400">{activeZone.annualHeavyRainDays}</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">STATIONS</span>
              <span className="text-sm font-bold text-white">{activeZone.stationCount}</span>
            </div>
          </div>

          {/* Stations Search and Badges */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold uppercase">MEMBER OBSERVATORIES:</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter stations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#080D16] border border-slate-700 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#080D16]/40 rounded-lg border border-slate-800/80">
              {filteredStations.map((station) => (
                <span
                  key={station}
                  className="px-2 py-1 rounded bg-[#101827] border border-slate-700/60 text-slate-300 text-[10px] flex items-center gap-1"
                >
                  <MapPin className="w-2.5 h-2.5 text-blue-400" />
                  {station}
                </span>
              ))}
            </div>
          </div>

          {/* Drainage Strategy */}
          <div className="p-3 bg-[#080D16]/60 rounded-lg border border-slate-800 text-xs font-sans">
            <span className="font-bold font-mono text-[#35D9F5] block mb-1 text-[11px] uppercase">
              Catchment Hydrology & GCC Stormwater Action Plan:
            </span>
            <span className="text-slate-300 text-xs">{activeZone.drainageInfrastructureStrategy}</span>
          </div>
        </div>

        {/* Custom Station Profiler */}
        <div className="lg:col-span-5 bg-[#141F30]/80 p-5 rounded-xl border border-slate-800 space-y-4 font-mono">
          <div className="pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              CLASSIFY NEW OBSERVATORY PROFILE
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Submit micro-catchment climate metrics into K-Means clustering.
            </div>
          </div>

          <form onSubmit={handleTestCluster} className="space-y-3 text-xs">
            <div className="space-y-2">
              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Historical Mean Daily Rainfall (mm)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={testMean}
                  onChange={(e) => setTestMean(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Recorded Max 24H Storm Event (mm)
                </label>
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={testMax}
                  onChange={(e) => setTestMax(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Annual Heavy Rain Days (&gt;64.5 mm)
                </label>
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={testHeavyDays}
                  onChange={(e) => setTestHeavyDays(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 text-black font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all text-xs"
            >
              {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              PARTITION INTO PRECIPITATION ZONE
            </button>
          </form>

          {clusterResult && (
            <div className="p-3 bg-[#080D16] rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">ASSIGNED ZONE:</span>
                <span className="font-bold" style={{ color: clusterResult.color }}>
                  #{clusterResult.cluster_id} {clusterResult.zone_category}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                {clusterResult.description}
              </p>
            </div>
          )}

          <div className="text-[10px] text-slate-500 font-sans flex items-start gap-1.5 pt-1">
            <Info className="w-3.5 h-3.5 shrink-0 text-blue-400 mt-0.5" />
            <span>K-Means clustering applies Euclidean distance across aggregated station climatological parameters.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
