import React from 'react';
import { 
  Database, 
  Radio, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Server, 
  Activity,
  Layers
} from 'lucide-react';

export const DataSources: React.FC = () => {
  const sources = [
    {
      id: 'src-0',
      name: 'Apache Kafka & Apache Spark Structured Streaming Bus',
      category: 'Real-Time Big Data Engine',
      protocol: 'Kafka KRaft 9092 / PySpark 3.5.0 Micro-batch',
      frequency: 'Continuous Streaming (Event-Time Windowed)',
      coverage: '9 Kafka Topics across 15 GCC Zones',
      status: 'Active Streaming Engine',
      latencyMs: 45,
      records: '15m & 60m Windows / 10m Watermark',
      description: 'Distributed event bus executing scikit-learn models (Traffic RF, Traffic KMeans, Rainfall RF, Flood Model) and dead-letter quarantine routing.',
    },
    {
      id: 'src-1',
      name: 'Greater Chennai Corporation (GCC) Smart City IoT',
      category: 'Municipal Telemetry',
      protocol: 'MQTT / REST GeoJSON',
      frequency: 'Every 60 seconds',
      coverage: '15 Zones / 200 Wards',
      status: 'Synchronized',
      latencyMs: 142,
      records: '1.4M events/day',
      description: 'Zonal stormwater pumping station status, dewatering telemetry, and street ponding depth sensors.',
    },
    {
      id: 'src-2',
      name: 'India Meteorological Department (IMD) Radar Network',
      category: 'Atmospheric Radar',
      protocol: 'WMO BUFR / NetCDF API',
      frequency: 'Every 10 minutes',
      coverage: 'Chennai Doppler Radar (Sriharikota & Meenambakkam)',
      status: 'Synchronized',
      latencyMs: 280,
      records: '144 sweeps/day',
      description: 'S-band polarimetric Doppler precipitation intensity, cloud tops, and convective storm cell vectors.',
    },
    {
      id: 'src-3',
      name: 'Water Resources Department (WRD) Tamil Nadu',
      category: 'Hydrological Reservoirs',
      protocol: 'SCADA Telemetry HTTPS',
      frequency: 'Hourly',
      coverage: 'Chembarambakkam, Poondi, Red Hills, Cholavaram',
      status: 'Synchronized',
      latencyMs: 310,
      records: '96 readings/day',
      description: 'Reservoir gross storage, surplus weir discharge rates, and downstream canal gate clearances.',
    },
    {
      id: 'src-4',
      name: 'Greater Chennai Traffic Police (GCTP) Network',
      category: 'Corridor Mobility',
      protocol: 'Edge Vision RTSP / JSON Telemetry',
      frequency: 'Every 30 seconds',
      coverage: 'Anna Salai, OMR, GST Road, ECR, 100ft Inner Ring',
      status: 'Active Simulation',
      latencyMs: 95,
      records: '850K flow vectors',
      description: 'Computer-vision estimated vehicle velocities, intersection bottlenecks, and flood subway diversions.',
    },
    {
      id: 'src-5',
      name: 'INCOIS Tidal Gauge Network (Bay of Bengal)',
      category: 'Oceanographic Hydrodynamics',
      protocol: 'REST JSON',
      frequency: 'Every 15 minutes',
      coverage: 'Chennai Port & Adyar Estuary',
      status: 'Synchronized',
      latencyMs: 190,
      records: '96 tide readings/day',
      description: 'Mean Sea Level (MSL) astronomical tide elevation and storm surge backflow coefficient.',
    },
    {
      id: 'src-6',
      name: 'OpenStreetMap (OSM) Global Free Basemap Tiles',
      category: 'Geospatial Base Layers',
      protocol: 'HTTPS Slippy Map Tiles (No API Key Required)',
      frequency: 'Live CDN Distributed',
      coverage: 'Greater Chennai & Tamil Nadu Coastal Belt',
      status: 'Active Free CDN',
      latencyMs: 25,
      records: 'Raster Tiles (WGS84)',
      description: 'Open-access humanitarian cartography rendered with low-light command center dark theme filtering.',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#101827] border border-slate-800 rounded-xl p-5 shadow-hud backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-[#35D9F5]" />
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                TELEMETRY DATA SOURCES & MUNICIPAL FEEDS CATALOG
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Comprehensive inventory of integrated IoT telemetry streams, meteorological radar feeds, and municipal operational databases powering Chennai Urban Intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#141F30] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">6 Active Data Ingestion Pipelines</span>
          </div>
        </div>
      </div>

      {/* 2. Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-[#101827]/90 border border-slate-800 hover:border-[#35D9F5]/40 rounded-xl p-5 shadow-hud backdrop-blur-md transition-all flex flex-col justify-between font-mono"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {src.category}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  {src.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-2 font-sans">
                {src.name}
              </h3>

              <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                {src.description}
              </p>

              <div className="space-y-1.5 text-[11px] text-slate-300 bg-[#141F30] p-3 rounded-lg border border-slate-800 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">PROTOCOL:</span>
                  <span className="text-slate-200">{src.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UPDATE CADENCE:</span>
                  <span className="text-cyan-300">{src.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MEAN LATENCY:</span>
                  <span className="text-emerald-400 font-bold">{src.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">THROUGHPUT:</span>
                  <span className="text-white font-semibold">{src.records}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex items-center justify-between">
              <span>COVERAGE: {src.coverage}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
