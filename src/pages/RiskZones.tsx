import React, { useState } from 'react';
import { 
  DEMO_CLUSTERS, 
  DEMO_CLUSTER_DATAPOINTS 
} from '../data/demoData';
import { ClusterRadarChart } from '../components/charts/ClusterRadarChart';
import { TrafficClusterPanel } from '../components/prediction/TrafficClusterPanel';
import { RainfallClusterPanel } from '../components/prediction/RainfallClusterPanel';
import { 
  Grid3X3, 
  Layers, 
  MapPin, 
  Info, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders,
  ChevronRight,
  Car,
  CloudRain,
  Droplets
} from 'lucide-react';
import { RiskBadge } from '../components/common/Badge';

export const RiskZones: React.FC = () => {
  const [activeDomain, setActiveDomain] = useState<'flood' | 'traffic' | 'rainfall'>('flood');
  const [selectedClusterId, setSelectedClusterId] = useState<number>(0);
  const [selectedDataPointId, setSelectedDataPointId] = useState<string>('dp-1');

  const currentCluster = DEMO_CLUSTERS.find(c => c.clusterId === selectedClusterId) || DEMO_CLUSTERS[0];
  const currentDataPoint = DEMO_CLUSTER_DATAPOINTS.find(dp => dp.id === selectedDataPointId) || DEMO_CLUSTER_DATAPOINTS[0];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Workspace Header */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Grid3X3 className="w-5 h-5 text-[#35D9F5]" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                URBAN RISK ZONES & K-MEANS UNSUPERVISED CLUSTERING
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Archetypal urban partitioning derived from multi-dimensional spatial data: Hydrological basins, Vehicular multimodal densities, and Meteorological stations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#141F30] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">Clustering Domains:</span>
            <span className="text-[#35D9F5] font-bold">3 Urban Intelligence Modules</span>
          </div>
        </div>

        {/* Domain Sub-Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveDomain('flood')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeDomain === 'flood'
                ? 'bg-[#35D9F5] text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            FLOOD CATCHMENT CLUSTERS (5 ARCHETYPES)
          </button>

          <button
            onClick={() => setActiveDomain('traffic')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeDomain === 'traffic'
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            TRAFFIC DENSITY ARCHETYPES (4 ARCHETYPES)
          </button>

          <button
            onClick={() => setActiveDomain('rainfall')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeDomain === 'rainfall'
                ? 'bg-blue-400 text-black shadow-md'
                : 'bg-[#141F30] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            RAINFALL PRECIPITATION ZONES (3 ZONES)
          </button>
        </div>

        {/* Disclaimer on K-Means */}
        <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">Methodology Note: </strong>
            K-Means clustering performs unsupervised discovery of homogeneous spatial cohorts across standardized numerical attributes. Clusters represent shared environmental and operational vulnerability profiles rather than deterministic forward predictions.
          </span>
        </div>
      </div>

      {/* Render Domain-Specific Workspace */}
      {activeDomain === 'traffic' && (
        <TrafficClusterPanel />
      )}

      {activeDomain === 'rainfall' && (
        <RainfallClusterPanel />
      )}

      {activeDomain === 'flood' && (
        <>
          {/* 2. Cluster Archetype Selector Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {DEMO_CLUSTERS.map((cl) => {
              const isSelected = selectedClusterId === cl.clusterId;
              return (
                <div
                  key={cl.clusterId}
                  onClick={() => setSelectedClusterId(cl.clusterId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none font-mono text-xs ${
                    isSelected
                      ? 'bg-[#142338] border-[#35D9F5] shadow-cyan-sm'
                      : 'bg-[#101827]/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400">CLUSTER {cl.clusterId}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cl.color }} />
                  </div>

                  <div className="font-bold text-white text-xs mb-2 truncate">
                    {cl.name.split('(')[0]}
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Records:</span> <span className="text-white font-bold">{cl.recordsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Elev:</span> <span className="text-slate-300">{cl.avgElevationM}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flood Rate:</span>
                      <span className={cl.historicalFloodRatePercent > 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {cl.historicalFloodRatePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Deep Dive Row: Radar Profile (6 Cols) + Detailed Cluster Card (6 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <ClusterRadarChart selectedClusterId={selectedClusterId} />
            </div>

            {/* Selected Cluster Details Panel */}
            <div className="lg:col-span-6 bg-[#101827]/90 border border-slate-800 rounded-xl p-6 shadow-hud backdrop-blur-md flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      CLUSTER #{currentCluster.clusterId} DEEP PROFILE
                    </span>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      {currentCluster.name}
                    </h2>
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs font-bold uppercase"
                    style={{ backgroundColor: `${currentCluster.color}20`, color: currentCluster.color, border: `1px solid ${currentCluster.color}40` }}
                  >
                    {currentCluster.historicalFloodRatePercent > 70 ? 'CRITICAL PROFILE' : currentCluster.historicalFloodRatePercent > 40 ? 'MODERATE PROFILE' : 'LOW RISK PROFILE'}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                  {currentCluster.riskProfile}
                </p>

                {/* Numerical Profiling Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  <div className="bg-[#141F30] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">AVG RAINFALL</span>
                    <span className="text-sm font-bold text-[#35D9F5]">{currentCluster.avgRainfallMm} mm</span>
                  </div>
                  <div className="bg-[#141F30] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">AVG ELEVATION</span>
                    <span className="text-sm font-bold text-white">{currentCluster.avgElevationM} m MSL</span>
                  </div>
                  <div className="bg-[#141F30] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">RIVER DISCHARGE</span>
                    <span className="text-sm font-bold text-amber-400">{currentCluster.avgRiverDischarge} m³/s</span>
                  </div>
                  <div className="bg-[#141F30] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">WATER LEVEL</span>
                    <span className="text-sm font-bold text-blue-400">{currentCluster.avgWaterLevelM} m</span>
                  </div>
                  <div className="bg-[#141F30] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">POP. DENSITY</span>
                    <span className="text-sm font-bold text-white">{currentCluster.avgPopulationDensity} /km²</span>
                  </div>
                  <div className="bg-[#141F30] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">HISTORICAL FLOOD</span>
                    <span className="text-sm font-bold text-red-400">{currentCluster.historicalFloodRatePercent}%</span>
                  </div>
                </div>

                {/* Distinctive Features */}
                <div className="mb-4">
                  <div className="text-[11px] text-slate-400 mb-2 font-bold uppercase">
                    DOMINANT ATTRIBUTES DEFINING CLUSTER
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentCluster.topFeatures.map((feat, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs border border-slate-700">
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-500">Representative Chennai Localities: </span>
                <span className="text-white font-semibold">{currentCluster.sampleLocations.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* 4. Individual Points Inspection Matrix */}
          <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md font-mono">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-slate-300">
                  CLUSTER POINT OBSERVATION LEDGER (CHENNAI LOCATIONS)
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  Inspect specific observation records and how multi-variate features map into clusters
                </div>
              </div>
              <span className="text-xs text-slate-400">16 MONITORED POINTS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#141F30] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Location Name</th>
                    <th className="py-2.5 px-3">Cluster Archetype</th>
                    <th className="py-2.5 px-3">Rainfall</th>
                    <th className="py-2.5 px-3">Elevation</th>
                    <th className="py-2.5 px-3">Discharge</th>
                    <th className="py-2.5 px-3">Water Level</th>
                    <th className="py-2.5 px-3">Land Cover</th>
                    <th className="py-2.5 px-3">Assigned Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DEMO_CLUSTER_DATAPOINTS.map((dp) => {
                    const cluster = DEMO_CLUSTERS.find(c => c.clusterId === dp.clusterId);
                    const isSelected = selectedDataPointId === dp.id;

                    return (
                      <tr
                        key={dp.id}
                        onClick={() => {
                          setSelectedDataPointId(dp.id);
                          setSelectedClusterId(dp.clusterId);
                        }}
                        className={`hover:bg-[#141F30]/80 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#142338]' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-white">{dp.name}</td>
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster?.color }} />
                            <span>#{dp.clusterId} {cluster?.name.split('(')[0]}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-blue-400">{dp.rainfallMm} mm</td>
                        <td className="py-2 px-3 text-slate-300">{dp.elevationM} m</td>
                        <td className="py-2 px-3 text-amber-400">{dp.riverDischarge} m³/s</td>
                        <td className="py-2 px-3 text-cyan-300">{dp.waterLevelM} m</td>
                        <td className="py-2 px-3 text-slate-400">{dp.landCover}</td>
                        <td className="py-2 px-3">
                          <RiskBadge level={dp.predictedRisk} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
