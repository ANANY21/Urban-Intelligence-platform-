import React, { useState } from 'react';
import type { TrafficClusterResult } from '../../types';
import { clusterTraffic } from '../../services/api';
import { 
  Grid3X3, 
  Car, 
  Bike, 
  Bus, 
  Truck, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Compass, 
  Activity,
  Layers
} from 'lucide-react';

interface ClusterArchetype {
  id: number;
  name: string;
  archetype: string;
  color: string;
  avgCars: number;
  avgBikes: number;
  avgBuses: number;
  avgTrucks: number;
  avgTotal: number;
  dominantSituation: string;
  chennaiContext: string;
  mitigationStrategy: string;
}

const TRAFFIC_ARCHETYPES: ClusterArchetype[] = [
  {
    id: 0,
    name: 'Off-Peak Free-Flow Pattern',
    archetype: 'Unconstrained vehicular movement with sparse corridor density across all modes.',
    color: '#10B981',
    avgCars: 14,
    avgBikes: 9,
    avgBuses: 2,
    avgTrucks: 3,
    avgTotal: 28,
    dominantSituation: 'low',
    chennaiContext: 'Nighttime arterial flow along ECR, Inner Ring Road, and GST Road after 22:30 IST.',
    mitigationStrategy: 'Standard sensor-actuated flashing amber signals and automated speed compliance cameras.'
  },
  {
    id: 1,
    name: 'Two-Wheeler Commuter Surge',
    archetype: 'Disproportionate two-wheeler volume with moderate passenger vehicle presence.',
    color: '#35D9F5',
    avgCars: 44,
    avgBikes: 56,
    avgBuses: 9,
    avgTrucks: 5,
    avgTotal: 114,
    dominantSituation: 'normal',
    chennaiContext: 'Morning and evening rush along Anna Salai, Arcot Road, and Velachery Main Road.',
    mitigationStrategy: 'Dedicated motorcycle stop boxes at intersections; grade-separated U-turns to mitigate weaving.'
  },
  {
    id: 2,
    name: 'Peak Congestion Gridlock',
    archetype: 'Severe passenger car saturation exceeding geometric corridor carrying capacity.',
    color: '#EF4444',
    avgCars: 102,
    avgBikes: 74,
    avgBuses: 18,
    avgTrucks: 8,
    avgTotal: 202,
    dominantSituation: 'heavy',
    chennaiContext: 'OMR Tidel Park - SRP Tools junction, Kathipara flyover weave during 08:30–10:30 & 18:00–20:00.',
    mitigationStrategy: 'Dynamic tidal lane reversal, peak public transit shuttle priority, and metro feeder integration.'
  },
  {
    id: 3,
    name: 'Heavy Commercial / Logistics Transit',
    archetype: 'Freight heavy corridor with concentrated logistics trailers and intercity buses.',
    color: '#F59E0B',
    avgCars: 32,
    avgBikes: 22,
    avgBuses: 20,
    avgTrucks: 36,
    avgTotal: 110,
    dominantSituation: 'high',
    chennaiContext: 'Chennai Port - Ennore Express Highway, Manali Petroleum corridor, Maduravoyal bypass.',
    mitigationStrategy: 'Dedicated heavy-vehicle outer lanes, nighttime freight window scheduling, and weigh-in-motion sensors.'
  }
];

