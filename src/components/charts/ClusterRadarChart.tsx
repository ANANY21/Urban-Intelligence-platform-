import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip, 
  Legend 
} from 'recharts';
import { DEMO_CLUSTERS } from '../../data/demoData';

interface ClusterRadarChartProps {
  selectedClusterId?: number;
}

export const ClusterRadarChart: React.FC<ClusterRadarChartProps> = ({ selectedClusterId }) => {
  // Normalize cluster features onto 0-100 scale for comparison
  const radarData = [
    {
      feature: 'River Discharge',
      c0: 88, // Lowland Riparian (Critical)
      c1: 25, // Coastal Sand
      c2: 45, // Dense Urban
      c3: 18, // Elevated Suburban
      c4: 76, // Industrial Estuary
    },
    {
      feature: 'Rainfall Load',
      c0: 85,
      c1: 60,
      c2: 72,
      c3: 48,
      c4: 78,
    },
    {
      feature: 'Water Level',
      c0: 92,
      c1: 28,
      c2: 50,
      c3: 20,
      c4: 75,
    },
    {
      feature: 'Lowland Depression',
      c0: 90, // lower elevation = higher depression vulnerability
      c1: 65,
      c2: 40,
      c3: 15,
      c4: 95,
    },
    {
      feature: 'Population Density',
      c0: 75,
      c1: 45,
      c2: 98,
      c3: 35,
      c4: 60,
    },
  ];

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            K-MEANS CLUSTER MULTI-FACTOR PROFILE
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Hydrological and topographical feature weights across identified urban archetypes
          </div>
        </div>
        <div className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          5 CLUSTERS
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="75%">
            <PolarGrid stroke="#1E293B" />
            <PolarAngleAxis dataKey="feature" stroke="#94A3B8" fontSize={11} fontFamily="monospace" />
            <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} fontSize={10} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#101827] border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-2xl">
                      <div className="font-bold text-white mb-1.5">{payload[0]?.payload.feature}</div>
                      {payload.map((p, idx) => (
                        <div key={idx} className="flex justify-between gap-4 text-[11px]" style={{ color: p.color }}>
                          <span>{p.name}:</span>
                          <span className="font-bold">{p.value}/100</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Cluster 0: Lowland Riparian */}
            <Radar
              name="Cluster 0 (Lowland Basin)"
              dataKey="c0"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={selectedClusterId === 0 || selectedClusterId === undefined ? 0.4 : 0.05}
            />
            {/* Cluster 1: Coastal Sand */}
            <Radar
              name="Cluster 1 (Coastal Sand)"
              dataKey="c1"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={selectedClusterId === 1 || selectedClusterId === undefined ? 0.3 : 0.05}
            />
            {/* Cluster 2: Dense Urban */}
            <Radar
              name="Cluster 2 (Urban Chokepoint)"
              dataKey="c2"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={selectedClusterId === 2 || selectedClusterId === undefined ? 0.3 : 0.05}
            />
            {/* Cluster 3: Elevated Suburban */}
            <Radar
              name="Cluster 3 (Elevated Suburban)"
              dataKey="c3"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={selectedClusterId === 3 || selectedClusterId === undefined ? 0.3 : 0.05}
            />
            {/* Cluster 4: Industrial Estuary */}
            <Radar
              name="Cluster 4 (Industrial Estuary)"
              dataKey="c4"
              stroke="#EC4899"
              fill="#EC4899"
              fillOpacity={selectedClusterId === 4 || selectedClusterId === undefined ? 0.3 : 0.05}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
