import React, { useState } from 'react';
import type { TrafficPredictionInput, TrafficPredictionResult } from '../../types';
import { predictTraffic } from '../../services/api';
import { 
  Car, 
  Bike, 
  Bus, 
  Truck, 
  Clock, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Play, 
  RotateCcw, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface TrafficPreset {
  id: string;
  name: string;
  corridor: string;
  day_of_week: string;
  date: number;
  hour: number;
  car_count: number;
  bike_count: number;
  bus_count: number;
  truck_count: number;
  description: string;
}

const TRAFFIC_PRESETS: TrafficPreset[] = [
  {
    id: 'omr_peak',
    name: 'OMR Tech Corridor — Morning Peak Gridlock',
    corridor: 'Old Mahabalipuram Rd (Tidel Park)',
    day_of_week: 'Monday',
    date: 12,
    hour: 9,
    car_count: 98,
    bike_count: 86,
    bus_count: 22,
    truck_count: 8,
    description: 'Intense IT workforce ingress with saturated multi-modal vehicle density.'
  },
  {
    id: 'anna_salai_midday',
    name: 'Anna Salai Arterial — Midday Regulated Flow',
    corridor: 'Anna Salai (Mount Road)',
    day_of_week: 'Wednesday',
    date: 15,
    hour: 14,
    car_count: 46,
    bike_count: 38,
    bus_count: 14,
    truck_count: 6,
    description: 'Steady arterial commercial flow with synchronized adaptive signal timings.'
  },
  {
    id: 'gst_logistics',
    name: 'GST Road Hub — Late Night Commercial Freight',
    corridor: 'Grand Southern Trunk Rd (Airport Corridor)',
    day_of_week: 'Friday',
    date: 24,
    hour: 23,
    car_count: 24,
    bike_count: 18,
    bus_count: 12,
    truck_count: 42,
    description: 'Interstate logistics window with heavy freight trucks entering metro boundaries.'
  },
  {
    id: 'marina_leisure',
    name: 'Marina Beach Promenade — Weekend Leisure Rush',
    corridor: 'Kamarajar Salai',
    day_of_week: 'Sunday',
    date: 18,
    hour: 18,
    car_count: 72,
    bike_count: 78,
    bus_count: 8,
    truck_count: 2,
    description: 'High two-wheeler and passenger car congregation for coastal recreation.'
  },
  {
    id: 'ecr_freeflow',
    name: 'ECR Scenic Expressway — Midnight Free-Flow',
    corridor: 'East Coast Road',
    day_of_week: 'Tuesday',
    date: 5,
    hour: 3,
    car_count: 10,
    bike_count: 6,
    bus_count: 1,
    truck_count: 4,
    description: 'Minimal vehicular presence with unimpeded free-flow velocity.'
  }
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TrafficPredictionPanel: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('omr_peak');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TrafficPredictionInput>({
    date: 12,
    day_of_week: 'Monday',
    hour: 9,
    car_count: 98,
    bike_count: 86,
    bus_count: 22,
    truck_count: 8,
  });

  const [result, setResult] = useState<TrafficPredictionResult | null>(null);

  const totalVehicles = formData.car_count + formData.bike_count + formData.bus_count + formData.truck_count;

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = TRAFFIC_PRESETS.find(item => item.id === presetId);
    if (p) {
      setFormData({
        date: p.date,
        day_of_week: p.day_of_week,
        hour: p.hour,
        car_count: p.car_count,
        bike_count: p.bike_count,
        bus_count: p.bus_count,
        truck_count: p.truck_count,
      });
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictTraffic({
        ...formData,
        total: totalVehicles,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with traffic model service');
    } finally {
      setLoading(false);
    }
  };

  const getSituationColor = (situation?: string) => {
    switch (situation?.toLowerCase()) {
      case 'heavy':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', badge: 'bg-red-500' };
      case 'high':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', badge: 'bg-amber-500' };
      case 'normal':
        return { bg: 'bg-[#35D9F5]/20', text: 'text-[#35D9F5]', border: 'border-[#35D9F5]/40', badge: 'bg-[#35D9F5]' };
      case 'low':
      default:
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', badge: 'bg-emerald-500' };
    }
  };

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-mono text-white tracking-wide">
              RANDOM FOREST CONGESTION PREDICTION ENGINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Trained Random Forest Classifier (100 Trees) predicting four-tier traffic conditions from vehicle modalities and temporal patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Holdout Accuracy: <strong className="text-emerald-400">99.33%</strong> (Baseline: 56.08%)
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300">
            TRAFFIC.CSV PIPELINE
          </span>
        </div>
      </div>

      {/* Corridor Presets Bar */}
      <div className="mb-6">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
          LOAD CHENNAI MOBILITY SCENARIO PRESETS:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {TRAFFIC_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                selectedPreset === preset.id
                  ? 'bg-[#142338] border-amber-400/80 text-white shadow-sm'
                  : 'bg-[#141F30]/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="font-mono font-bold truncate text-[11px] text-amber-300">
                {preset.name.split('—')[0].trim()}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {preset.name.split('—')[1]?.trim() || preset.corridor}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form (7 cols) + Prediction Output (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handlePredict} className="lg:col-span-7 space-y-4">
          <div className="bg-[#141F30]/70 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#35D9F5]" /> Temporal Parameters
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Day & Hour of Observation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Day of the Week
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}
                  className="w-full bg-[#080D16] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Calendar Date (Day)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: Number(e.target.value) }))}
                  className="w-full bg-[#080D16] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Hour of Day (0–23)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.hour}
                    onChange={(e) => setFormData(prev => ({ ...prev, hour: Number(e.target.value) }))}
                    className="w-full bg-[#080D16] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {formData.hour < 12 ? `${formData.hour || 12} AM` : `${formData.hour === 12 ? 12 : formData.hour - 12} PM`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Multimodal Vehicle Inputs */}
          <div className="bg-[#141F30]/70 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 uppercase">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" /> Observed Vehicular Counts
              </span>
              <span className="text-[11px] text-amber-400 font-bold">
                Computed Total: {totalVehicles} Vehicles
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-[#080D16] p-3 rounded-lg border border-slate-800">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Car className="w-3.5 h-3.5 text-[#35D9F5]" /> Cars
                </label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={formData.car_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, car_count: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-transparent border-b border-slate-700 py-1 text-sm font-bold text-white focus:outline-none focus:border-[#35D9F5]"
                />
              </div>

              <div className="bg-[#080D16] p-3 rounded-lg border border-slate-800">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Bike className="w-3.5 h-3.5 text-emerald-400" /> Two-Wheelers
                </label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={formData.bike_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, bike_count: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-transparent border-b border-slate-700 py-1 text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="bg-[#080D16] p-3 rounded-lg border border-slate-800">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Bus className="w-3.5 h-3.5 text-amber-400" /> Buses
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.bus_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, bus_count: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-transparent border-b border-slate-700 py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="bg-[#080D16] p-3 rounded-lg border border-slate-800">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <Truck className="w-3.5 h-3.5 text-red-400" /> Trucks
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.truck_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, truck_count: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-transparent border-b border-slate-700 py-1 text-sm font-bold text-white focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            {/* Vehicular Modal Proportions Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Modal Breakdown</span>
                <span>
                  Cars: {totalVehicles ? Math.round((formData.car_count / totalVehicles) * 100) : 0}% | 
                  Bikes: {totalVehicles ? Math.round((formData.bike_count / totalVehicles) * 100) : 0}% | 
                  Heavy: {totalVehicles ? Math.round(((formData.bus_count + formData.truck_count) / totalVehicles) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div style={{ width: `${totalVehicles ? (formData.car_count / totalVehicles) * 100 : 25}%` }} className="bg-[#35D9F5]" />
                <div style={{ width: `${totalVehicles ? (formData.bike_count / totalVehicles) * 100 : 25}%` }} className="bg-emerald-400" />
                <div style={{ width: `${totalVehicles ? (formData.bus_count / totalVehicles) * 100 : 25}%` }} className="bg-amber-400" />
                <div style={{ width: `${totalVehicles ? (formData.truck_count / totalVehicles) * 100 : 25}%` }} className="bg-red-400" />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  EVALUATING RANDOM FOREST CLASSIFIER...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  PREDICT TRAFFIC CONGESTION
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('omr_peak')}
              className="bg-[#141F30] border border-slate-700 hover:border-slate-600 text-slate-300 p-3 rounded-xl transition-colors"
              title="Reset to default preset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-mono text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Prediction Results Column */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {result ? (
            <div className="bg-[#141F30]/90 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  CLASSIFICATION INFERENCE
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(result.timestamp).toLocaleTimeString()} IST
                </span>
              </div>

              {/* Congestion Level Banner */}
              {(() => {
                const colors = getSituationColor(result.predicted_class);
                return (
                  <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border} flex items-center justify-between`}>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">
                        PREDICTED TRAFFIC SITUATION
                      </div>
                      <div className={`text-2xl font-black tracking-wider uppercase ${colors.text}`}>
                        {result.predicted_class}
                      </div>
                      <div className="text-[10px] text-slate-300 font-sans mt-0.5">
                        Modal volume: {result.features_supplied.total_vehicles} total vehicles
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-sans">CONFIDENCE</div>
                      <div className={`text-2xl font-black ${colors.text}`}>
                        {Math.round(result.confidence * 100)}%
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">Probability</div>
                    </div>
                  </div>
                );
              })()}

              {/* Class Probability Distribution */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase mb-2 flex justify-between">
                  <span>Class Probability Spectrum</span>
                  <span className="text-slate-500">Softmax Leaf Proportions</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {(['low', 'normal', 'high', 'heavy'] as const).map((situation) => {
                    const prob = result.class_probabilities[situation] ?? 0;
                    const isWinner = result.predicted_class.toLowerCase() === situation;
                    return (
                      <div key={situation} className="space-y-0.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`uppercase font-bold ${isWinner ? 'text-white' : 'text-slate-400'}`}>
                            {situation} {isWinner && '★'}
                          </span>
                          <span className={isWinner ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(2, prob * 100)}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              situation === 'heavy' ? 'bg-red-400' :
                              situation === 'high' ? 'bg-amber-400' :
                              situation === 'normal' ? 'bg-[#35D9F5]' :
                              'bg-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary / Explanation */}
              <div className="p-3 bg-[#080D16]/60 rounded-lg border border-slate-800 text-[11px] font-sans text-slate-300">
                <span className="font-bold text-amber-300 block mb-1">Inference Rationale:</span>
                {result.explanation}
              </div>

              {/* Metadata */}
              <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-800 pt-2 font-mono">
                <span>Model: {result.model_version}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Scikit-learn Pipeline
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#141F30]/40 border border-slate-800/80 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Car className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold font-mono text-white mb-1">
                Awaiting Traffic Parameter Submission
              </div>
              <p className="text-xs text-slate-400 max-w-xs font-sans">
                Select a corridor preset or customize the temporal & vehicle counts, then click &ldquo;Predict Traffic Congestion&rdquo; to execute the Random Forest pipeline.
              </p>
            </div>
          )}

          {/* Scientific Disclaimer */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific & Operational Notice: </strong>
              This model classifies supplied instantaneous traffic conditions from multimodal volume features. It reflects patterns from the reference <code className="text-slate-300">Traffic.csv</code> dataset (2,976 samples, 99.33% benchmark accuracy) and does not represent an unconditioned forward meteorological or behavioral traffic forecast.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
