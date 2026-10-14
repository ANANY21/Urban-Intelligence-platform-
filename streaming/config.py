import os
from typing import List

# ==============================================================================
# APACHE KAFKA & STREAMING INFRASTRUCTURE CONFIGURATION
# ==============================================================================

# Kafka Broker Address (comma-separated if clustered)
KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092,localhost:29092")

# Kafka Client IDs and Consumer Groups
KAFKA_CLIENT_ID: str = os.getenv("KAFKA_CLIENT_ID", "chennai-urban-intelligence-engine")
KAFKA_CONSUMER_GROUP: str = os.getenv("KAFKA_CONSUMER_GROUP", "urban-intel-streaming-group")

# Spark Master URL
SPARK_MASTER_URL: str = os.getenv("SPARK_MASTER_URL", "local[*]")
SPARK_APP_NAME: str = "ChennaiUrbanIntelligence-Streaming"
SPARK_CHECKPOINT_DIR: str = os.getenv("SPARK_CHECKPOINT_DIR", os.path.join(os.path.dirname(__file__), "..", "checkpoints"))

# ==============================================================================
# OFFICIAL KAFKA TOPICS SPECIFICATION (9 TOPICS)
# ==============================================================================
TOPIC_WEATHER_RAW = "weather-raw"
TOPIC_RAINFALL_RAW = "rainfall-raw"
TOPIC_TRAFFIC_RAW = "traffic-raw"
TOPIC_WEATHER_PROCESSED = "weather-processed"
TOPIC_RAINFALL_PREDICTIONS = "rainfall-predictions"
TOPIC_TRAFFIC_PREDICTIONS = "traffic-predictions"
TOPIC_FLOOD_RISK_EVENTS = "flood-risk-events"
TOPIC_URBAN_ALERTS = "urban-alerts"
TOPIC_DEAD_LETTER_EVENTS = "dead-letter-events"

ALL_TOPICS: List[str] = [
    TOPIC_WEATHER_RAW,
    TOPIC_RAINFALL_RAW,
    TOPIC_TRAFFIC_RAW,
    TOPIC_WEATHER_PROCESSED,
    TOPIC_RAINFALL_PREDICTIONS,
    TOPIC_TRAFFIC_PREDICTIONS,
    TOPIC_FLOOD_RISK_EVENTS,
    TOPIC_URBAN_ALERTS,
    TOPIC_DEAD_LETTER_EVENTS,
]

# Topic Metadata for Dashboard & Governance Inspection
TOPIC_METADATA = {
    TOPIC_WEATHER_RAW: {
        "description": "Incoming raw meteorological observations from Greater Chennai AWS stations.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 72,
    },
    TOPIC_RAINFALL_RAW: {
        "description": "Raw precipitation telemetry from 62 Chennai micro-catchment observatories.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 72,
    },
    TOPIC_TRAFFIC_RAW: {
        "description": "Multimodal vehicular sensor counts from Chennai arterial road corridors.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 48,
    },
    TOPIC_WEATHER_PROCESSED: {
        "description": "Standardized weather events with 15m/60m rolling aggregates & derived indices.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 72,
    },
    TOPIC_RAINFALL_PREDICTIONS: {
        "description": "Quantitative precipitation estimates from Random Forest regressor with 68% CI.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 72,
    },
    TOPIC_TRAFFIC_PREDICTIONS: {
        "description": "Real-time congestion classification & multimodal K-Means archetype assignments.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 48,
    },
    TOPIC_FLOOD_RISK_EVENTS: {
        "description": "Computed inundation hazards combining storm surge, river discharge, and elevation.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 168,
    },
    TOPIC_URBAN_ALERTS: {
        "description": "Prioritized smart-city alerts for municipal dispatch and public safety advisories.",
        "partitions": 3,
        "replication_factor": 1,
        "retention_hours": 168,
    },
    TOPIC_DEAD_LETTER_EVENTS: {
        "description": "Malformed, unparseable, or out-of-boundary events routed for quarantine review.",
        "partitions": 1,
        "replication_factor": 1,
        "retention_hours": 336,
    },
}

# ==============================================================================
# STREAMING PROCESSING WINDOWS & WATERMARKS
# ==============================================================================
WATERMARK_DELAY_MINUTES: int = 10
WINDOW_RAINFALL_SHORT_MINUTES: int = 15
WINDOW_RAINFALL_LONG_MINUTES: int = 60
SLIDE_INTERVAL_MINUTES: int = 5

# Geofence Bounding Box for Greater Chennai Metropolitan Area (WGS84)
CHENNAI_BOUNDS = {
    "min_lat": 12.75,
    "max_lat": 13.35,
    "min_lon": 80.00,
    "max_lon": 80.40,
}

# Ingestion / Producer Defaults
REPLAY_DEFAULT_SPEED: float = 1.0  # 1.0 = real-time, 5.0 = 5x speed
DEFAULT_DATA_MODE: str = os.getenv("STREAMING_DATA_MODE", "demo")  # 'demo' or 'live'
