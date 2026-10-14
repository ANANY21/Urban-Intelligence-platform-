export type RiskLevel = 'safe' | 'low' | 'moderate' | 'high' | 'critical';

export type AlertSeverity = 'critical' | 'high' | 'moderate' | 'advisory';

export type AlertCategory = 'flood' | 'rainfall' | 'traffic' | 'infrastructure' | 'reservoir';

export interface Alert {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  location: string;
  coordinates: [number, number];
  timestamp: string;
  source: string;
  acknowledged: boolean;
  recommendedAction?: string;
  isSimulated?: boolean;
}

export interface FloodPredictionInput {
  latitude: number;
  longitude: number;
  rainfall_mm: number;
  temperature_c: number;
  humidity_percent: number;
  river_discharge_m3s: number;
  water_level_m: number;
  elevation_m: number;
  land_cover: string;
  soil_type: string;
  population_density: number;
  infrastructure_score: number;
  historical_floods: number;
}

export interface FeatureContribution {
  feature: string;
  impact: number; // positive = increased risk, negative = lowered risk
  value: string | number;
}

export interface FloodPredictionResult {
  flood_probability: number; // 0 to 1
  prediction_class: 'Flood' | 'No Flood';
  risk_level: RiskLevel;
  cluster_id: number;
  cluster_name: string;
  cluster_description: string;
  confidence: number;
  model_version: string;
  evaluated_at: string;
  is_demo: boolean;
  feature_contributions: FeatureContribution[];
  recommendations: string[];
}

export interface WeatherStation {
  id: string;
  name: string;
  area: string;
  coordinates: [number, number];
  rainfallIntensityMmPerHour: number;
  rainfallAccumulated24hMm: number;
  rainfallAccumulated7dMm: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  status: 'normal' | 'alert' | 'warning' | 'critical';
  thresholdLevel: 'light' | 'moderate' | 'heavy' | 'very_heavy' | 'extremely_heavy';
  lastUpdated: string;
}

export interface TrafficCorridor {
  id: string;
  name: string;
  category: 'arterial' | 'expressway' | 'coastal' | 'ring_road';
  from: string;
  to: string;
  coordinates: [number, number][]; // polyline
  currentSpeedKmh: number;
  freeFlowSpeedKmh: number;
  congestionIndex: number; // 0 - 100
  travelTimeMinutes: number;
  delayMinutes: number;
  severity: 'free' | 'moderate' | 'heavy' | 'severe';
  waterloggingStatus?: string;
  isSimulated: boolean;
}

export interface TrafficIncident {
  id: string;
  type: 'waterlogging' | 'breakdown' | 'diversion' | 'roadwork' | 'accident';
  corridor: string;
  coordinates: [number, number];
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  lanesAffected: number;
  timestamp: string;
}

export interface RiskZoneCluster {
  clusterId: number;
  name: string;
  color: string;
  recordsCount: number;
  avgRainfallMm: number;
  avgElevationM: number;
  avgRiverDischarge: number;
  avgWaterLevelM: number;
  avgPopulationDensity: number;
  historicalFloodRatePercent: number;
  riskProfile: string;
  topFeatures: string[];
  sampleLocations: string[];
}

export interface ClusterDataPoint {
  id: string;
  name: string;
  coordinates: [number, number];
  clusterId: number;
  rainfallMm: number;
  elevationM: number;
  riverDischarge: number;
  waterLevelM: number;
  populationDensity: number;
  predictedRisk: RiskLevel;
  landCover: string;
}

export interface ModelMetricsData {
  modelName: string;
  algorithm: string;
  version: string;
  trainingDataset: string;
  totalRecords: number;
  trainingDate: string;
  evaluationDate: string;
  validationMethod: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
  };
  featureImportances: {
    feature: string;
    importance: number;
  }[];
  knownLimitations: string[];
  isSyntheticDataset: boolean;
}

