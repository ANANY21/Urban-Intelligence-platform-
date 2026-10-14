import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import { 
  CHENNAI_CENTER, 
  CHENNAI_ZONES, 
  CHENNAI_WATERWAYS, 
  CHENNAI_CORRIDORS,
  type ChennaiZone 
} from '../../data/chennaiGeo';
import { 
  DEMO_WEATHER_STATIONS, 
  DEMO_TRAFFIC_INCIDENTS,
  PRESET_PREDICTION_HOTSPOTS 
} from '../../data/demoData';
import { MapLegend } from './MapLegend';
import { Search, Navigation, Maximize2, Radio, Droplets, Car, ShieldAlert } from 'lucide-react';
import { RiskBadge } from '../common/Badge';

// Helper component to programmatically pan/zoom map
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

interface TileConfig {
  provider: 'OpenStreetMap' | 'Mapbox' | 'MapTiler';
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string | string[];
}

const OSM_FREE_TILES: TileConfig = {
  provider: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  subdomains: ['a', 'b', 'c'],
};

// Check for optional commercial map keys
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

const getInitialTileConfig = (): TileConfig => {
  if (MAPBOX_TOKEN && MAPBOX_TOKEN.trim() !== '') {
    return {
      provider: 'Mapbox',
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN.trim()}`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    };
  }

  if (MAPTILER_KEY && MAPTILER_KEY.trim() !== '') {
    return {
      provider: 'MapTiler',
      url: `https://api.maptiler.com/maps/basic-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY.trim()}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    };
  }

  // Free default: OpenStreetMap (no API key required)
  return OSM_FREE_TILES;
};

interface ChennaiCommandMapProps {
  selectedLocation?: [number, number] | null;
  onSelectHotspot?: (hotspotKey: string, lat: number, lng: number) => void;
  className?: string;
}

