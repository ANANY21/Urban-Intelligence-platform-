import React, { useState } from 'react';
import { CHENNAI_CORRIDORS } from '../data/chennaiGeo';
import { DEMO_TRAFFIC_INCIDENTS } from '../data/demoData';
import { TrafficFlowChart } from '../components/charts/TrafficFlowChart';
import { TrafficPredictionPanel } from '../components/prediction/TrafficPredictionPanel';
import { TrafficClusterPanel } from '../components/prediction/TrafficClusterPanel';
import { 
  Car, 
  Clock, 
  AlertTriangle, 
  Navigation, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  MapPin,
  Compass,
  ArrowRight,
  Cpu,
  Grid3X3,
  Layers,
  BarChart2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const TrafficIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'predict' | 'clustering' | 'benchmarks'>('telemetry');
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CHENNAI_CORRIDORS[0].id);

  // Hourly congestion pattern for selected corridor
  const hourlyTrafficTrend = [
    { hour: '06:00', avgSpeedKmh: 42, congestion: 25 },
    { hour: '08:00', avgSpeedKmh: 24, congestion: 68 },
    { hour: '09:30', avgSpeedKmh: 14, congestion: 88 }, // Morning Peak
    { hour: '12:00', avgSpeedKmh: 32, congestion: 45 },
    { hour: '15:00', avgSpeedKmh: 28, congestion: 55 },
    { hour: '18:00', avgSpeedKmh: 12, congestion: 92 }, // Evening Peak + Inundation
    { hour: '20:30', avgSpeedKmh: 18, congestion: 78 },
    { hour: '22:00', avgSpeedKmh: 35, congestion: 38 },
  ];

  const currentCorridor = CHENNAI_CORRIDORS.find(c => c.id === selectedCorridor) || CHENNAI_CORRIDORS[0];

  // Feature Importances for Traffic Random Forest
  const trafficFeatureImportances = [
    { feature: 'CarCount', importance: 0.548 },
    { feature: 'Total Vehicles', importance: 0.194 },
    { feature: 'BikeCount', importance: 0.121 },
    { feature: 'BusCount', importance: 0.076 },
    { feature: 'TruckCount', importance: 0.042 },
    { feature: 'Hour of Day', importance: 0.014 },
    { feature: 'Date', importance: 0.005 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                TRAFFIC & URBAN MOBILITY INTELLIGENCE
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Integrated arterial velocity monitoring, ML Random Forest congestion prediction, K-Means multimodal clustering, and real-time subway inundation rerouting.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#141F30] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300">Model Engine:</span>
            <span className="text-amber-400 font-bold">FastAPI Scikit-Learn Joblib v1.0</span>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            CORRIDOR TELEMETRY
          </button>

          <button
            onClick={() => setActiveTab('predict')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'predict'
                ? 'bg-[#35D9F5] text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            CONGESTION PREDICTOR (RANDOM FOREST)
          </button>

          <button
            onClick={() => setActiveTab('clustering')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'clustering'
                ? 'bg-emerald-400 text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            K-MEANS CLUSTERING ARCHETYPES
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'benchmarks'
                ? 'bg-purple-400 text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            MODEL BENCHMARKS & DATASET
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Always visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">METRO MOBILITY INDEX</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">74%</span>
            <span className="text-xs font-bold text-red-400 font-mono">+14% Delay</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            System-wide traffic impedance
          </div>
        </div>

        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">AVERAGE CORRIDOR SPEED</span>
            <Car className="w-4 h-4 text-[#35D9F5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">18.2</span>
            <span className="text-xs font-bold text-slate-400 font-mono">km/h</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-red-400">
            Design Velocity: 45 km/h (-60%)
          </div>
        </div>

        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">SUBWAYS CLOSED</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">2</span>
            <span className="text-xs font-bold text-red-400 font-mono">INUNDATED</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Vyasarpadi & Thillai Ganga Nagar
          </div>
        </div>

        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">PEAK COMMUTE TRANSIT</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">+28</span>
            <span className="text-xs font-bold text-slate-400 font-mono">min</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-amber-400">
            OMR Corridor bottleneck delay
          </div>
        </div>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'predict' && (
        <TrafficPredictionPanel />
      )}

      {activeTab === 'clustering' && (
        <TrafficClusterPanel />
      )}

      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {/* Accuracy & Baseline Uplift Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">HOLDOUT TEST ACCURACY</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">99.33%</div>
              <div className="text-[10px] text-slate-500 mt-1">RandomForestClassifier (100 trees)</div>
            </div>

            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">ZERO-RULE BASELINE</span>
              <div className="text-2xl font-black text-slate-300 mt-1">56.08%</div>
              <div className="text-[10px] text-slate-500 mt-1">Majority class (&ldquo;normal&rdquo;) baseline</div>
            </div>

            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">ACCURACY UPLIFT</span>
              <div className="text-2xl font-black text-[#35D9F5] mt-1">+43.25%</div>
              <div className="text-[10px] text-slate-500 mt-1">Improvement over naive classifier</div>
            </div>

            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">MACRO F1-SCORE</span>
              <div className="text-2xl font-black text-amber-400 mt-1">0.9933</div>
              <div className="text-[10px] text-slate-500 mt-1">Harmonic mean across 4 classes</div>
            </div>
          </div>

          {/* Feature Importance & Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md font-mono">
              <div className="text-xs font-bold uppercase text-slate-300 mb-1">
                FEATURE IMPORTANCES (GINI IMPURITY REDUCTION)
              </div>
              <div className="text-[11px] text-slate-500 mb-4 font-sans">
                Passenger car volume provides dominant information gain in classifying traffic intensity.
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trafficFeatureImportances} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                    <XAxis type="number" domain={[0, 0.6]} stroke="#64748B" fontSize={10} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <YAxis dataKey="feature" type="category" stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#101827] border border-slate-700 p-2 rounded text-xs">
                              <span className="text-[#35D9F5] font-bold">
                                {((payload[0]?.value as number) * 100).toFixed(1)}% importance
                              </span>
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
            </div>

            {/* Confusion Matrix / Class Breakdown */}
            <div className="lg:col-span-5 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md font-mono">
              <div className="text-xs font-bold uppercase text-slate-300 mb-1">
                4-CLASS VALIDATION MATRIX
              </div>
              <div className="text-[11px] text-slate-500 mb-4 font-sans">
                Holdout test set evaluation across 596 test records
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white uppercase">Low Traffic</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">F1: 0.998</span>
                    <span className="text-[10px] text-slate-500 block">Precision: 100% | Recall: 99.6%</span>
                  </div>
                </div>

                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#35D9F5]" />
                    <span className="font-bold text-white uppercase">Normal Traffic</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#35D9F5] font-bold">F1: 0.994</span>
                    <span className="text-[10px] text-slate-500 block">Precision: 99.2% | Recall: 99.7%</span>
                  </div>
                </div>

                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-bold text-white uppercase">High Traffic</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">F1: 0.989</span>
                    <span className="text-[10px] text-slate-500 block">Precision: 99.0% | Recall: 98.8%</span>
                  </div>
                </div>

                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="font-bold text-white uppercase">Heavy Traffic</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold">F1: 0.991</span>
                    <span className="text-[10px] text-slate-500 block">Precision: 99.3% | Recall: 99.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dataset Governance Disclosures */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 font-sans space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
              <Info className="w-4 h-4 shrink-0" />
              Dataset Benchmark & Generalization Notice
            </div>
            <p>
              The reported 99.33% accuracy is derived from the reference <code className="text-white bg-slate-800 px-1 py-0.5 rounded">Traffic.csv</code> dataset (2,976 records). Because the dataset exhibits consistent decision boundaries between vehicle count aggregates and target classifications, the Random Forest model achieves near-perfect separation on holdout data.
            </p>
            <p className="text-slate-400 text-[11px]">
              On live Chennai roadways, congestion dynamics also depend on lane width, weather inundation, non-motorized transport, and junction signal control cycles.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <>
          {/* Charts Row: Corridors Speed Comparison + Hourly Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <TrafficFlowChart />
            </div>

            {/* Hourly Trend Chart */}
            <div className="lg:col-span-6 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                    PEAK HOUR MOBILITY & RAIN-INDUCED CHOKE PATTERNS
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Velocity profile along {currentCorridor.name}
                  </div>
                </div>
                <span className="text-xs font-mono text-[#35D9F5]">HOURLY TELEMETRY</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyTrafficTrend} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#64748B" fontSize={11} fontFamily="monospace" unit=" km/h" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#101827] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
                              <div className="text-slate-400 mb-1">{label} IST</div>
                              <div className="text-[#35D9F5] font-bold">Velocity: {payload[0]?.value} km/h</div>
                              <div className="text-amber-400">Congestion: {payload[0]?.payload.congestion}%</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="avgSpeedKmh" stroke="#35D9F5" strokeWidth={2.5} dot={{ r: 4 }} name="Speed (km/h)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <span>Severe slowdown observed during 18:00 evening monsoon squall</span>
                <span className="text-red-400 font-bold">Min Speed: 12 km/h</span>
              </div>
            </div>
          </div>

          {/* Key Arterial Road Corridors Status */}
          <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
            <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 mb-4 flex items-center justify-between">
              <span>CHENNAI KEY ARTERIAL ROAD CORRIDORS STATUS</span>
              <span className="text-slate-500 font-normal">SELECT TO HIGHLIGHT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHENNAI_CORRIDORS.map((corridor) => (
                <div
                  key={corridor.id}
                  onClick={() => setSelectedCorridor(corridor.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedCorridor === corridor.id
                      ? 'bg-[#142338] border-[#35D9F5]/70 shadow-cyan-sm'
                      : 'bg-[#141F30]/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-white truncate">{corridor.name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                      corridor.severity === 'severe' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      corridor.severity === 'heavy' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      corridor.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {corridor.severity}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mb-3">
                    {corridor.from} &rarr; {corridor.to}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2">
                    <div className="bg-[#080D16]/50 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">CURRENT SPEED</span>
                      <span className="text-white font-bold">{corridor.currentSpeedKmh} km/h</span>
                    </div>
                    <div className="bg-[#080D16]/50 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">TRANSIT DELAY</span>
                      <span className="text-red-400 font-bold">+{corridor.delayMinutes} min</span>
                    </div>
                  </div>

                  {corridor.waterloggingStatus && (
                    <div className="text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      ⚠️ {corridor.waterloggingStatus}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Roadway Incidents & Waterlog Hazards */}
          <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
            <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              ACTIVE ROADWAY INCIDENTS & WATERLOG HAZARD LOG
            </div>

            <div className="space-y-3">
              {DEMO_TRAFFIC_INCIDENTS.map((inc) => (
                <div key={inc.id} className="p-3.5 bg-[#141F30]/60 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-4 font-mono">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${inc.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                    <div>
                      <div className="font-bold text-white text-xs">{inc.corridor}</div>
                      <div className="text-[11px] text-slate-300 font-sans mt-0.5">{inc.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Lanes Impacted: <span className="text-red-400 font-bold">{inc.lanesAffected}</span></span>
                    <span>{inc.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
