import React, { useState } from 'react';
import { 
  DEMO_WEATHER_STATIONS, 
  DEMO_RAINFALL_24H, 
  DEMO_RAINFALL_7D 
} from '../data/demoData';
import { RainfallPredictionPanel } from '../components/prediction/RainfallPredictionPanel';
import { RainfallClusterPanel } from '../components/prediction/RainfallClusterPanel';
import { 
  CloudRain, 
  Droplets, 
  Wind, 
  Thermometer, 
  Compass, 
  AlertTriangle, 
  Calendar, 
  Activity,
  Layers,
  Clock,
  Cpu,
  Grid3X3,
  BarChart2,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  ReferenceLine 
} from 'recharts';

export const RainfallWeather: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'predict' | 'clustering' | 'benchmarks'>('telemetry');
  const [selectedStation, setSelectedStation] = useState<string>('ws-nungambakkam');
  const [timeRange, setTimeRange] = useState<'6h' | '24h' | '7d' | '30d'>('24h');

  const currentStation = DEMO_WEATHER_STATIONS.find(s => s.id === selectedStation) || DEMO_WEATHER_STATIONS[0];

  // Feature Importances for Rainfall Random Forest Regressor
  const rainfallFeatureImportances = [
    { feature: 'Prev_Day_Rainfall (t-1)', importance: 0.483 },
    { feature: 'Prev_7_Day_Avg', importance: 0.261 },
    { feature: 'Month of Year (Seasonality)', importance: 0.142 },
    { feature: 'Station Categorical One-Hot', importance: 0.065 },
    { feature: 'Day of Month', importance: 0.049 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CloudRain className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                METEOROLOGICAL & RAINFALL INTELLIGENCE
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Micro-catchment hyetographs, Random Forest quantitative precipitation estimation across 62 Chennai stations, K-Means climate zoning, and Doppler radar telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#141F30] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-slate-300">Model Engine:</span>
            <span className="text-[#35D9F5] font-bold">FastAPI Joblib Regressor v1.0</span>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'bg-blue-500 text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            RADAR & TELEMETRY
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
            PRECIPITATION PREDICTOR (RANDOM FOREST)
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
            K-MEANS PRECIPITATION ZONES
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
            MODEL BENCHMARKS & RESIDUALS
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rainfall Intensity */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">PEAK INTENSITY</span>
            <CloudRain className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {currentStation.rainfallIntensityMmPerHour}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">mm/h</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-blue-400">
            Current Rate (Doppler Radar)
          </div>
        </div>

        {/* 24h Accumulated Rainfall */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">24H ACCUMULATED</span>
            <Droplets className="w-4 h-4 text-[#35D9F5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {currentStation.rainfallAccumulated24hMm}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">mm</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-amber-400">
            IMD Classification: VERY HEAVY
          </div>
        </div>

        {/* Ambient Temperature & Humidity */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">THERMAL & MOISTURE</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-mono">
              {currentStation.temperatureC}°C
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">
              RH {currentStation.humidityPercent}%
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Dew point: 25.8°C (Near Saturation)
          </div>
        </div>

        {/* Surface Wind Telemetry */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium uppercase">COASTAL SQUALL WIND</span>
            <Wind className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {currentStation.windSpeedKmh}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">km/h</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-emerald-400">
            Direction: East-Northeast (ENE)
          </div>
        </div>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'predict' && (
        <RainfallPredictionPanel />
      )}

      {activeTab === 'clustering' && (
        <RainfallClusterPanel />
      )}

      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {/* Regression Metrics & Baseline Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">HOLDOUT TEST MAE</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">12.77 mm</div>
              <div className="text-[10px] text-slate-500 mt-1">Mean Absolute Error</div>
            </div>

            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">BASELINE PREDICTOR MAE</span>
              <div className="text-2xl font-black text-slate-300 mt-1">20.78 mm</div>
              <div className="text-[10px] text-slate-500 mt-1">Climatological mean baseline</div>
            </div>

            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">ERROR REDUCTION</span>
              <div className="text-2xl font-black text-[#35D9F5] mt-1">-38.5%</div>
              <div className="text-[10px] text-slate-500 mt-1">Improvement vs naive mean</div>
            </div>

            <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-4 shadow-hud">
              <span className="text-[10px] text-slate-400 uppercase">COEFFICIENT OF DETERMINATION (R²)</span>
              <div className="text-2xl font-black text-amber-400 mt-1">0.5817</div>
              <div className="text-[10px] text-slate-500 mt-1">Test set variance explained</div>
            </div>
          </div>

          {/* Feature Importances & Residual Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md font-mono">
              <div className="text-xs font-bold uppercase text-slate-300 mb-1">
                REGRESSOR FEATURE IMPORTANCE (M.S.E. REDUCTION)
              </div>
              <div className="text-[11px] text-slate-500 mb-4 font-sans">
                Previous-day catchment rainfall and 7-day rolling accumulations dominate predictive power.
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rainfallFeatureImportances} layout="vertical" margin={{ top: 5, right: 30, left: 110, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                    <XAxis type="number" domain={[0, 0.6]} stroke="#64748B" fontSize={10} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <YAxis dataKey="feature" type="category" stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#101827] border border-slate-700 p-2 rounded text-xs">
                              <span className="text-blue-400 font-bold">
                                {((payload[0]?.value as number) * 100).toFixed(1)}% importance
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="importance" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Holdout Residual Bounds */}
            <div className="lg:col-span-5 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md font-mono">
              <div className="text-xs font-bold uppercase text-slate-300 mb-1">
                TEST SET RESIDUAL BOUNDS (CHRONOLOGICAL SPLIT)
              </div>
              <div className="text-[11px] text-slate-500 mb-4 font-sans">
                Evaluation on the final chronological 15% records (3,213 records)
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TEST SET RMSE</span>
                    <span className="text-white font-bold text-sm">19.47 mm</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">BASELINE RMSE</span>
                    <span className="text-slate-400 font-bold">31.42 mm</span>
                  </div>
                </div>

                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block">MAX OBSERVED IN TEST SET</span>
                    <span className="text-red-400 font-bold text-sm">242.0 mm</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">TOTAL TEST SAMPLES</span>
                    <span className="text-[#35D9F5] font-bold">3,213 Records</span>
                  </div>
                </div>

                <div className="p-3 bg-[#141F30] rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TEMPORAL SPLIT HORIZON</span>
                    <span className="text-emerald-400 font-bold">Chronological (No Leakage)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    VALIDATED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dataset & Climatological Governance Notice */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 font-sans space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-mono font-bold">
              <Info className="w-4 h-4 shrink-0" />
              Meteorological Climatology & Verification Note
            </div>
            <p>
              Trained on genuine Chennai daily station rainfall records spanning 1993 to 2023 (<code className="text-white bg-slate-800 px-1 py-0.5 rounded">chennai_rainfall.csv</code>, 21,416 samples across 62 observatories). The test split was applied strictly chronologically to evaluate real forward generalization without future data leakage.
            </p>
            <p className="text-slate-400 text-[11px]">
              Precipitation forecasting is an intrinsically non-deterministic physical process. This statistical model is designed to support urban stormwater dispatching and should be verified alongside IMD Doppler radar nowcasts.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <>
          {/* Main Meteorological Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 24-Hour Intensity vs Accumulated (7 Cols) */}
            <div className="lg:col-span-7 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                    24-HOUR HYETOGRAPH (PRECIPITATION & ACCUMULATION)
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Differentiating hourly rainfall intensity from total accumulated column
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#141F30] p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  {(['6h', '24h', '7d', '30d'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        timeRange === r ? 'bg-[#35D9F5] text-black font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DEMO_RAINFALL_24H} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hourlyIntensity" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="5%" stopColor="#35D9F5" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#35D9F5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="accumulatedRain" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#64748B" fontSize={11} fontFamily="monospace" unit=" mm" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#101827] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
                              <div className="text-slate-400 mb-1">{label} IST</div>
                              <div className="text-[#35D9F5] font-bold">Hourly Intensity: {payload[0]?.value} mm/h</div>
                              <div className="text-blue-300 font-bold">Accumulated 24h: {payload[1]?.value} mm</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={15.6} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'IMD Alert (15.6mm/h)', fill: '#F59E0B', fontSize: 10 }} />
                    <Area type="monotone" dataKey="intensity" stroke="#35D9F5" strokeWidth={2.5} fill="url(#hourlyIntensity)" name="Intensity (mm/h)" />
                    <Area type="monotone" dataKey="accumulated" stroke="#3B82F6" strokeWidth={2} fill="url(#accumulatedRain)" name="Accumulated (mm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7-Day Historical vs Normal Comparison (5 Cols) */}
            <div className="lg:col-span-5 bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                    7-DAY OBSERVED VS CLIMATIC NORMAL
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Observed monsoon deluge compared to 30-year IMD climatological baseline
                  </div>
                </div>
                <span className="text-xs font-mono text-red-400 font-bold">+480% SURGE</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DEMO_RAINFALL_7D} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#64748B" fontSize={10} fontFamily="monospace" unit=" mm" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#101827] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
                              <div className="text-slate-300 font-bold mb-1">{label}</div>
                              <div className="text-[#35D9F5]">Observed: {payload[0]?.value} mm</div>
                              <div className="text-slate-400">Historical Normal: {payload[1]?.value} mm</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="observedMm" fill="#35D9F5" radius={[4, 4, 0, 0]} name="Observed (mm)" />
                    <Bar dataKey="historicalNormalMm" fill="#475569" radius={[4, 4, 0, 0]} name="Climatic Normal (mm)" />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Observatories & Weather Telemetry Stations List */}
          <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                  GREATER CHENNAI AUTOMATIC WEATHER STATIONS (AWS) TELEMETRY
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  Select an observatory to review micro-catchment precipitation
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">6 ACTIVE OBSERVATORIES</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_WEATHER_STATIONS.map((station) => (
                <div
                  key={station.id}
                  onClick={() => setSelectedStation(station.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedStation === station.id
                      ? 'bg-[#142338] border-[#35D9F5]/60 shadow-cyan-sm'
                      : 'bg-[#141F30]/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-white truncate">{station.name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                      station.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      station.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {station.thresholdLevel.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mb-3">{station.area}</div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    <div className="bg-[#080D16]/50 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">INTENSITY</span>
                      <span className="text-white font-bold">{station.rainfallIntensityMmPerHour} mm/h</span>
                    </div>
                    <div className="bg-[#080D16]/50 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">24H ACCUM.</span>
                      <span className="text-[#35D9F5] font-bold">{station.rainfallAccumulated24hMm} mm</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>Temp: {station.temperatureC}°C | RH: {station.humidityPercent}%</span>
                    <span>{station.lastUpdated}</span>
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