export const TrafficClusterPanel: React.FC = () => {
  const [selectedClusterId, setSelectedClusterId] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [testCars, setTestCars] = useState<number>(95);
  const [testBikes, setTestBikes] = useState<number>(75);
  const [testBuses, setTestBuses] = useState<number>(18);
  const [testTrucks, setTestTrucks] = useState<number>(8);
  const [clusterResult, setClusterResult] = useState<TrafficClusterResult | null>(null);

  const activeArchetype = TRAFFIC_ARCHETYPES.find(a => a.id === selectedClusterId) || TRAFFIC_ARCHETYPES[0];

  const handleTestCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await clusterTraffic({
        car_count: testCars,
        bike_count: testBikes,
        bus_count: testBuses,
        truck_count: testTrucks,
      });
      setClusterResult(res);
      setSelectedClusterId(res.cluster_id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-[#35D9F5]" />
            <h2 className="text-base font-bold font-mono text-white tracking-wide">
              K-MEANS MULTIMODAL TRAFFIC CLUSTER ARCHETYPES
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Unsupervised pattern partitioning of vehicle modal configurations into 4 distinct operational archetypes.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Reference Dataset:</span>
          <span className="text-[#35D9F5] font-bold">2,976 Hourly Observations</span>
        </div>
      </div>

      {/* 4 Archetype Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TRAFFIC_ARCHETYPES.map((arch) => {
          const isSelected = selectedClusterId === arch.id;
          return (
            <div
              key={arch.id}
              onClick={() => setSelectedClusterId(arch.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer font-mono select-none ${
                isSelected
                  ? 'bg-[#142338] border-[#35D9F5] shadow-cyan-sm'
                  : 'bg-[#141F30]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400">ARCHETYPE #{arch.id}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: arch.color }} />
              </div>

              <div className="font-bold text-white text-xs mb-2 truncate">
                {arch.name}
              </div>

              <div className="space-y-1 text-[10px] text-slate-400">
                <div className="flex justify-between">
                  <span>Avg Total:</span>
                  <span className="text-white font-bold">{arch.avgTotal} veh/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Dominant:</span>
                  <span className="uppercase font-bold" style={{ color: arch.color }}>{arch.dominantSituation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cars/Bikes:</span>
                  <span className="text-slate-300">{arch.avgCars} / {arch.avgBikes}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Grid: Selected Archetype Details (7 Cols) + Interactive Clustering Test Form (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Archetype Profile Card */}
        <div className="lg:col-span-7 bg-[#141F30]/80 p-5 rounded-xl border border-slate-800 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">CLUSTER #{activeArchetype.id} PROFILE</span>
              <h3 className="text-base font-bold text-white mt-0.5">{activeArchetype.name}</h3>
            </div>
            <span
              className="px-2.5 py-1 rounded text-[11px] font-bold uppercase"
              style={{ backgroundColor: `${activeArchetype.color}20`, color: activeArchetype.color, border: `1px solid ${activeArchetype.color}40` }}
            >
              {activeArchetype.dominantSituation} Congestion Regime
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {activeArchetype.archetype}
          </p>

          {/* Centroid Modal Vehicle Means */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">CARS</span>
              <span className="text-sm font-bold text-[#35D9F5]">{activeArchetype.avgCars}</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">BIKES</span>
              <span className="text-sm font-bold text-emerald-400">{activeArchetype.avgBikes}</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">BUSES</span>
              <span className="text-sm font-bold text-amber-400">{activeArchetype.avgBuses}</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">TRUCKS</span>
              <span className="text-sm font-bold text-red-400">{activeArchetype.avgTrucks}</span>
            </div>
            <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block">TOTAL</span>
              <span className="text-sm font-bold text-white">{activeArchetype.avgTotal}</span>
            </div>
          </div>

          {/* Context & Smart City Mitigation */}
          <div className="space-y-3 pt-2 text-xs font-sans">
            <div className="p-3 bg-[#080D16]/60 rounded-lg border border-slate-800">
              <span className="font-bold font-mono text-[#35D9F5] block mb-1 text-[11px] uppercase">
                Typical Chennai Corridors & Time Slots:
              </span>
              <span className="text-slate-300 text-xs">{activeArchetype.chennaiContext}</span>
            </div>

            <div className="p-3 bg-[#080D16]/60 rounded-lg border border-slate-800">
              <span className="font-bold font-mono text-emerald-400 block mb-1 text-[11px] uppercase">
                Intelligent Transportation Systems (ITS) Policy:
              </span>
              <span className="text-slate-300 text-xs">{activeArchetype.mitigationStrategy}</span>
            </div>
          </div>
        </div>

        {/* Interactive Cluster Assignment Tester */}
        <div className="lg:col-span-5 bg-[#141F30]/80 p-5 rounded-xl border border-slate-800 space-y-4 font-mono">
          <div className="pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              ASSIGN NEW VEHICULAR PROFILE
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Submit custom counts into the fitted K-Means distance pipeline.
            </div>
          </div>

          <form onSubmit={handleTestCluster} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">Cars</label>
                <input
                  type="number"
                  min={0}
                  value={testCars}
                  onChange={(e) => setTestCars(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">Two-Wheelers</label>
                <input
                  type="number"
                  min={0}
                  value={testBikes}
                  onChange={(e) => setTestBikes(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">Buses</label>
                <input
                  type="number"
                  min={0}
                  value={testBuses}
                  onChange={(e) => setTestBuses(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#080D16] p-2.5 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-400 block mb-1">Trucks</label>
                <input
                  type="number"
                  min={0}
                  value={testTrucks}
                  onChange={(e) => setTestTrucks(Number(e.target.value))}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="p-2 bg-[#080D16] rounded border border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>Total Volume:</span>
              <span className="font-bold text-white">{testCars + testBikes + testBuses + testTrucks} veh/hr</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#35D9F5] hover:bg-[#20b8d2] text-black font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all text-xs"
            >
              {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              CLASSIFY INTO K-MEANS CLUSTER
            </button>
          </form>

          {clusterResult && (
            <div className="p-3 bg-[#080D16] rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">ASSIGNED CLUSTER:</span>
                <span className="font-bold" style={{ color: clusterResult.color }}>
                  #{clusterResult.cluster_id} {clusterResult.cluster_name}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                {clusterResult.archetype}
              </p>
            </div>
          )}

          <div className="text-[10px] text-slate-500 font-sans flex items-start gap-1.5 pt-1">
            <Info className="w-3.5 h-3.5 shrink-0 text-[#35D9F5] mt-0.5" />
            <span>K-Means clustering uses StandardScaler normalized Euclidean distances across all 5 vehicular features.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
