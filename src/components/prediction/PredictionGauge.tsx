import React from 'react';
import type { RiskLevel } from '../../types';

interface PredictionGaugeProps {
  probability: number; // 0 to 1
  riskLevel: RiskLevel;
  predictionClass: 'Flood' | 'No Flood';
  confidence?: number;
}

export const PredictionGauge: React.FC<PredictionGaugeProps> = ({
  probability,
  riskLevel,
  predictionClass,
  confidence,
}) => {
  const percentage = Math.round(probability * 100);
  
  // Circumference calculation for SVG circle gauge
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probability * circumference);

  const colors: Record<RiskLevel, { stroke: string; glow: string; text: string }> = {
    critical: { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-red-400' },
    high: { stroke: '#F87171', glow: 'rgba(248, 113, 113, 0.3)', text: 'text-red-400' },
    moderate: { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400' },
    low: { stroke: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)', text: 'text-blue-400' },
    safe: { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' },
  };

  const style = colors[riskLevel] || colors.safe;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#101827]/90 rounded-xl border border-slate-800 shadow-hud text-center relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute w-44 h-44 rounded-full blur-3xl pointer-events-none -z-10"
        style={{ backgroundColor: style.glow }}
      />

      {/* SVG Circular Dial */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Track Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#1E293B"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Value Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={style.stroke}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Value */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {percentage}%
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            PROBABILITY
          </span>
        </div>
      </div>

      {/* Binary Classification Badge */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
            predictionClass === 'Flood'
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
        >
          PREDICTED: {predictionClass.toUpperCase()}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Risk Class: <span className={`font-semibold ${style.text}`}>{riskLevel.toUpperCase()}</span>
          {confidence && (
            <span className="text-slate-500 ml-2">
              (Conf: {Math.round(confidence * 100)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
