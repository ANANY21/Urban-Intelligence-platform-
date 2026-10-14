import React, { useState } from 'react';
import type { RainfallPredictionInput, RainfallPredictionResult } from '../../types';
import { predictRainfall } from '../../services/api';
import { CHENNAI_RAINFALL_STATIONS, RAINFALL_PRESETS } from '../../data/rainfallStations';
import type { RainfallPreset } from '../../data/rainfallStations';
import { 
  CloudRain, 
  Droplets, 
  Calendar, 
  MapPin, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  ShieldAlert,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const RainfallPredictionPanel: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('michaung_deluge');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RainfallPredictionInput>({
    station: 'Chennai nungambakkam',
    year: 2023,
    month: 12,
    day: 4,
    prev_day_rainfall: 142.5,
    prev_7_day_avg: 48.6,
  });

  const [result, setResult] = useState<RainfallPredictionResult | null>(null);

  const handlePresetSelect = (preset: RainfallPreset) => {
    setSelectedPresetId(preset.id);
    setFormData({
      station: preset.station,
      year: preset.year,
      month: preset.month,
      day: preset.day,
      prev_day_rainfall: preset.prev_day_rainfall,
      prev_7_day_avg: preset.prev_7_day_avg,
    });
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictRainfall(formData);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with rainfall forecasting service');
    } finally {
      setLoading(false);
    }
  };

  const getIMDColor = (category?: string) => {
    if (!category) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' };
    const lower = category.toLowerCase();
    if (lower.includes('extremely heavy') || lower.includes('>204')) {
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' };
    }
    if (lower.includes('very heavy') || lower.includes('>115')) {
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
    }
    if (lower.includes('heavy') || lower.includes('64.5')) {
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' };
    }
    if (lower.includes('moderate') || lower.includes('15.6')) {
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
    }
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' };
  };

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold font-mono text-white tracking-wide">
              PRECIPITATION QUANTITATIVE FORECAST ENGINE (RANDOM FOREST REGRESSOR)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Trained on 21,416 historical Chennai meteorological records (1993–2023) across 62 stations with chronological holdout verification.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Model Error:</span>
          <span className="text-emerald-400 font-bold">MAE 12.77 mm</span>
          <span className="text-slate-500">|</span>
          <span className="text-[#35D9F5] font-bold">RMSE 19.47 mm</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-bold">R² 0.582</span>
        </div>
      </div>

      {/* Monsoon Presets */}
      <div>
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
          SELECT METEOROLOGICAL SCENARIO PRESETS:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {RAINFALL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`text-left p-3 rounded-xl border text-xs transition-all ${
                selectedPresetId === preset.id
                  ? 'bg-[#142338] border-blue-400/80 text-white shadow-sm'
                  : 'bg-[#141F30]/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="font-mono font-bold text-blue-300 truncate text-[11px]">
                {preset.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form (7 cols) + Prediction Display (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handlePredict} className="lg:col-span-7 space-y-4">
          <div className="bg-[#141F30]/70 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 uppercase">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#35D9F5]" /> Observatory & Calendar Coordinates
              </span>
              <span className="text-[10px] text-slate-500 font-normal">62 IMD/GCC Stations Monitored</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Observatory Station
                </label>
                <select
                  value={formData.station}
                  onChange={(e) => setFormData(prev => ({ ...prev, station: e.target.value }))}
                  className="w-full bg-[#080D16] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                >
                  {CHENNAI_RAINFALL_STATIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Target Date (Month & Day)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: Number(e.target.value) }))}
                    className="bg-[#080D16] border border-slate-700 rounded-lg px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                  >
                    {[
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ].map((m, idx) => (
                      <option key={m} value={idx + 1}>{m} (M{idx + 1})</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.day}
                    onChange={(e) => setFormData(prev => ({ ...prev, day: Number(e.target.value) }))}
                    className="bg-[#080D16] border border-slate-700 rounded-lg px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Observation Year
                </label>
                <input
                  type="number"
                  min={1993}
                  max={2030}
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                  className="w-full bg-[#080D16] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Meteorological Lag Variables */}
          <div className="bg-[#141F30]/70 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 uppercase">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> Historical Rainfall Lag Indicators
              </span>
              <span className="text-[10px] text-blue-400 font-bold">Primary Regressor Drivers</span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#080D16] p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-300 text-[11px] font-bold">
                    Previous Day Rainfall (t-1)
                  </label>
                  <span className="text-blue-400 font-bold text-sm">
                    {formData.prev_day_rainfall} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={0.5}
                  value={formData.prev_day_rainfall}
                  onChange={(e) => setFormData(prev => ({ ...prev, prev_day_rainfall: Number(e.target.value) }))}
                  className="w-full accent-blue-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 mm (Dry)</span>
                  <span>64.5 mm (Heavy)</span>
                  <span>150+ mm (Extreme)</span>
                </div>
              </div>

              <div className="bg-[#080D16] p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-300 text-[11px] font-bold">
                    7-Day Rolling Average Rainfall
                  </label>
                  <span className="text-[#35D9F5] font-bold text-sm">
                    {formData.prev_7_day_avg} mm/day
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  step={0.5}
                  value={formData.prev_7_day_avg}
                  onChange={(e) => setFormData(prev => ({ ...prev, prev_7_day_avg: Number(e.target.value) }))}
                  className="w-full accent-[#35D9F5] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 mm/day (No Monsoon)</span>
                  <span>30 mm/day (Active Surge)</span>
                  <span>80+ mm/day (Monsoon Depression)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-black font-mono font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  COMPUTING RAINFALL INFERENCE...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  PREDICT 24-HOUR PRECIPITATION
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect(RAINFALL_PRESETS[0])}
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

        {/* Prediction Results Display */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {result ? (
            <div className="bg-[#141F30]/90 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  PRECIPITATION INFERENCE RESULT
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(result.timestamp).toLocaleTimeString()} IST
                </span>
              </div>

              {/* Rainfall Value & Alert Category */}
              {(() => {
                const colors = getIMDColor(result.threshold_category);
                return (
                  <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-baseline justify-between mb-1">
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans uppercase">
                          PREDICTED 24H RAINFALL
                        </div>
                        <div className="text-3xl font-black text-white mt-0.5">
                          {result.prediction.toFixed(1)} <span className="text-base text-blue-300">{result.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colors.text} bg-black/40 border border-current`}>
                          {result.threshold_category.split('(')[0].trim()}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 font-sans mt-2">
                      IMD Criterion: {result.threshold_category}
                    </div>
                  </div>
                );
              })()}

              {/* 68% Confidence Interval (±RMSE) */}
              <div className="p-3 bg-[#080D16]/70 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>68% Empirical Confidence Bound (±1σ RMSE)</span>
                  <span className="text-[#35D9F5] font-bold">±{result.confidence_interval_68.rmse_margin} mm</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">
                    {result.confidence_interval_68.lower_bound} mm
                  </span>
                  <div className="flex-1 mx-3 h-2 bg-slate-900 rounded-full relative overflow-hidden">
                    <div className="absolute inset-y-0 bg-blue-500/40 rounded-full w-full" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#35D9F5] -translate-x-1/2" />
                  </div>
                  <span className="text-slate-400 font-bold">
                    {result.confidence_interval_68.upper_bound} mm
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  Represents historical residual variance across test set validation records.
                </div>
              </div>

              {/* Physical Context / Explanation */}
              <div className="p-3 bg-[#080D16]/60 rounded-lg border border-slate-800 text-[11px] font-sans text-slate-300">
                <span className="font-bold font-mono text-blue-300 block mb-1">Catchment Dynamics:</span>
                {result.explanation}
              </div>

              {/* Model Diagnostics */}
              <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-800 pt-2 font-mono">
                <span>Station: {result.features_supplied.station}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Joblib Regressor
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#141F30]/40 border border-slate-800/80 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <CloudRain className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold font-mono text-white mb-1">
                Awaiting Meteorological Submission
              </div>
              <p className="text-xs text-slate-400 max-w-xs font-sans">
                Choose a Chennai weather station and adjust lag indicators, then click &ldquo;Predict 24-Hour Precipitation&rdquo;.
              </p>
            </div>
          )}

          {/* Scientific Disclaimer */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Methodology & Meteorological Governance: </strong>
              This empirical Random Forest model estimates daily rainfall at individual station micro-catchments from historical lag telemetry (MAE 12.77 mm vs baseline MAE 20.78 mm). It serves as a statistical proxy and complements IMD Doppler Radar radar reflectivity feeds.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
