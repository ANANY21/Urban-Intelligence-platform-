import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { DEMO_RAINFALL_24H, DEMO_RAINFALL_7D } from '../../data/demoData';

interface RainfallTimelineChartProps {
  timeframe?: '24h' | '7d';
}

export const RainfallTimelineChart: React.FC<RainfallTimelineChartProps> = () => {
  const [selectedRange, setSelectedRange] = useState<'6h' | '24h' | '7d'>('24h');

  const chartData = selectedRange === '7d' 
    ? DEMO_RAINFALL_7D.map(d => ({ time: d.day, intensity: d.observedMm, threshold: 15.6, normal: d.historicalNormalMm }))
    : selectedRange === '6h'
    ? DEMO_RAINFALL_24H.slice(4)
    : DEMO_RAINFALL_24H;

  return (
    <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            RAINFALL INTENSITY & METEOROLOGICAL THRESHOLDS
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Real-time radar & Doppler gauge observations across Greater Chennai
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center gap-1 bg-[#141F30] p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {(['6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1 rounded transition-colors ${
                selectedRange === range
                  ? 'bg-[#35D9F5] text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center gap-6 mb-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
          <span>Observed Intensity (mm/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-amber-400 border-t border-dashed border-amber-400" />
          <span>IMD Heavy Threshold (15.6 mm/h)</span>
        </div>
        <div className="ml-auto text-slate-300">
          Peak Surge: <span className="text-[#35D9F5] font-bold">36.2 mm/h</span> @ 18:00 IST
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="100%">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              unit=" mm"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#101827] border border-[#35D9F5]/40 rounded-lg p-2.5 shadow-2xl text-xs font-mono">
                      <div className="text-slate-400 mb-1">{label} IST</div>
                      <div className="text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                        <span>Rainfall: {payload[0].value} mm</span>
                      </div>
                      <div className="text-[10px] text-amber-400 mt-1">
                        Threshold: 15.6 mm (IMD Alert standard)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={15.6}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{ value: '15.6mm Warning', fill: '#F59E0B', fontSize: 10, position: 'right' }}
            />
            <Area
              type="monotone"
              dataKey="intensity"
              stroke="#35D9F5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#rainGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
