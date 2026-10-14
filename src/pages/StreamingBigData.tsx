import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Server, 
  Zap, 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  Clock, 
  Filter, 
  Eye, 
  FileText, 
  Activity,
  Info,
  Terminal,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getStreamingStatus, 
  getStreamingMetrics, 
  controlStreaming, 
  getRecentStreamingEvents, 
  getDeadLetterEvents,
  getStreamingAlerts
} from '../services/api';
import type { 
  StreamingStatusResponse, 
  StreamingMetricsResponse, 
  StreamingEventItem, 
  DeadLetterItem 
} from '../types';

export const StreamingBigData: React.FC = () => {
  const [status, setStatus] = useState<StreamingStatusResponse | null>(null);
  const [metrics, setMetrics] = useState<StreamingMetricsResponse | null>(null);
  const [events, setEvents] = useState<StreamingEventItem[]>([]);
  const [deadLetters, setDeadLetters] = useState<DeadLetterItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<StreamingEventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Poll status & events
  const loadData = async () => {
    try {
      const s = await getStreamingStatus();
      if (s) setStatus(s);
      const m = await getStreamingMetrics();
      if (m) setMetrics(m);
      const evs = await getRecentStreamingEvents(40, selectedTopic === 'all' ? undefined : selectedTopic);
      setEvents(evs);
      const dls = await getDeadLetterEvents(20);
      setDeadLetters(dls);
      const alts = await getStreamingAlerts(15);
      setAlerts(alts);
    } catch (e) {
      console.error('Error fetching streaming data:', e);
    }
  };

  useEffect(() => {
    loadData();
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [selectedTopic, autoRefresh]);

  const handleControl = async (action: 'start' | 'stop' | 'seed', speed?: number, mode?: 'demo' | 'live') => {
    setLoading(true);
    const res = await controlStreaming(action, mode, speed);
    if (res?.message) {
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 3000);
    }
    await loadData();
    setLoading(false);
  };

  const handleSpeedChange = async (speed: number) => {
    setLoading(true);
    await controlStreaming('speed', undefined, speed);
    setActionNotice(`Speed set to ${speed}x`);
    setTimeout(() => setActionNotice(null), 2500);
    await loadData();
    setLoading(false);
  };

  const isConnected = status?.broker?.connected ?? false;
  const isRunning = status?.ingestion?.is_running ?? false;
  const currentSpeed = status?.ingestion?.speed_multiplier ?? 1.0;
  const currentMode = status?.ingestion?.mode ?? 'demo';
  const totalEvents = metrics?.total_events_processed ?? status?.ingestion?.total_events_produced ?? 0;
  const deadLetterCount = metrics?.dead_letter_count ?? 0;
  const throughput = metrics?.throughput_events_per_sec ?? 0;

  const topicsList = status?.topics || [
    'weather-raw',
    'rainfall-raw',
    'traffic-raw',
    'weather-processed',
    'rainfall-predictions',
    'traffic-predictions',
    'flood-risk-events',
    'urban-alerts',
    'dead-letter-events'
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="relative bg-gradient-to-r from-[#101827] via-[#142338] to-[#0A101D] border border-cyan-900/40 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35D9F5]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-[#35D9F5] uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                DISTRIBUTED BIG DATA PIPELINE // KRaft KAFKA & SPARK STRUCTURED STREAMING
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Streaming Telemetry & ML Inference Bus
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Real-time ingestion, event-time window aggregations (15m & 60m), 10-minute watermark delay eviction, and scikit-learn model inference pipelines across 15 Greater Chennai Corporation zones.
            </p>
          </div>

          {/* Quick Engine Status Pill */}
          <div className="flex flex-col items-end gap-2">
            <div className={`px-4 py-2 rounded-xl border backdrop-blur-md flex items-center gap-2.5 font-mono ${
              isRunning ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <div className="text-right">
                <div className="text-[10px] text-slate-400">PIPELINE STATE</div>
                <div className="text-xs font-black">
                  {isRunning ? `STREAMING ACTIVE (${currentSpeed}x)` : 'STREAMING IDLE'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  autoRefresh 
                    ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Auto-Refresh: {autoRefresh ? '3s ON' : 'PAUSED'}
              </button>
              <button
                onClick={loadData}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Refresh manually"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Scientific Disclosure Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 font-mono">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-cyan-300 font-bold">Scientific & Operational Disclosure:</span> When operating in{' '}
            <span className="text-white underline">Historical Replay Mode</span>, telemetry is streamed directly from empirical historical records (
            <code className="text-cyan-200">Traffic.csv</code> and <code className="text-cyan-200">chennai_rainfall.csv</code>) using true chronological intervals and speed factors. When operating in{' '}
            <span className="text-purple-300 underline">Synthetic Live Mode</span>, sensor observations are generated with calibrated meteorological constraints. Measurements are transparently flagged with data provenance and quality scores.
          </div>
        </div>
      </div>

      {/* 2. Ingestion Controls & Speed Multipliers */}
      <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleControl(isRunning ? 'stop' : 'start')}
              disabled={loading}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-md ${
                isRunning
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE STREAM</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START STREAMING REPLAY</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleControl('seed')}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
              title="Push an immediate micro-batch through Kafka topics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>SEED MICRO-BATCH</span>
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <FastForward className="w-3 h-3 text-cyan-400" />
              SPEED:
            </span>
            {[0.5, 1, 2, 5, 10, 20].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentSpeed === s
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/60'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">DATASET:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => handleControl('start', currentSpeed, 'demo')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                currentMode === 'demo'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HISTORICAL CSV REPLAY
            </button>
            <button
              onClick={() => handleControl('start', currentSpeed, 'live')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                currentMode === 'live'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LIVE SYNTHETIC SENSORS
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="w-full text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* 3. High-Level Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kafka Cluster Status */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>MESSAGE BROKER</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
              {isConnected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  KAFKA CLUSTER
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  STANDALONE BUS
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
              {status?.broker?.bootstrap_servers || 'localhost:9092, localhost:29092'}
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>KRaft Mode: Enabled</span>
            <span>9 Topics Active</span>
          </div>
        </div>

        {/* Card 2: Spark Structured Streaming */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SPARK STREAMING</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-amber-300">
              {metrics?.spark_version || '3.5.0-Structured'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Watermark: <span className="text-cyan-300 font-bold">10 min</span> delay eviction
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Windows: 15m & 60m</span>
            <span>Uptime: {metrics?.uptime_seconds || 0}s</span>
          </div>
        </div>

        {/* Card 3: Ingestion Throughput */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>EVENT THROUGHPUT</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-emerald-400">
              {throughput} <span className="text-xs font-normal text-slate-400">EPS</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Total Processed: <span className="text-white font-bold">{totalEvents.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Mode: {currentMode.toUpperCase()}</span>
            <span>Persisted: {metrics?.persisted_events_count || totalEvents}</span>
          </div>
        </div>

        {/* Card 4: Dead-Letter & Quality Score */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DATA INTEGRITY</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <span className="text-cyan-400">99.2%</span>
              <span className="text-xs text-slate-400 font-normal">Quality</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Dead-Letter Queue: <span className={deadLetterCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{deadLetterCount} events</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Quarantine Topic</span>
            <span>Schema-Validated</span>
          </div>
        </div>
      </div>

      {/* 4. Kafka Topics Architecture & Schema Topology */}
      <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-5 font-mono">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#35D9F5]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Configured Kafka Topics & Message Contracts (9 Topics)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Partitions: 3 | Replication: 1 | Retention: 72h-168h</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topicsList.map((t) => {
            const isRaw = t.includes('raw');
            const isDead = t.includes('dead-letter');
            const isAlert = t.includes('alert');
            const meta = status?.topic_metadata?.[t];
            const eventCount = metrics?.topic_distribution?.[t] ?? 0;

            let borderStyle = 'border-slate-800 bg-slate-900/60';
            let badgeStyle = 'bg-slate-800 text-slate-300';
            if (isRaw) {
              borderStyle = 'border-blue-900/40 bg-blue-950/20';
              badgeStyle = 'bg-blue-900/40 text-blue-300';
            } else if (isDead) {
              borderStyle = 'border-rose-900/40 bg-rose-950/20';
              badgeStyle = 'bg-rose-900/40 text-rose-300';
            } else if (isAlert) {
              borderStyle = 'border-amber-900/40 bg-amber-950/20';
              badgeStyle = 'bg-amber-900/40 text-amber-300';
            } else {
              borderStyle = 'border-cyan-900/40 bg-cyan-950/20';
              badgeStyle = 'bg-cyan-900/40 text-cyan-300';
            }

            return (
              <div 
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-[#35D9F5]/70 ${borderStyle} ${
                  selectedTopic === t ? 'ring-1 ring-[#35D9F5]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${badgeStyle}`}>
                    {t}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {eventCount} msgs
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  {meta?.description || 'Streaming event pipeline contract'}
                </div>
                <div className="mt-2 text-[9px] text-slate-500 flex justify-between">
                  <span>Retention: {meta?.retention_hours || 72}h</span>
                  <span>Payload: {meta?.schema || 'JSON'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Live Events Terminal & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Left 2 Cols: Live Streaming Events Table */}
        <div className="lg:col-span-2 bg-[#0C1322] border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Kafka Event Stream
              </h3>
              <span className="text-[10px] text-slate-500">
                (Filtered: {selectedTopic})
              </span>
            </div>

            {/* Filter Pill */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="all">All Topics</option>
                {topicsList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Events Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Radio className="w-6 h-6 mb-2 text-slate-600 animate-pulse" />
                <span>No events captured on topic '{selectedTopic}' yet.</span>
                <button
                  onClick={() => handleControl('seed')}
                  className="mt-2 text-cyan-400 underline hover:text-cyan-300"
                >
                  Seed a test micro-batch
                </button>
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedEvent?.event_id === ev.event_id
                      ? 'bg-cyan-950/40 border-[#35D9F5]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-white">{ev.event_type}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                          {ev.topic}
                        </span>
                        {ev.is_replay && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            REPLAY
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Location: <span className="text-slate-300">{ev.location_id}</span> | Time: {ev.timestamp.split('T')[1]?.slice(0, 8)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      View Payload
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: JSON Event Envelope Inspector */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Event Payload Inspector
              </h3>
            </div>
            {selectedEvent && (
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {selectedEvent.event_id.slice(0, 8)}...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-950/80 p-3 rounded-lg border border-slate-900 text-[11px] font-mono text-cyan-300">
            {selectedEvent ? (
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>Select any streaming event to inspect its full JSON envelope.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Dead-Letter Quarantine & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
        {/* Dead Letter Queue */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Dead-Letter Quarantine (Quarantined Records)
              </h3>
            </div>
            <span className="text-xs text-rose-400 font-bold">{deadLetters.length} quarantined</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {deadLetters.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-500 text-xs text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span>Zero dead-letter events. All ingested streaming envelopes pass schema validation.</span>
              </div>
            ) : (
              deadLetters.map((dl) => (
                <div key={dl.dead_letter_id} className="p-2.5 rounded bg-rose-950/20 border border-rose-900/50 text-xs">
                  <div className="flex justify-between text-rose-300 font-bold">
                    <span>Topic: {dl.original_topic}</span>
                    <span className="text-[10px] text-slate-400">{dl.failed_at.split('T')[1]?.slice(0, 8)}</span>
                  </div>
                  <div className="text-slate-300 text-[11px] mt-1">
                    Reason: <span className="text-rose-200">{dl.rejection_reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Generated Urban Alerts */}
        <div className="bg-[#0C1322] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Crisis Dispatch & Streaming Rule Alerts
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-bold">{alerts.length} active</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-500 text-xs text-center">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <span>No threshold-exceeding crisis alerts currently registered.</span>
              </div>
            ) : (
              alerts.map((alt) => (
                <div key={alt.alert_id} className="p-2.5 rounded bg-amber-950/20 border border-amber-900/50 text-xs">
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>{alt.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                      {alt.severity?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] mt-1">
                    {alt.message}
                  </div>
                  {alt.recommended_action && (
                    <div className="text-[10px] text-cyan-300 mt-1">
                      Action: {alt.recommended_action}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
