import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field, field_validator, ConfigDict
from .config import CHENNAI_BOUNDS

# ==============================================================================
# BASE EVENT ENVELOPE & LOCATION METADATA
# ==============================================================================

class LocationMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    location_id: str = Field(..., description="Unique station or corridor identifier")
    location_name: str = Field(..., description="Human-readable name")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    zone_id: Optional[str] = Field(None, description="GCC Administrative Zone (I-XV)")

    @field_validator("latitude")
    @classmethod
    def check_latitude(cls, v: float) -> float:
        # Validates that latitude falls reasonably within Tamil Nadu / Chennai area
        if not (CHENNAI_BOUNDS["min_lat"] - 0.5 <= v <= CHENNAI_BOUNDS["max_lat"] + 0.5):
            raise ValueError(f"Latitude {v} is outside Chennai operational boundary")
        return v

    @field_validator("longitude")
    @classmethod
    def check_longitude(cls, v: float) -> float:
        if not (CHENNAI_BOUNDS["min_lon"] - 0.5 <= v <= CHENNAI_BOUNDS["max_lon"] + 0.5):
            raise ValueError(f"Longitude {v} is outside Chennai operational boundary")
        return v


class DataQualityMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    is_simulated: bool = Field(False, description="True if synthetically generated")
    is_replay: bool = Field(False, description="True if replayed from historical dataset")
    quality_score: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score of the telemetry sensor")
    provenance: str = Field("telemetry_stream", description="Source file or API feed")


class EventEnvelope(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = Field(..., description="Topic event categorization")
    schema_version: str = Field("1.0.0")
    source: str = Field("GCC_Urban_Sensors")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ingestion_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    location: LocationMetadata
    data_quality: DataQualityMetadata = Field(default_factory=DataQualityMetadata)
    payload: Dict[str, Any]


# ==============================================================================
# SPECIFIC TOPIC PAYLOAD SCHEMAS
# ==============================================================================

class WeatherRawPayload(BaseModel):
    temperature_c: float = Field(..., ge=-5.0, le=60.0)
    humidity_percent: float = Field(..., ge=0.0, le=100.0)
    pressure_hpa: float = Field(..., ge=800.0, le=1100.0)
    wind_speed_kmh: float = Field(..., ge=0.0, le=300.0)
    wind_direction_deg: float = Field(..., ge=0.0, le=360.0)
    uv_index: float = Field(0.0, ge=0.0, le=20.0)


class RainfallRawPayload(BaseModel):
    station: str
    rainfall_mm: float = Field(..., ge=0.0, le=1000.0)
    rate_mm_per_hour: float = Field(..., ge=0.0, le=300.0)
    prev_day_rainfall: float = Field(0.0, ge=0.0, le=1000.0)
    prev_7_day_avg: float = Field(0.0, ge=0.0, le=500.0)


class TrafficRawPayload(BaseModel):
    corridor_id: str
    car_count: int = Field(..., ge=0, le=2000)
    bike_count: int = Field(..., ge=0, le=2000)
    bus_count: int = Field(..., ge=0, le=500)
    truck_count: int = Field(..., ge=0, le=500)
    total_vehicles: int = Field(..., ge=0)
    avg_speed_kmh: float = Field(..., ge=0.0, le=200.0)
    day_of_week: str = Field(..., description="Day name, e.g., Monday")
    hour: int = Field(..., ge=0, le=23)
    date: int = Field(..., ge=1, le=31)


class WeatherProcessedPayload(BaseModel):
    temperature_c: float
    humidity_percent: float
    heat_index_c: float
    dew_point_c: float
    rolling_15m_rainfall_mm: float
    rolling_60m_rainfall_mm: float
    storm_surge_risk: str


class RainfallPredictionPayload(BaseModel):
    station: str
    predicted_rainfall_mm: float
    threshold_category: str
    rmse_margin_mm: float
    confidence_interval_68: Dict[str, float]
    model_version: str


class TrafficPredictionPayload(BaseModel):
    corridor_id: str
    predicted_situation: str
    confidence: float
    class_probabilities: Dict[str, float]
    cluster_id: int
    cluster_name: str
    dominant_situation: str


class FloodRiskEventPayload(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str = Field(..., description="low, moderate, high, critical")
    primary_causes: List[str]
    affected_zones: List[str]
    water_level_m: float
    elevation_m: float
    actionable_advisory: str


class UrbanAlertPayload(BaseModel):
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    severity: str = Field(..., description="info, warning, critical")
    domain: str = Field(..., description="weather, traffic, flood")
    zone: str
    message: str
    recommended_action: str
    broadcast_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DeadLetterEventPayload(BaseModel):
    dead_letter_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_topic: str
    rejection_reason: str
    failed_payload: Dict[str, Any]
    failed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ==============================================================================
# SCHEMA VALIDATOR HELPER
# ==============================================================================
def validate_event(topic: str, data: Dict[str, Any]) -> tuple[bool, Optional[EventEnvelope], Optional[str]]:
    """
    Validates an incoming event dictionary against the envelope and payload schema.
    Returns (is_valid, validated_envelope, error_message).
    """
    try:
        envelope = EventEnvelope(**data)
        payload = envelope.payload

        if topic == "weather-raw":
            WeatherRawPayload(**payload)
        elif topic == "rainfall-raw":
            RainfallRawPayload(**payload)
        elif topic == "traffic-raw":
            TrafficRawPayload(**payload)
        elif topic == "weather-processed":
            WeatherProcessedPayload(**payload)
        elif topic == "rainfall-predictions":
            RainfallPredictionPayload(**payload)
        elif topic == "traffic-predictions":
            TrafficPredictionPayload(**payload)
        elif topic == "flood-risk-events":
            FloodRiskEventPayload(**payload)
        elif topic == "urban-alerts":
            UrbanAlertPayload(**payload)
        elif topic == "dead-letter-events":
            DeadLetterEventPayload(**payload)

        return True, envelope, None
    except Exception as e:
        return False, None, str(e)


def create_dead_letter_event(topic: str, raw_data: Dict[str, Any], reason: str) -> Dict[str, Any]:
    """Generates a standardized quarantine event for the dead-letter-events topic."""
    return {
        "event_id": str(uuid.uuid4()),
        "event_type": "dead_letter_quarantine",
        "schema_version": "1.0.0",
        "source": "streaming_schema_validator",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
        "location": {
            "location_id": "quarantine-hub",
            "location_name": "Dead Letter Quarantine",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "zone_id": "System"
        },
        "data_quality": {
            "is_simulated": False,
            "is_replay": False,
            "quality_score": 0.0,
            "provenance": f"rejected_from_{topic}"
        },
        "payload": {
            "original_topic": topic,
            "rejection_reason": reason,
            "failed_payload": raw_data,
            "failed_at": datetime.now(timezone.utc).isoformat()
        }
    }