export interface CitySummaryMetrics {
  floodRiskIndex: {
    value: number; // 0-100
    level: RiskLevel;
    trend: number; // change vs last 6h
    statusText: string;
    sparkline: number[];
  };
  rainfallIntensity: {
    currentMmPerHour: number;
    accumulated24hMm: number;
    trend: number;
    statusText: string;
    sparkline: number[];
  };
  trafficCongestion: {
    index: number; // 0-100
    avgSpeedKmh: number;
    trend: number;
    statusText: string;
    sparkline: number[];
  };
  activeAlerts: {
    total: number;
    critical: number;
    trend: number;
    statusText: string;
    sparkline: number[];
  };
  cityStatus: string;
  monsoonWatchLevel: string;
  lastUpdated: string;
  isDemo: boolean;
}

export interface AIInsightItem {
  id: string;
  title: string;
  type: 'rainfall_spike' | 'drainage_bottleneck' | 'traffic_reroute' | 'reservoir_discharge' | 'risk_escalation';
  severity: AlertSeverity;
  zone: string;
  description: string;
  deterministicReason: string;
  suggestedAction: string;
  timestamp: string;
}

// ============================================================================
// TRAFFIC INTELLIGENCE TYPES
// ============================================================================
export type TrafficSituationClass = 'low' | 'normal' | 'high' | 'heavy';

export interface TrafficPredictionInput {
  date: number;
  day_of_week: string;
  hour: number;
  car_count: number;
  bike_count: number;
  bus_count: number;
  truck_count: number;
  total?: number;
}

export interface TrafficPredictionResult {
  predicted_class: TrafficSituationClass;
  class_probabilities: Record<TrafficSituationClass, number>;
  confidence: number;
  model_version: string;
  prediction_type: string;
  data_source: string;
  features_supplied: {
    date: number;
    day_of_week: string;
    hour: number;
    car_count: number;
    bike_count: number;
    bus_count: number;
    truck_count: number;
    total_vehicles: number;
  };
  explanation: string;
  timestamp: string;
  is_demo?: boolean;
}

export interface TrafficClusterSummary {
  cluster_id: number;
  name: string;
  archetype: string;
  color: string;
  count: number;
  percentage: number;
  avg_car_count: number;
  avg_bike_count: number;
  avg_bus_count: number;
  avg_truck_count: number;
  avg_total_vehicles: number;
  dominant_situation: string;
}

export interface TrafficClusterResult {
  cluster_id: number;
  cluster_name: string;
  archetype: string;
  color: string;
  dominant_situation: string;
  typical_total_vehicles: number;
  submitted_features: {
    car_count: number;
    bike_count: number;
    bus_count: number;
    truck_count: number;
    total: number;
  };
  timestamp: string;
}

export interface TrafficModelMetrics {
  model_name: string;
  algorithm: string;
  target_column: string;
  target_classes: string[];
  total_records: number;
  baseline_accuracy: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
    feature_importances: { feature: string; importance: number }[];
  };
  class_distribution: Record<string, number>;
}

// ============================================================================
// RAINFALL INTELLIGENCE TYPES
// ============================================================================
export interface RainfallPredictionInput {
  station: string;
  year: number;
  month: number;
  day: number;
  day_of_week?: number;
  quarter?: number;
  prev_day_rainfall: number;
  prev_7_day_avg: number;
}

export interface RainfallPredictionResult {
  prediction: number;
  unit: string;
  threshold_category: string;
  confidence_interval_68: {
    lower_bound: number;
    upper_bound: number;
    rmse_margin: number;
  };
  model_version: string;
  forecast_horizon: string;
  data_source: string;
  features_supplied: {
    station: string;
    date: string;
    prev_day_rainfall: number;
    prev_7_day_avg: number;
  };
  explanation: string;
  timestamp: string;
  is_demo?: boolean;
}

