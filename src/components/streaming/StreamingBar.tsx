import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  FastForward, 
  Database, 
  Zap, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  ChevronRight,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { 
  getStreamingStatus, 
  getStreamingMetrics, 
  controlStreaming 
} from '../../services/api';
import type { StreamingStatusResponse, StreamingMetricsResponse } from '../../types';

interface StreamingBarProps {
  onOpenStreamingTab?: () => void;
}

export const StreamingBar: React.FC<StreamingBarProps> = ({ onOpenStreamingTab }) => {
  const [status, setStatus] = useState<StreamingStatusResponse | null>(null);
  const [metrics, setMetrics] = useState<StreamingMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const s = await getStreamingStatus();
      if (s) setStatus(s);
      const m = await getStreamingMetrics();
      if (m) setMetrics(m);
    } catch (e) {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = async () => {
    setLoading(true);
    const isRunning = status?.ingestion?.is_running;
    const action = isRunning ? 'stop' : 'start';
    await controlStreaming(action, status?.ingestion?.mode || 'demo', status?.ingestion?.speed_multiplier || 1.0);
    setActionNotice(isRunning ? 'Stream paused' : 'Stream active');
    setTimeout(() => setActionNotice(null), 2500);
    await fetchStatus();
    setLoading(false);
  };

  const handleSetSpeed = async (speed: number) => {
    setLoading(true);
    await controlStreaming('speed', undefined, speed);
    setActionNotice(`Playback speed: ${speed}x`);
    setTimeout(() => setActionNotice(null), 2500);
    await fetchStatus();
    setLoading(false);
  };

  const handleSetMode = async (mode: 'demo' | 'live') => {
    setLoading(true);
    await controlStreaming('mode', mode);
    setActionNotice(`Mode: ${mode === 'demo' ? 'Historical Replay' : 'Live Synthetic'}`);
    setTimeout(() => setActionNotice(null), 2500);
    await fetchStatus();
    setLoading(false);
  };

  const isConnected = status?.broker?.connected ?? false;
  const isRunning = status?.ingestion?.is_running ?? false;
  const currentSpeed = status?.ingestion?.speed_multiplier ?? 1.0;
  const currentMode = status?.ingestion?.mode ?? 'demo';
  const totalEvents = metrics?.total_events_processed ?? status?.ingestion?.total_events_produced ?? 0;
  const throughput = metrics?.throughput_events_per_sec ?? 0;

  return (
    <div className="bg-[#0C1322] border-b border-cyan-950/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
      {/* Left: Kafka & Spark Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Kafka Broker Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/70">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[10px]">KAFKA:</span>
          {isConnected ? (
            <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CLUSTER
            </span>
          ) : (
            <span className="text-cyan-300 font-semibold text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              IN-PROCESS BUS
            </span>
          )}
        </div>

        {/* Spark Structured Streaming Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/70">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 text-[10px]">SPARK:</span>
          <span className="text-amber-300 text-[10px] font-semibold">
            10m WM / 15m & 60m WND
          </span>
        </div>

        {/* Event Counter & Throughput */}
        <div className="hidden lg:flex items-center gap-2 text-slate-300">
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[10px]">EVENTS:</span>
          <span className="text-[#35D9F5] font-bold">{totalEvents.toLocaleString()}</span>
          <span className="text-slate-500 text-[10px]">({throughput} eps)</span>
        </div>
      </div>

      {/* Center: Replay / Live Controls */}
      <div className="flex items-center gap-2">
        {/* Play / Pause Button */}
        <button
          onClick={handleTogglePlay}
          disabled={loading}
          className={`px-3 py-1 rounded flex items-center gap-1.5 font-bold transition-all ${
            isRunning
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
          }`}
          title={isRunning ? 'Pause streaming replay' : 'Start streaming replay'}
        >
          {isRunning ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>PAUSE REPLAY</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>START REPLAY</span>
            </>
          )}
        </button>

        {/* Speed Multiplier Pill */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => handleSetSpeed(s)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                currentSpeed === s
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Mode Selector */}
        <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px]">
          <button
            onClick={() => handleSetMode('demo')}
            className={`px-2 py-0.5 rounded transition-colors ${
              currentMode === 'demo'
                ? 'bg-[#35D9F5]/20 text-[#35D9F5] font-bold border border-[#35D9F5]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            HISTORICAL CSV REPLAY
          </button>
          <button
            onClick={() => handleSetMode('live')}
            className={`px-2 py-0.5 rounded transition-colors ${
              currentMode === 'live'
                ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SYNTHETIC LIVE
          </button>
        </div>

        {actionNotice && (
          <span className="text-[10px] text-cyan-300 animate-pulse bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            {actionNotice}
          </span>
        )}
      </div>

      {/* Right: Navigate to Streaming Pipeline Details */}
      <div className="flex items-center gap-2">
        {onOpenStreamingTab && (
          <button
            onClick={onOpenStreamingTab}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#101827] hover:bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 hover:text-white transition-colors text-[11px]"
          >
            <Radio className="w-3.5 h-3.5 text-[#35D9F5] animate-pulse" />
            <span>KAFKA & SPARK PIPELINE</span>
            <ChevronRight className="w-3 h-3 text-cyan-400" />
          </button>
        )}
      </div>
    </div>
  );
};
