import React from 'react';
import { Layers, ShieldAlert, CloudRain, Car, AlertTriangle, Droplets } from 'lucide-react';

interface MapLegendProps {
  activeLayers: {
    flood: boolean;
    rainfall: boolean;
    traffic: boolean;
    waterways: boolean;
    incidents: boolean;
  };
  onToggleLayer: (layer: 'flood' | 'rainfall' | 'traffic' | 'waterways' | 'incidents') => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({ activeLayers, onToggleLayer }) => {
  return (
    <div className="bg-[#101827]/95 border border-slate-800 rounded-lg p-3 text-xs shadow-2xl backdrop-blur-md max-w-xs font-mono">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <span className="text-[11px] font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#35D9F5]" />
          GEO-TELEMETRY LAYERS
        </span>
        <span className="text-[10px] text-slate-500">CHENNAI METRO</span>
      </div>

      {/* Layer Toggles */}
      <div className="space-y-1.5 mb-3">
        {/* Flood Risk */}
        <div
          onClick={() => onToggleLayer('flood')}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
            activeLayers.flood ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/40 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-200 text-[11px]">Flood Inundation Risk</span>
          </div>
          <span className={`text-[10px] ${activeLayers.flood ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
            {activeLayers.flood ? 'ACTIVE' : 'OFF'}
          </span>
        </div>

        {/* Rainfall Intensity */}
        <div
          onClick={() => onToggleLayer('rainfall')}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
            activeLayers.rainfall ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800/40 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-200 text-[11px]">Rainfall Radar & Stations</span>
          </div>
          <span className={`text-[10px] ${activeLayers.rainfall ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
            {activeLayers.rainfall ? 'ACTIVE' : 'OFF'}
          </span>
        </div>

        {/* Traffic Corridors */}
        <div
          onClick={() => onToggleLayer('traffic')}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
            activeLayers.traffic ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/40 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-200 text-[11px]">Corridor Mobility & Delay</span>
          </div>
          <span className={`text-[10px] ${activeLayers.traffic ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
            {activeLayers.traffic ? 'ACTIVE' : 'OFF'}
          </span>
        </div>

        {/* Waterways */}
        <div
          onClick={() => onToggleLayer('waterways')}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
            activeLayers.waterways ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-800/40 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-[#35D9F5]" />
            <span className="text-slate-200 text-[11px]">Adyar / Cooum / Canals</span>
          </div>
          <span className={`text-[10px] ${activeLayers.waterways ? 'text-[#35D9F5] font-bold' : 'text-slate-500'}`}>
            {activeLayers.waterways ? 'ACTIVE' : 'OFF'}
          </span>
        </div>

        {/* Incidents */}
        <div
          onClick={() => onToggleLayer('incidents')}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
            activeLayers.incidents ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-800/40 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-200 text-[11px]">Roadway Hazards & Closures</span>
          </div>
          <span className={`text-[10px] ${activeLayers.incidents ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>
            {activeLayers.incidents ? 'ACTIVE' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Visual Scales & Units */}
      <div className="pt-2 border-t border-slate-800 space-y-2 text-[10px] text-slate-400">
        <div>
          <div className="text-slate-500 mb-1">FLOOD SEVERITY INDEX</div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-5 rounded bg-emerald-500" title="Safe (0-20%)" />
            <span className="h-2 w-5 rounded bg-blue-500" title="Low (20-40%)" />
            <span className="h-2 w-5 rounded bg-amber-500" title="Moderate (40-60%)" />
            <span className="h-2 w-5 rounded bg-orange-500" title="High (60-80%)" />
            <span className="h-2 w-5 rounded bg-red-500 animate-pulse" title="Critical (>80%)" />
            <span className="ml-auto text-slate-400 font-bold">0 → 100%</span>
          </div>
        </div>

        <div>
          <div className="text-slate-500 mb-1">TRAFFIC FLOW (CORRIDOR SPEED)</div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>&gt;40 km/h</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block ml-2" />
            <span>25-40</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block ml-2" />
            <span>&lt;20 km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
