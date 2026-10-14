import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { CHENNAI_CORRIDORS } from '../../data/chennaiGeo';

export const TrafficFlowChart: React.FC = () => {
  const data = CHENNAI_CORRIDORS.map(c => ({
    name: c.name.split('(')[0].trim(),
    speed: c.currentSpeedKmh,
    freeFlow: c.freeFlowSpeedKmh,
    congestion: c.congestionIndex,
    delay: c.delayMinutes,
    severity: c.severity,
  }));

  const getBarColor = (severity: string) => {
    switch (severity) {
      case 'severe': return '#EF4444';
      case 'heavy': return '#F97316';
      case 'moderate': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            ARTERIAL CORRIDOR MOBILITY & CONGESTION
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Current vehicle transit velocity vs designed free-flow capacity
          </div>
        </div>
        <div className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          KM/H VELOCITY
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
            <XAxis type="number" stroke="#64748B" fontSize={11} fontFamily="monospace" unit=" km/h" domain={[0, 60]} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94A3B8"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              width={110}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#101827] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
                      <div className="font-bold text-white mb-1">{item.name}</div>
                      <div className="text-slate-300">Current Velocity: <span className="font-bold text-[#35D9F5]">{item.speed} km/h</span></div>
                      <div className="text-slate-400">Free Flow: {item.freeFlow} km/h</div>
                      <div className="text-amber-400">Transit Delay: +{item.delay} min</div>
                      <div className="text-slate-400">Congestion Index: {item.congestion}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.severity)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Free Flow</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Moderate Delay</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Heavy Choke</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Inundated / Severe</span>
        </div>
      </div>
    </div>
  );
};
