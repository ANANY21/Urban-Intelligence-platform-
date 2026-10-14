import React, { useState } from 'react';
import { FloodPredictionPanel } from '../components/prediction/FloodPredictionPanel';
import { 
  DEMO_CLUSTERS, 
  DEMO_MODEL_METRICS,
  PRESET_PREDICTION_HOTSPOTS 
} from '../data/demoData';
import { CHENNAI_WATERWAYS } from '../data/chennaiGeo';
import { 
  ShieldAlert, 
  Droplets, 
  BarChart2, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell,
  LineChart,
  Line
} from 'recharts';

export const FloodIntelligence: React.FC = () => {
  // Historical reservoir water level timeline data (Chembarambakkam Lake)
  const reservoirLevels = [
    { time: '00:00', levelM: 21.2, capacityPercent: 82, dischargeCusecs: 1500 },
    { time: '04:00', levelM: 21.8, capacityPercent: 85, dischargeCusecs: 2000 },
    { time: '08:00', levelM: 22.4, capacityPercent: 88, dischargeCusecs: 2800 },
    { time: '12:00', levelM: 22.9, capacityPercent: 91, dischargeCusecs: 3500 },
    { time: '16:00', levelM: 23.3, capacityPercent: 93, dischargeCusecs: 4200 },
    { time: '20:00', levelM: 23.6, capacityPercent: 95, dischargeCusecs: 4500 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header Banner with Disclaimer */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                FLOOD INTELLIGENCE & INUNDATION WORKSPACE
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Supervised Machine Learning (Random Forest) combined with hydraulic river discharge telemetry and K-Means catchment clustering for Chennai.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#141F30] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">FastAPI Model:</span>
            <span className="text-[#35D9F5] font-bold">RandomForest-v2.4.1</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Prediction Form (Connected to FastAPI POST /predict) */}
      <FloodPredictionPanel />

      {/* 3. Hydrological Analytics Grid: Waterway Outflow & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reservoir Telemetry & River Spate (7 cols) */}
        <div className="lg:col-span-7 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#35D9F5]" />
                CHEMBARAMBAKKAM RESERVOIR STORAGE & SURPLUS DISCHARGE
              </div>
              <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                Surplus sluice releases directly impacting Adyar River corridor downstream
              </div>
            </div>
            <div className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
              95% CAPACITY
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reservoirLevels} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <YAxis yAxisId="level" stroke="#35D9F5" fontSize={11} fontFamily="monospace" domain={[20, 25]} unit="m" />
                <YAxis yAxisId="discharge" orientation="right" stroke="#EF4444" fontSize={11} fontFamily="monospace" unit=" cfs" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#101827] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
                          <div className="text-slate-400 mb-1">{label} IST</div>
                          <div className="text-[#35D9F5] font-bold">Water Level: {payload[0].value} m</div>
                          <div className="text-red-400 font-bold">Discharge: {payload[1].value} cusecs</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line yAxisId="level" type="monotone" dataKey="levelM" stroke="#35D9F5" strokeWidth={2.5} dot={{ r: 4 }} name="Water Level" />
                <Line yAxisId="discharge" type="monotone" dataKey="dischargeCusecs" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} name="Discharge (cfs)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
            <div>
              <div className="text-slate-500">FULL RESERVOIR LEVEL</div>
              <div className="text-white font-bold">24.00 m (78.74 ft)</div>
            </div>
            <div>
              <div className="text-slate-500">CURRENT STORAGE</div>
              <div className="text-amber-400 font-bold">3,465 Mcft (95.1%)</div>
            </div>
            <div>
              <div className="text-slate-500">OUTFLOW TO ADYAR</div>
              <div className="text-red-400 font-bold">4,500 cfs (Escalating)</div>
            </div>
          </div>
        </div>

        {/* Feature Importance of Trained Random Forest (5 cols) */}
        <div className="lg:col-span-5 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#35D9F5]" />
                MODEL FEATURE IMPORTANCE WEIGHTS
              </div>
              <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                Relative Gini feature contribution in predicting flood inundation
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">GINI COEFFICIENT</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={DEMO_MODEL_METRICS.featureImportances.slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} fontFamily="monospace" domain={[0, 0.35]} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#94A3B8"
                  fontSize={10}
                  fontFamily="monospace"
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#101827] border border-slate-700 rounded-lg p-2 text-xs font-mono">
                          <div className="font-bold text-white">{item.feature}</div>
                          <div className="text-[#35D9F5]">Gini Importance: {(item.importance * 100).toFixed(1)}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="importance" fill="#35D9F5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 font-mono">
            Key Insight: <span className="text-white">River Discharge</span> and <span className="text-white">Recent Rainfall</span> account for over 52% of model variance.
          </div>
        </div>
      </div>

      {/* 4. Active Monitored River & Canal Waterways */}
      <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 mb-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#35D9F5]" />
          CHENNAI MAJOR DRAINAGE BASINS & CANALS TELEMETRY
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHENNAI_WATERWAYS.map((wb, idx) => (
            <div key={idx} className="p-4 bg-[#141F30]/70 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{wb.name}</span>
                <span className="text-[10px] uppercase text-[#35D9F5] px-1.5 py-0.5 rounded bg-cyan-500/10">
                  {wb.type}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-slate-300 pt-1">
                <span>Current Level:</span>
                <span className="text-lg font-bold text-amber-400">{wb.currentLevelM} m</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Danger Threshold:</span>
                <span className="text-red-400 font-semibold">{wb.dangerLevelM} m</span>
              </div>
              <div className="text-[10px] text-slate-400 bg-[#080D16]/50 p-2 rounded border border-slate-800/80">
                {wb.flowStatus}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
