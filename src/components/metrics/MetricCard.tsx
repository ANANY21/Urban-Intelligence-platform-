import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  definition?: string;
  trend?: number; // e.g. +12.5 or -8.0
  trendLabel?: string;
  statusText: string;
  statusVariant?: 'cyan' | 'red' | 'amber' | 'green' | 'blue';
  sparkline?: number[];
  isDemo?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  definition,
  trend,
  trendLabel = 'vs prev 6h',
  statusText,
  statusVariant = 'cyan',
  sparkline = [20, 35, 28, 45, 52, 60, 58, 65],
  isDemo = true,
  icon,
  onClick,
}) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  // Render SVG Sparkline
  const minVal = Math.min(...sparkline, 0);
  const maxVal = Math.max(...sparkline, 1);
  const range = maxVal - minVal || 1;
  const width = 120;
  const height = 36;
  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColors = {
    cyan: '#35D9F5',
    red: '#EF4444',
    amber: '#F59E0B',
    green: '#10B981',
    blue: '#3B82F6',
  };
  const strokeColor = strokeColors[statusVariant] || '#35D9F5';

  return (
    <div
      onClick={onClick}
      className={`relative group bg-[#101827]/90 border border-slate-800/80 hover:border-[#35D9F5]/40 rounded-xl p-5 transition-all duration-300 shadow-hud backdrop-blur-md overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Corner Technical Accents */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#35D9F5]/40"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-slate-700/60"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {icon && <div className="text-[#35D9F5] opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>}
          <span className="text-xs font-mono font-medium tracking-wider uppercase text-slate-400 group-hover:text-slate-300">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDemo ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
              DEMO DATA
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Metric Main Value and Sparkline */}
      <div className="flex items-end justify-between gap-4 my-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-slate-400 font-mono">
                {unit}
              </span>
            )}
          </div>
          {definition && (
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans">
              {definition}
            </div>
          )}
        </div>

        {/* Sparkline Graphic */}
        <div className="flex flex-col items-end">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,${height} ${points} ${width},${height}`}
              fill={`url(#grad-${title.replace(/\s+/g, '')})`}
            />
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Footer: Trend and Status Indicator */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {trend !== undefined && (
            <span
              className={`flex items-center font-semibold ${
                isPositive ? 'text-red-400' : isNegative ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend > 0 ? `+${trend}` : trend}%
            </span>
          )}
          <span className="text-slate-500">{trendLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              statusVariant === 'red'
                ? 'bg-red-500 shadow-[0_0_8px_#EF4444]'
                : statusVariant === 'amber'
                ? 'bg-amber-500 shadow-[0_0_8px_#F59E0B]'
                : statusVariant === 'green'
                ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
                : statusVariant === 'blue'
                ? 'bg-blue-500 shadow-[0_0_8px_#3B82F6]'
                : 'bg-[#35D9F5] shadow-[0_0_8px_#35D9F5]'
            }`}
          />
          <span className="text-[11px] font-mono tracking-wider font-semibold text-slate-300">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};
