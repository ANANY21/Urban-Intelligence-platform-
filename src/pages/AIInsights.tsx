import React from 'react';
import { DEMO_AI_INSIGHTS } from '../data/demoData';
import { 
  Sparkles, 
  Cpu, 
  ShieldAlert, 
  Droplets, 
  Car, 
  CloudRain, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  ArrowUpRight 
} from 'lucide-react';
import { SeverityBadge } from '../components/common/Badge';

export const AIInsights: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#35D9F5]" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                TACTICAL SITUATIONAL AI SYNTHESIS
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Automated deterministic situational reasoning derived from live Doppler radar telemetry, WRD reservoir outflow gauges, and corridor computer-vision speed sensors.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#141F30] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300">Engine:</span>
            <span className="text-[#35D9F5] font-bold">Rule-Based Deterministic Analytics</span>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="mt-3 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Synthesized mathematically from actual telemetry thresholds; no non-deterministic black-box hallucinations.</span>
        </div>
      </div>

      {/* 2. Tactical Synthesis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEMO_AI_INSIGHTS.map((insight) => (
          <div
            key={insight.id}
            className="bg-[#101827]/90 border border-slate-800 hover:border-[#35D9F5]/40 rounded-xl p-6 shadow-hud backdrop-blur-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={insight.severity} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-[#35D9F5] uppercase">
                    {insight.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {insight.timestamp}
                </span>
              </div>

              {/* Title & Zone */}
              <h3 className="text-sm font-bold text-white mb-1 font-sans">
                {insight.title}
              </h3>
              <div className="text-[11px] font-mono text-[#35D9F5] mb-3">
                ZONE: {insight.zone}
              </div>

              {/* Narrative description */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
                {insight.description}
              </p>

              {/* Deterministic Reasoning Box */}
              <div className="bg-[#141F30]/80 p-3 rounded-lg border border-slate-800 mb-3 text-xs font-mono space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  DETERMINISTIC TELEMETRY BASIS
                </div>
                <div className="text-slate-300 text-[11px]">
                  {insight.deterministicReason}
                </div>
              </div>
            </div>

            {/* Recommended Protocol */}
            <div className="p-3 bg-cyan-950/20 border border-[#35D9F5]/30 rounded-lg text-xs font-sans">
              <div className="font-mono text-[10px] text-[#35D9F5] font-bold uppercase mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                RECOMMENDED OPERATIONAL ACTION
              </div>
              <div className="text-slate-200 text-xs">
                {insight.suggestedAction}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Operational Dispatch Protocols Matrix */}
      <div className="bg-[#101827]/90 border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md font-mono">
        <div className="text-xs font-bold tracking-wider uppercase text-slate-300 mb-3">
          AUTOMATED PROTOCOL TRIGGER MATRIX (GREATER CHENNAI DISASTER DESK)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#141F30]/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-red-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              STAGE 1: DAM DISCHARGE &gt; 4,000 CFS
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Sound low-bank warning sirens at Saidapet, Jafferkhanpet, Kotturpuram. Evacuate settlements within 50m of river embankment.
            </p>
          </div>

          <div className="p-4 bg-[#141F30]/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              STAGE 2: SUBWAY WATER LEVEL &gt; 300 MM
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Automated boom barrier closure at Vyasarpadi, Thillai Ganga Nagar, and Ganesapuram. Traffic diversion messaging pushed to digital VMS signs.
            </p>
          </div>

          <div className="p-4 bg-[#141F30]/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-[#35D9F5] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#35D9F5]" />
              STAGE 3: BASIN RAINFALL &gt; 65 MM/24H
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Deploy emergency dewatering diesel pumps (80-120 HP) to Velachery Lake, Madipakkam, and Perungudi low pockets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