export const ChennaiCommandMap: React.FC<ChennaiCommandMapProps> = ({
  selectedLocation,
  onSelectHotspot,
  className = '',
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(CHENNAI_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileConfig, setTileConfig] = useState<TileConfig>(getInitialTileConfig);
  const [hasFallenBack, setHasFallenBack] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    flood: true,
    rainfall: true,
    traffic: true,
    waterways: true,
    incidents: true,
  });

  // Startup diagnostic check on map environment keys
  useEffect(() => {
    if (!MAPBOX_TOKEN && !MAPTILER_KEY && !GOOGLE_MAPS_KEY) {
      console.info(
        '[MapBasemap] Verified basemap configuration: No commercial API keys provided (VITE_MAPBOX_TOKEN, VITE_MAPTILER_KEY, VITE_GOOGLE_MAPS_KEY are not set). ' +
        'Active Tile Provider: OpenStreetMap Free Basemap (https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png). ' +
        'Center: [13.0827, 80.2707], Zoom: 11.'
      );
    } else {
      console.info(
        `[MapBasemap] Commercial key detected. Initialized with ${tileConfig.provider}. Auto-fallback to OpenStreetMap is active.`
      );
    }
  }, []);

  // Update center when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter(selectedLocation);
      setMapZoom(14);
    }
  }, [selectedLocation]);

  // Graceful auto-fallback to OpenStreetMap if tile requests fail (401/403/invalid key)
  const handleTileError = (e: any) => {
    if (!hasFallenBack && tileConfig.provider !== 'OpenStreetMap') {
      console.warn(
        `[MapBasemap] 401 Unauthorized / Invalid key / Tile load error detected on provider "${tileConfig.provider}". ` +
        `Automatically switching to OpenStreetMap free basemap (${OSM_FREE_TILES.url}). Error details:`,
        e
      );
      setHasFallenBack(true);
      setTileConfig(OSM_FREE_TILES);
    }
  };

  const toggleLayer = (layer: 'flood' | 'rainfall' | 'traffic' | 'waterways' | 'incidents') => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Preset location quick jumps
  const handleQuickJump = (loc: string) => {
    if (loc === 'all') {
      setMapCenter(CHENNAI_CENTER);
      setMapZoom(11);
    } else if (loc === 'velachery') {
      setMapCenter([12.9815, 80.2180]);
      setMapZoom(14);
    } else if (loc === 'adyar') {
      setMapCenter([13.0178, 80.2205]);
      setMapZoom(13);
    } else if (loc === 'omr') {
      setMapCenter([12.9380, 80.2340]);
      setMapZoom(12);
    } else if (loc === 'north') {
      setMapCenter([13.1610, 80.2800]);
      setMapZoom(12);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[500px] bg-[#080D16] rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Top Map HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search & Location Filter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#101827]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-lg">
          <Search className="w-4 h-4 text-[#35D9F5]" />
          <input
            type="text"
            placeholder="Search Chennai Ward / Hotspot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-48 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick View Switchers */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#101827]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => handleQuickJump('all')}
            className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Metro Full
          </button>
          <button
            onClick={() => handleQuickJump('velachery')}
            className="px-2.5 py-1 rounded hover:bg-red-500/20 text-red-400 font-semibold transition-colors"
          >
            Velachery Lowland
          </button>
          <button
            onClick={() => handleQuickJump('adyar')}
            className="px-2.5 py-1 rounded hover:bg-cyan-500/20 text-[#35D9F5] transition-colors"
          >
            Adyar Spate
          </button>
          <button
            onClick={() => handleQuickJump('omr')}
            className="px-2.5 py-1 rounded hover:bg-amber-500/20 text-amber-400 transition-colors"
          >
            OMR Corridor
          </button>
          <button
            onClick={() => handleQuickJump('north')}
            className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          >
            North Basin
          </button>
        </div>

        {/* Live Coordinate Crosshair & Basemap indicator */}
        <div className="hidden lg:flex items-center gap-2 pointer-events-auto bg-[#101827]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800/80 text-[10px] font-mono text-slate-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>LAT: 13.0827°N</span>
          <span className="text-slate-600">|</span>
          <span>LON: 80.2707°E</span>
          <span className="text-slate-600">|</span>
          <span className="text-[#35D9F5]">BASEMAP: {tileConfig.provider.toUpperCase()}</span>
          {tileConfig.provider === 'OpenStreetMap' && (
            <span className="text-emerald-400 font-bold">[FREE TILE CDN]</span>
          )}
        </div>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
        <MapLegend activeLayers={activeLayers} onToggleLayer={toggleLayer} />
      </div>

      {/* Main Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        attributionControl={true}
        className={`w-full h-full ${tileConfig.provider === 'OpenStreetMap' ? 'osm-dark-tiles' : 'native-dark-tiles'}`}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Dynamic Basemap TileLayer with Automatic Error Fallback */}
        <TileLayer
          key={tileConfig.url}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          subdomains={tileConfig.subdomains as any}
          maxZoom={tileConfig.maxZoom}
          eventHandlers={{
            tileerror: handleTileError,
          }}
        />

        {/* LAYER 1: Waterways & River Courses */}
        {activeLayers.waterways &&
          CHENNAI_WATERWAYS.map((wb, idx) => (
            <React.Fragment key={`wb-${idx}`}>
              <Polyline
                positions={wb.coordinates}
                pathOptions={{
                  color: wb.type === 'wetland' ? '#14B8A6' : '#35D9F5',
                  weight: wb.type === 'river' ? 5 : 3,
                  opacity: 0.85,
                  dashArray: wb.type === 'canal' ? '6, 6' : undefined,
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs">
                    <div className="font-bold text-[#35D9F5] mb-1">{wb.name}</div>
                    <div className="text-slate-300 text-[11px] mb-1">
                      Water Level: <span className="font-bold text-amber-400">{wb.currentLevelM}m</span> (Danger: {wb.dangerLevelM}m)
                    </div>
                    <div className="text-[10px] text-slate-400">{wb.flowStatus}</div>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          ))}

        {/* LAYER 2: Road Corridors & Traffic Congestion */}
        {activeLayers.traffic &&
          CHENNAI_CORRIDORS.map((corridor) => {
            const color =
              corridor.severity === 'severe'
                ? '#EF4444'
                : corridor.severity === 'heavy'
                ? '#F97316'
                : corridor.severity === 'moderate'
                ? '#F59E0B'
                : '#10B981';

            return (
              <Polyline
                key={corridor.id}
                positions={corridor.coordinates}
                pathOptions={{
                  color,
                  weight: 5,
                  opacity: 0.85,
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs min-w-[200px]">
                    <div className="font-bold text-white mb-1 flex items-center justify-between">
                      <span>{corridor.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 uppercase">
                        {corridor.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] my-2 text-slate-300">
                      <div>Speed: <span className="text-white font-bold">{corridor.currentSpeedKmh} km/h</span></div>
                      <div>Free Flow: <span className="text-slate-400">{corridor.freeFlowSpeedKmh} km/h</span></div>
                      <div>Delay: <span className="text-red-400 font-bold">+{corridor.delayMinutes} min</span></div>
                      <div>Congestion: <span className="text-amber-400">{corridor.congestionIndex}%</span></div>
                    </div>
                    {corridor.waterloggingStatus && (
                      <div className="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                        ⚠️ {corridor.waterloggingStatus}
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* LAYER 3: Flood Risk Zones & Wards */}
        {activeLayers.flood &&
          CHENNAI_ZONES.filter(z => !searchQuery || z.name.toLowerCase().includes(searchQuery.toLowerCase())).map((zone) => {
            const riskColors: Record<string, string> = {
              critical: '#EF4444',
              high: '#F87171',
              moderate: '#FB923C',
              low: '#3B82F6',
              safe: '#14B8A6',
            };
            const color = riskColors[zone.riskLevel] || '#35D9F5';
            const radius = zone.riskLevel === 'critical' ? 16 : zone.riskLevel === 'high' ? 13 : 9;

            return (
              <CircleMarker
                key={zone.id}
                center={zone.center}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.65,
                  color: color,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs min-w-[210px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 uppercase">{zone.zoneNo}</span>
                      <RiskBadge level={zone.riskLevel} />
                    </div>
                    <div className="text-sm font-bold text-white mb-2">{zone.name}</div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span>Rainfall Intensity:</span>
                        <span className="font-bold text-blue-400">{zone.rainfallMm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Traffic Congestion:</span>
                        <span className="font-bold text-amber-400">{zone.congestionIndex}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monitored Population:</span>
                        <span className="text-slate-400">{zone.population}</span>
                      </div>
                    </div>
                    {onSelectHotspot && (
                      <button
                        onClick={() => {
                          const key = zone.name.toLowerCase().includes('velachery') ? 'velachery' : 'adyar';
                          onSelectHotspot(key, zone.center[0], zone.center[1]);
                        }}
                        className="mt-3 w-full py-1 bg-[#35D9F5]/20 hover:bg-[#35D9F5]/30 text-[#35D9F5] border border-[#35D9F5]/40 rounded text-[11px] font-bold uppercase transition-colors"
                      >
                        Simulate Flood Model &rarr;
                      </button>
                    )}
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <span className="font-mono text-xs font-bold">{zone.name}: {zone.riskLevel.toUpperCase()}</span>
                </Tooltip>
              </CircleMarker>
            );
          })}

        {/* LAYER 4: Weather Stations & Rainfall Halos */}
        {activeLayers.rainfall &&
          DEMO_WEATHER_STATIONS.map((ws) => (
            <React.Fragment key={ws.id}>
              {/* Outer Radar Ping halo */}
              <CircleMarker
                center={ws.coordinates}
                radius={24}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.12,
                  weight: 1,
                  dashArray: '2, 4',
                }}
              />
              <CircleMarker
                center={ws.coordinates}
                radius={7}
                pathOptions={{
                  color: '#60A5FA',
                  fillColor: '#2563EB',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs">
                    <div className="font-bold text-blue-400 mb-0.5">{ws.name}</div>
                    <div className="text-[10px] text-slate-400 mb-2">{ws.area}</div>
                    <div className="space-y-1 text-[11px]">
                      <div>Intensity: <span className="font-bold text-white">{ws.rainfallIntensityMmPerHour} mm/h</span></div>
                      <div>24h Accumulated: <span className="font-bold text-blue-300">{ws.rainfallAccumulated24hMm} mm</span></div>
                      <div>Humidity: <span className="text-slate-300">{ws.humidityPercent}%</span> | Temp: {ws.temperatureC}°C</div>
                      <div>Threshold: <span className="text-amber-400 uppercase font-semibold">{ws.thresholdLevel}</span></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          ))}

        {/* LAYER 5: Traffic Incidents & Roadway Hazards */}
        {activeLayers.incidents &&
          DEMO_TRAFFIC_INCIDENTS.map((inc) => (
            <CircleMarker
              key={inc.id}
              center={inc.coordinates}
              radius={8}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#DC2626',
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{inc.type.toUpperCase()}: {inc.severity.toUpperCase()}</span>
                  </div>
                  <div className="text-white font-medium mb-1">{inc.corridor}</div>
                  <div className="text-[11px] text-slate-300 mb-2">{inc.description}</div>
                  <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                    <span>Lanes affected: {inc.lanesAffected}</span>
                    <span>{inc.timestamp}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
};