export interface RainfallClusterSummary {
  cluster_id: number;
  name: string;
  zone: string;
  color: string;
  description: string;
  station_count: number;
  avg_rainfall_mm: number;
  max_rainfall_recorded_mm: number;
  avg_heavy_rain_events: number;
  stations_sample: string[];
}

export interface RainfallClusterResult {
  cluster_id: number;
  zone_name: string;
  zone_category: string;
  color: string;
  description: string;
  typical_avg_rainfall: number;
  station?: string;
  timestamp: string;
}

export interface RainfallModelMetrics {
  model_name: string;
  algorithm: string;
  target: string;
  target_unit: string;
  stations: string[];
  total_records: number;
  metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
    baseline_mae: number;
    baseline_rmse: number;
    feature_importances: { feature: string; importance: number }[];
  };
}

export interface StreamingBrokerStatus {
  type: string;
  connected: boolean;
  bootstrap_servers: string;
  fallback_mode: string;
}

export interface StreamingEngineStatus {
  type: string;
  uptime_seconds: number;
  watermark_delay_minutes: number;
  aggregation_windows: { name: string; type: string; window: string }[];
  checkpoint_directory: string;
}

export interface StreamingIngestionStatus {
  mode: 'demo' | 'live';
  is_running: boolean;
  speed_multiplier: number;
  active_dataset: string;
  total_events_produced: number;
}

export interface StreamingStatusResponse {
  status: string;
  broker: StreamingBrokerStatus;
  streaming_engine: StreamingEngineStatus;
  ingestion: StreamingIngestionStatus;
  topics: string[];
  topic_metadata: Record<string, { description: string; retention_hours: number; schema: string }>;
  models_active: string[];
  timestamp: string;
}

export interface StreamingMetricsResponse {
  engine_status: string;
  spark_version: string;
  uptime_seconds: number;
  total_events_processed: number;
  total_events_errored: number;
  throughput_events_per_sec: number;
  last_event_timestamp?: string;
  last_prediction_timestamp?: string;
  active_windows: Record<string, any>;
  topic_distribution: Record<string, number>;
  loaded_models: string[];
  persisted_events_count: number;
  dead_letter_count: number;
  urban_alerts_count: number;
  database_type: string;
  producer_status: Record<string, any>;
  timestamp: string;
}

export interface StreamingEventItem {
  event_id: string;
  topic: string;
  event_type: string;
  timestamp: string;
  location_id: string;
  quality_score: number;
  is_replay: boolean;
  payload: any;
  created_at: string;
}

export interface DeadLetterItem {
  dead_letter_id: string;
  original_topic: string;
  rejection_reason: string;
  failed_payload: any;
  failed_at: string;
}

// ==============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ==============================================================================
export type UserRole = 'Admin' | 'Analyst' | 'Viewer';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ==============================================================================
// AI ASSISTANT & TOOLS
// ==============================================================================
export interface ToolCallRecord {
  tool_name: string;
  description: string;
  inputs: Record<string, any>;
  result: Record<string, any>;
  executed_at: string;
}

export interface SourceCitation {
  document_id: string;
  title: string;
  category: string;
  source_url?: string;
  page?: number;
  similarity_score: number;
  snippet: string;
}

export interface ChatMessage {
  id?: string;
  message_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  tool_calls?: ToolCallRecord[];
  intent_classified?: string;
  created_at?: string;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// ==============================================================================
// KNOWLEDGE BASE & RAG
// ==============================================================================
export interface KnowledgeDocument {
  id: string;
  filename: string;
  title: string;
  category: string;
  source_url?: string;
  publication_date?: string;
  retrieval_date: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  uploaded_by: string;
  created_at: string;
}

export interface KnowledgeStatus {
  total_documents: number;
  total_chunks: number;
  categories: Record<string, number>;
  vector_store: string;
  embedding_provider: string;
  status: string;
}

export interface KnowledgeSearchChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  document_category: string;
  chunk_index: number;
  text: string;
  similarity_score: number;
}

