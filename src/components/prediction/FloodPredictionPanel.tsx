import React, { useState } from 'react';
import type { 
  FloodPredictionInput, 
  FloodPredictionResult 
} from '../../types';
import { PRESET_PREDICTION_HOTSPOTS } from '../../data/demoData';
import { predictFlood } from '../../services/api';
import { PredictionGauge } from './PredictionGauge';
import { 
  Cpu, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  ShieldAlert,
  Sliders,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface FloodPredictionPanelProps {
  initialCoordinates?: [number, number];
  onPredictionComplete?: (result: FloodPredictionResult) => void;
}

export const FloodPredictionPanel: React.FC<FloodPredictionPanelProps> = ({
  initialCoordinates,
  onPredictionComplete,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('velachery');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State initialized with Velachery hotspot
  const [formData, setFormData] = useState<FloodPredictionInput>({
    latitude: initialCoordinates ? initialCoordinates[0] : 12.9815,
    longitude: initialCoordinates ? initialCoordinates[1] : 80.2180,
    rainfall_mm: 218.5,
    temperature_c: 26.4,
    humidity_percent: 94.0,
    river_discharge_m3s: 4120.0,
    water_level_m: 7.8,
    elevation_m: 4.5,
    land_cover: 'Urban',
    soil_type: 'Clay',
    population_density: 8500,
    infrastructure_score: 1,
    historical_floods: 1,
  });

  const [result, setResult] = useState<FloodPredictionResult | null>(null);

  // Handle Preset Selection
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = PRESET_PREDICTION_HOTSPOTS[presetKey];
    if (preset) {
      setFormData({
        latitude: preset.latitude,
        longitude: preset.longitude,
        rainfall_mm: preset.rainfall_mm,
        temperature_c: preset.temperature_c,
        humidity_percent: preset.humidity_percent,
        river_discharge_m3s: preset.river_discharge_m3s,
        water_level_m: preset.water_level_m,
        elevation_m: preset.elevation_m,
        land_cover: preset.land_cover,
        soil_type: preset.soil_type,
        population_density: preset.population_density,
        infrastructure_score: preset.infrastructure_score,
        historical_floods: preset.historical_floods,
      });
    }
  };

  const handleChange = (field: keyof FloodPredictionInput, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await predictFlood(formData);
      setResult(res);
      if (onPredictionComplete) onPredictionComplete(res);
    } catch (err: any) {
      setError(err?.message || 'Prediction service encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#35D9F5]" />
            <h2 className="text-lg font-bold text-white tracking-wide font-mono">
              FLOOD PREDICTION INFERENCE ENGINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine Learning hydraulic risk estimation trained on Indian flood catchments.
          </p>
        </div>

        {/* Hotspot Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Preset Hotspot:</span>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="bg-[#141F30] border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#35D9F5] font-mono"
          >
            <option value="velachery">Velachery Basin (High Inundation)</option>
            <option value="adyar">Saidapet Adyar Spate</option>
            <option value="omr_sholinganallur">OMR Tech Corridor</option>
            <option value="besant_nagar">Besant Nagar Coast (Safe)</option>
            <option value="tambaram_highlands">Tambaram Highlands</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) and Live Result (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs (7 Cols) */}
        <form onSubmit={handlePredict} className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Latitude & Longitude */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>Latitude (°N)</span>
                <span className="text-[10px] text-slate-500">12.8 - 13.3</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>Longitude (°E)</span>
                <span className="text-[10px] text-slate-500">80.0 - 80.4</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
                required
              />
            </div>

            {/* Rainfall & River Discharge */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>Recent Rainfall (mm)</span>
                <span className="text-[10px] text-blue-400 font-semibold">{formData.rainfall_mm} mm</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={formData.rainfall_mm}
                onChange={(e) => handleChange('rainfall_mm', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>River Discharge (m³/s)</span>
                <span className="text-[10px] text-amber-400 font-semibold">{formData.river_discharge_m3s} m³/s</span>
              </label>
              <input
                type="number"
                step="10"
                min="0"
                max="10000"
                value={formData.river_discharge_m3s}
                onChange={(e) => handleChange('river_discharge_m3s', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
                required
              />
            </div>

            {/* Water Level & Elevation */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>Water Level (m)</span>
                <span className="text-[10px] text-slate-500">Gauge reading</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="25"
                value={formData.water_level_m}
                onChange={(e) => handleChange('water_level_m', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>Elevation (m MSL)</span>
                <span className="text-[10px] text-slate-500">Mean sea level</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.elevation_m}
                onChange={(e) => handleChange('elevation_m', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
                required
              />
            </div>

            {/* Land Cover & Soil Type */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Land Cover Category</label>
              <select
                value={formData.land_cover}
                onChange={(e) => handleChange('land_cover', e.target.value)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
              >
                <option value="Urban">Urban / Built-up</option>
                <option value="Water Body">Water Body / Lake Basin</option>
                <option value="Agricultural">Agricultural Floodplain</option>
                <option value="Coastal">Coastal Shoreline</option>
                <option value="Suburban">Suburban Residential</option>
                <option value="Industrial">Industrial Zone</option>
                <option value="Forest">Forest / Natural Vegetation</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Soil Permeability Profile</label>
              <select
                value={formData.soil_type}
                onChange={(e) => handleChange('soil_type', e.target.value)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
              >
                <option value="Clay">Clay (Slowest Drainage - High Runoff)</option>
                <option value="Peat">Peat (Spongy Organic)</option>
                <option value="Loam">Loam (Moderate Infiltration)</option>
                <option value="Sandy">Sandy (Rapid Infiltration)</option>
                <option value="Silt">Silt (Fine River Sediment)</option>
              </select>
            </div>

            {/* Temperature & Humidity */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature_c}
                onChange={(e) => handleChange('temperature_c', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.humidity_percent}
                onChange={(e) => handleChange('humidity_percent', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
              />
            </div>

            {/* Population Density & History */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Population Density (pop/km²)</label>
              <input
                type="number"
                value={formData.population_density}
                onChange={(e) => handleChange('population_density', parseInt(e.target.value) || 0)}
                className="w-full bg-[#141F30] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#35D9F5]"
              />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.historical_floods === 1}
                  onChange={(e) => handleChange('historical_floods', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-[#35D9F5] focus:ring-0 bg-[#141F30]"
                />
                Historical Flood Record
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.infrastructure_score === 1}
                  onChange={(e) => handleChange('infrastructure_score', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-[#35D9F5] focus:ring-0 bg-[#141F30]"
                />
                Stormwater Infrastructure Present
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-cyan-glow transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Running Inference via Model Pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Flood Prediction Model
                </>
              )}
            </button>
          </div>

          {/* Disclaimer Banner */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Validation Notice: </span>
              Inference combines Random Forest classification with hydraulic discharge benchmarks. Uncalibrated predictions should be corroborated with real-time IMD Doppler feeds before evacuation dispatch.
            </div>
          </div>
        </form>

        {/* Prediction Output Results (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Radial Gauge */}
              <PredictionGauge
                probability={result.flood_probability}
                riskLevel={result.risk_level}
                predictionClass={result.prediction_class}
                confidence={result.confidence}
              />

              {/* Model & Source Meta */}
              <div className="p-4 bg-[#141F30]/80 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">DATA SOURCE</span>
                  {result.is_demo ? (
                    <Badge variant="amber">SIMULATION MODEL</Badge>
                  ) : (
                    <Badge variant="green" pulse>FASTAPI BACKEND</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">MODEL VERSION</span>
                  <span className="text-white font-bold">{result.model_version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">K-MEANS CLUSTER</span>
                  <span className="text-[#35D9F5] font-bold">#{result.cluster_id} — {result.cluster_name}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  {result.cluster_description}
                </div>
              </div>

              {/* Feature Contributions Waterfall */}
              <div className="p-4 bg-[#141F30]/80 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="text-slate-300 font-bold mb-3 flex items-center justify-between">
                  <span>KEY FACTOR IMPACTS</span>
                  <span className="text-[10px] text-slate-500">Feature Contribution</span>
                </div>
                <div className="space-y-2">
                  {result.feature_contributions.map((fc, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{fc.feature} ({fc.value})</span>
                        <span className={fc.impact > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                          {fc.impact > 0 ? `+${fc.impact}` : fc.impact}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${fc.impact > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.abs(fc.impact) * 150, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Mitigation Protocol */}
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                <div className="font-mono font-bold text-white mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#35D9F5]" />
                  OPERATIONAL MITIGATION PROTOCOL
                </div>
                <ul className="space-y-1.5 text-slate-300 font-sans text-xs">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#35D9F5] mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-[#141F30]/40 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 font-mono text-xs">
              <Cpu className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <div className="text-slate-300 font-semibold mb-1">AWAITING MODEL EXECUTION</div>
              <p className="max-w-xs text-[11px] text-slate-500">
                Adjust hydrological parameters or select a Chennai hotspot preset, then click "Run Flood Prediction Model".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
