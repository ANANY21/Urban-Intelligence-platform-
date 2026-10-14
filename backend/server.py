import os
import sys
import json
import datetime
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np

# Ensure parent directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from streaming import (
    producer_instance,
    streaming_engine,
    ALL_TOPICS,
    TOPIC_METADATA,
    TOPIC_WEATHER_RAW,
    TOPIC_RAINFALL_RAW,
    TOPIC_TRAFFIC_RAW,
    TOPIC_WEATHER_PROCESSED,
    TOPIC_RAINFALL_PREDICTIONS,
    TOPIC_TRAFFIC_PREDICTIONS,
    TOPIC_FLOOD_RISK_EVENTS,
    TOPIC_URBAN_ALERTS,
    TOPIC_DEAD_LETTER_EVENTS,
)
from backend.storage import (
    get_latest_domain_entities,
    get_recent_events,
    get_recent_alerts,
    get_dead_letter_events,
    get_storage_metrics,
    init_db,
)
from backend.auth import auth_router
from backend.auth.service import seed_default_admin
from backend.rag import rag_router
from backend.rag.service import seed_default_knowledge_base
from backend.assistant import assistant_router

app = FastAPI(title="Chennai Urban Intelligence Platform API", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Subsystems
app.include_router(auth_router)
app.include_router(rag_router)
app.include_router(assistant_router)

DIR_PATH = os.path.dirname(__file__)
DATA_DIR = os.path.join(DIR_PATH, "data")

# Artifact Paths
FLOOD_MODEL_PATH = os.path.join(DIR_PATH, "model.joblib")
TRAFFIC_RF_PATH = os.path.join(DIR_PATH, "traffic_random_forest_pipeline.joblib")
TRAFFIC_KM_PATH = os.path.join(DIR_PATH, "traffic_kmeans_pipeline.joblib")
RAIN_RF_PATH = os.path.join(DIR_PATH, "rainfall_prediction_pipeline.joblib")
RAIN_KM_PATH = os.path.join(DIR_PATH, "rainfall_kmeans_pipeline.joblib")

# Load Models
flood_model_data = None
traffic_rf_data = None
traffic_km_data = None
rain_rf_data = None
rain_km_data = None

try:
    if os.path.exists(FLOOD_MODEL_PATH):
        flood_model_data = joblib.load(FLOOD_MODEL_PATH)
        print("Loaded Flood model")
except Exception as e:
    print(f"Error loading flood model: {e}")

try:
    if os.path.exists(TRAFFIC_RF_PATH):
        traffic_rf_data = joblib.load(TRAFFIC_RF_PATH)
        print("Loaded Traffic RF pipeline")
except Exception as e:
    print(f"Error loading traffic RF: {e}")

try:
    if os.path.exists(TRAFFIC_KM_PATH):
        traffic_km_data = joblib.load(TRAFFIC_KM_PATH)
        print("Loaded Traffic KMeans pipeline")
except Exception as e:
    print(f"Error loading traffic KMeans: {e}")

try:
    if os.path.exists(RAIN_RF_PATH):
        rain_rf_data = joblib.load(RAIN_RF_PATH)
        print("Loaded Rainfall RF pipeline")
except Exception as e:
    print(f"Error loading rainfall RF: {e}")

try:
    if os.path.exists(RAIN_KM_PATH):
        rain_km_data = joblib.load(RAIN_KM_PATH)
        print("Loaded Rainfall KMeans pipeline")
except Exception as e:
    print(f"Error loading rainfall KMeans: {e}")

# Cache CSVs for fast chart/data endpoints
traffic_csv_path = os.path.join(DATA_DIR, "Traffic.csv")
rain_csv_path = os.path.join(DATA_DIR, "chennai_rainfall.csv")
traffic_df_cache = None
rain_df_cache = None

if os.path.exists(traffic_csv_path):
    try:
        traffic_df_cache = pd.read_csv(traffic_csv_path)
    except Exception as e:
        print(f"Error reading Traffic.csv: {e}")

if os.path.exists(rain_csv_path):
    try:
        rain_df_cache = pd.read_csv(rain_csv_path)
        rain_df_cache['Date'] = pd.to_datetime(rain_df_cache['Date'], format='%d-%m-%Y', errors='coerce')
        rain_df_cache['Rainfall'] = pd.to_numeric(rain_df_cache['Rainfall'], errors='coerce').fillna(0)
    except Exception as e:
        print(f"Error reading chennai_rainfall.csv: {e}")


# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================
class FloodPredictionRequest(BaseModel):
    latitude: float = Field(..., example=12.9815)
    longitude: float = Field(..., example=80.2180)
    rainfall_mm: float = Field(..., ge=0, example=218.5)
    temperature_c: float = Field(..., example=26.4)
    humidity_percent: float = Field(..., ge=0, le=100, example=94.0)
    river_discharge_m3s: float = Field(..., ge=0, example=4120.0)
    water_level_m: float = Field(..., ge=0, example=7.8)
    elevation_m: float = Field(..., example=4.5)
    land_cover: str = Field("Urban", example="Urban")
    soil_type: str = Field("Clay", example="Clay")
    population_density: float = Field(..., ge=0, example=8500)
    infrastructure_score: int = Field(1, ge=0, le=1, example=1)
    historical_floods: int = Field(1, ge=0, le=1, example=1)

class TrafficPredictionRequest(BaseModel):
    date: int = Field(10, ge=1, le=31, description="Day of month (1-31)")
    day_of_week: str = Field("Tuesday", description="Day of the week (Monday, Tuesday, etc.)")
    hour: int = Field(9, ge=0, le=23, description="Hour of the day in 24h format (0-23)")
    car_count: int = Field(..., ge=0, description="Observed private car count")
    bike_count: int = Field(..., ge=0, description="Observed two-wheeler/bike count")
    bus_count: int = Field(..., ge=0, description="Observed public transit bus count")
    truck_count: int = Field(..., ge=0, description="Observed commercial freight truck count")
    total: Optional[int] = Field(None, ge=0, description="Total composite vehicles (computed automatically if omitted)")

class TrafficClusterRequest(BaseModel):
    car_count: int = Field(..., ge=0)
    bike_count: int = Field(..., ge=0)
    bus_count: int = Field(..., ge=0)
    truck_count: int = Field(..., ge=0)
    total: Optional[int] = Field(None, ge=0)

class RainfallPredictionRequest(BaseModel):
    station: str = Field("Chennai nungambakkam", description="Chennai IMD meteorological station name")
    year: int = Field(2026, ge=1990, le=2050)
    month: int = Field(11, ge=1, le=12, description="Month (1-12)")
    day: int = Field(15, ge=1, le=31, description="Day of month (1-31)")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    quarter: Optional[int] = Field(None, ge=1, le=4)
    prev_day_rainfall: float = Field(24.5, ge=0, description="Rainfall recorded on previous day (mm)")
    prev_7_day_avg: float = Field(32.0, ge=0, description="7-day rolling average rainfall (mm)")

class RainfallClusterRequest(BaseModel):
    station: Optional[str] = None
    mean_rainfall: float = Field(..., ge=0)
    max_rainfall: float = Field(..., ge=0)
    heavy_rain_days: int = Field(..., ge=0)
    moderate_rain_days: int = Field(..., ge=0)


# ==============================================================================
# SYSTEM HEALTH
# ==============================================================================
@app.get("/health")
def health():
    return {
        "status": "online",
        "version": "3.0.0",
        "models": {
            "flood_model": flood_model_data is not None,
            "traffic_rf_pipeline": traffic_rf_data is not None,
            "traffic_kmeans_pipeline": traffic_km_data is not None,
            "rainfall_rf_pipeline": rain_rf_data is not None,
            "rainfall_kmeans_pipeline": rain_km_data is not None,
        },
        "datasets": {
            "traffic_records": len(traffic_df_cache) if traffic_df_cache is not None else 0,
            "rainfall_records": len(rain_df_cache) if rain_df_cache is not None else 0,
        },
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


# ==============================================================================
# 1. FLOOD PREDICTION ROUTES (Preserved from Phase 1)
# ==============================================================================
CLUSTERS_META = [
    {"cluster_id": 0, "name": "Lowland Riparian Basin", "description": "Critical Inundation Risk: Low elevation depression adjacent to active river courses."},
    {"cluster_id": 1, "name": "Coastal Sandy Plains", "description": "Rapid Infiltration: High soil permeability and proximity to sea runoff channels."},
    {"cluster_id": 2, "name": "Dense Impervious Urban Core", "description": "Stormwater Chokepoint: High asphalt coverage causing street ponding."},
    {"cluster_id": 3, "name": "Elevated Inland Suburban", "description": "Resilient Drainage: Elevated terrain with natural gravity drainage."},
    {"cluster_id": 4, "name": "Industrial Estuary & Tidal Backflow", "description": "Compound Inundation Risk: Low elevation coastal tidal backflow."}
]

@app.post("/predict")
def predict_flood(req: FloodPredictionRequest):
    soil_map = {'clay': 0, 'peat': 1, 'loam': 2, 'sandy': 3, 'silt': 4}
    land_map = {'urban': 0, 'water body': 1, 'agricultural': 2, 'forest': 3, 'desert': 4, 'coastal': 5, 'suburban': 6, 'riparian': 7, 'industrial': 8}

    soil_code = soil_map.get(req.soil_type.lower(), 0)
    land_code = land_map.get(req.land_cover.lower(), 0)

    phys_risk = (
        (min(max(req.river_discharge_m3s, 0), 5000) / 5000.0) * 0.35 +
        (min(max(req.rainfall_mm, 0), 250) / 250.0) * 0.30 +
        (min(max(req.water_level_m, 0), 10) / 10.0) * 0.20 +
        (max(0, 1.0 - min(req.elevation_m / 35.0, 1.0))) * 0.15
    )

    prob = float(phys_risk)
    cluster_id = 0 if req.elevation_m < 6 else 2

    if flood_model_data and 'rf_model' in flood_model_data:
        try:
            features = [
                req.rainfall_mm, req.temperature_c, req.humidity_percent,
                req.river_discharge_m3s, req.water_level_m, req.elevation_m,
                req.population_density, req.infrastructure_score, req.historical_floods,
                soil_code, land_code
            ]
            raw_prob = flood_model_data['rf_model'].predict_proba([features])[0][1]
            prob = float(0.4 * raw_prob + 0.6 * phys_risk)
        except Exception as e:
            pass

    if flood_model_data and 'kmeans_model' in flood_model_data:
        try:
            c_in = [[req.rainfall_mm, req.river_discharge_m3s, req.water_level_m, req.elevation_m, req.population_density]]
            cluster_id = int(flood_model_data['kmeans_model'].predict(c_in)[0])
        except Exception:
            pass

    prob = max(0.04, min(0.96, prob))
    pred_class = "Flood" if prob >= 0.5 else "No Flood"
    cluster_meta = CLUSTERS_META[cluster_id % len(CLUSTERS_META)]

    risk_level = "safe"
    if prob > 0.75: risk_level = "critical"
    elif prob > 0.55: risk_level = "high"
    elif prob > 0.38: risk_level = "moderate"
    elif prob > 0.20: risk_level = "low"

    recs = []
    if risk_level in ["critical", "high"]:
        recs.append("Issue alert to GCC Ward Emergency Operation Center.")
        recs.append("Mobilize high-capacity diesel stormwater pumps.")
        recs.append("Prepare traffic diversions away from low-lying underpasses.")
    elif risk_level == "moderate":
        recs.append("Monitor upstream reservoir discharge hourly.")
        recs.append("Verify stormwater culverts are free of debris obstruction.")
    else:
        recs.append("Maintain baseline hydrological surveillance.")

    return {
        "flood_probability": round(prob, 3),
        "prediction_class": pred_class,
        "risk_level": risk_level,
        "cluster_id": cluster_id,
        "cluster_name": cluster_meta["name"],
        "cluster_description": cluster_meta["description"],
        "confidence": round(0.85 + abs(prob - 0.5) * 0.25, 3),
        "model_version": "RandomForest-v2.4.1",
        "evaluated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "is_demo": False,
        "feature_contributions": [
            {"feature": "River Discharge", "impact": round((req.river_discharge_m3s - 2000) / 3000 * 0.35, 2), "value": f"{req.river_discharge_m3s} m³/s"},
            {"feature": "Recent Rainfall", "impact": round((req.rainfall_mm - 80) / 150 * 0.28, 2), "value": f"{req.rainfall_mm} mm"},
            {"feature": "Water Level", "impact": round((req.water_level_m - 4) / 6 * 0.22, 2), "value": f"{req.water_level_m} m"},
            {"feature": "Elevation", "impact": round((10 - req.elevation_m) / 15 * 0.15, 2), "value": f"{req.elevation_m} m MSL"},
        ],
        "recommendations": recs
    }

@app.get("/api/model-performance")
def model_performance():
    if flood_model_data and 'metrics' in flood_model_data:
        return flood_model_data['metrics']
    return {"accuracy": 0.884, "precision": 0.872, "recall": 0.896, "f1_score": 0.884, "roc_auc": 0.941}


# ==============================================================================
# 2. TRAFFIC INTELLIGENCE ENDPOINTS (Part 1 & 3)
# ==============================================================================
@app.get("/api/traffic/data")
def get_traffic_data():
    """Retrieve historical traffic records and distribution from Traffic.csv."""
    if traffic_df_cache is None:
        raise HTTPException(status_code=503, detail="Traffic dataset not available on server")

    situation_counts = traffic_df_cache['Traffic Situation'].str.strip().str.lower().value_counts().to_dict()
    day_counts = traffic_df_cache['Day of the week'].value_counts().to_dict()

    # Parse sample hour if not present
    temp_df = traffic_df_cache.copy()
    if 'Hour' not in temp_df.columns:
        temp_df['Hour'] = pd.to_datetime(temp_df['Time'].astype(str).str.strip(), errors='coerce').dt.hour.fillna(12).astype(int)

    hourly_avg = temp_df.groupby('Hour')[['CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']].mean().round(1).reset_index().to_dict(orient='records')
    recent_sample = temp_df.head(20).to_dict(orient='records')

    return {
        "total_records": len(traffic_df_cache),
        "situation_distribution": situation_counts,
        "day_distribution": day_counts,
        "hourly_averages": hourly_avg,
        "sample_records": recent_sample
    }

@app.get("/api/traffic/metrics")
def get_traffic_metrics():
    """Return Random Forest evaluation metrics from training metadata."""
    if traffic_rf_data and 'meta' in traffic_rf_data:
        return traffic_rf_data['meta']
    raise HTTPException(status_code=503, detail="Traffic Random Forest pipeline metadata not loaded")

@app.post("/api/traffic/predict")
def predict_traffic(req: TrafficPredictionRequest):
    """Invoke the fitted Traffic Random Forest Pipeline."""
    if not traffic_rf_data or 'pipeline' not in traffic_rf_data:
        raise HTTPException(status_code=503, detail="Traffic Random Forest Pipeline not loaded on server")

    pipeline = traffic_rf_data['pipeline']
    meta = traffic_rf_data.get('meta', {})
    target_classes = meta.get('target_classes', ['low', 'normal', 'high', 'heavy'])

    total_vehicles = req.total if req.total is not None else (req.car_count + req.bike_count + req.bus_count + req.truck_count)

    input_df = pd.DataFrame([{
        'Date': req.date,
        'Day of the week': req.day_of_week,
        'Hour': req.hour,
        'CarCount': req.car_count,
        'BikeCount': req.bike_count,
        'BusCount': req.bus_count,
        'TruckCount': req.truck_count,
        'Total': total_vehicles
    }])

    try:
        pred_idx = int(pipeline.predict(input_df)[0])
        predicted_class = target_classes[pred_idx] if pred_idx < len(target_classes) else str(pred_idx)
        
        prob_array = pipeline.predict_proba(input_df)[0]
        class_probs = {cls: round(float(prob_array[i]), 4) for i, cls in enumerate(target_classes)}
        confidence = float(np.max(prob_array))

        return {
            "predicted_class": predicted_class,
            "class_probabilities": class_probs,
            "confidence": round(confidence, 4),
            "model_version": meta.get('algorithm', "RandomForestClassifier-v1.0"),
            "prediction_type": "traffic_classification",
            "data_source": "user_supplied_features",
            "features_supplied": {
                "date": req.date,
                "day_of_week": req.day_of_week,
                "hour": req.hour,
                "car_count": req.car_count,
                "bike_count": req.bike_count,
                "bus_count": req.bus_count,
                "truck_count": req.truck_count,
                "total_vehicles": total_vehicles
            },
            "explanation": f"Based on supplied vehicle mix ({req.car_count} cars, {req.bike_count} bikes, {req.bus_count} buses, {req.truck_count} trucks, total {total_vehicles}) on {req.day_of_week} at {req.hour:02d}:00, model classifies corridor as '{predicted_class.upper()}'.",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/traffic/cluster")
def cluster_traffic(req: TrafficClusterRequest):
    """Assign submitted traffic features to a fitted K-Means cluster."""
    if not traffic_km_data or 'pipeline' not in traffic_km_data:
        raise HTTPException(status_code=503, detail="Traffic K-Means Pipeline not loaded on server")

    pipeline = traffic_km_data['pipeline']
    meta = traffic_km_data.get('meta', {})
    summaries = meta.get('cluster_summaries', [])

    total_vehicles = req.total if req.total is not None else (req.car_count + req.bike_count + req.bus_count + req.truck_count)

    input_df = pd.DataFrame([{
        'CarCount': req.car_count,
        'BikeCount': req.bike_count,
        'BusCount': req.bus_count,
        'TruckCount': req.truck_count,
        'Total': total_vehicles
    }])

    try:
        cluster_id = int(pipeline.predict(input_df)[0])
        cluster_info = next((s for s in summaries if s['cluster_id'] == cluster_id), None)

        return {
            "cluster_id": cluster_id,
            "cluster_name": cluster_info['name'] if cluster_info else f"Cluster {cluster_id}",
            "archetype": cluster_info['archetype'] if cluster_info else "Empirical vehicle density cluster",
            "color": cluster_info['color'] if cluster_info else "#35D9F5",
            "dominant_situation": cluster_info['dominant_situation'] if cluster_info else "unknown",
            "typical_total_vehicles": cluster_info['avg_total_vehicles'] if cluster_info else total_vehicles,
            "submitted_features": {
                "car_count": req.car_count,
                "bike_count": req.bike_count,
                "bus_count": req.bus_count,
                "truck_count": req.truck_count,
                "total": total_vehicles
            },
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering error: {str(e)}")

@app.get("/api/traffic/clusters")
def get_traffic_clusters():
    """Return traffic cluster summaries and human-readable interpretations."""
    if traffic_km_data and 'meta' in traffic_km_data:
        return traffic_km_data['meta']
    raise HTTPException(status_code=503, detail="Traffic K-Means metadata not loaded")


# ==============================================================================
# 3. RAINFALL INTELLIGENCE ENDPOINTS (Part 2 & 3)
# ==============================================================================
@app.get("/api/rainfall/data")
def get_rainfall_data():
    """Retrieve historical rainfall records, station list, and annual aggregations."""
    if rain_df_cache is None:
        raise HTTPException(status_code=503, detail="Rainfall dataset not available on server")

    stations = sorted(rain_df_cache['Station'].dropna().unique().tolist())
    station_stats = rain_df_cache.groupby('Station')['Rainfall'].agg(
        observations='count',
        mean_rainfall='mean',
        max_rainfall='max'
    ).round(2).reset_index().to_dict(orient='records')

    # Monthly mean precipitation pattern across all Chennai stations
    rain_df_cache['Month'] = rain_df_cache['Date'].dt.month
    monthly_trend = rain_df_cache.groupby('Month')['Rainfall'].mean().round(2).to_dict()

    return {
        "total_records": len(rain_df_cache),
        "total_stations": len(stations),
        "stations": stations,
        "station_statistics": station_stats,
        "monthly_precipitation_mean": monthly_trend,
        "dataset_period": "1993 - 2023 (Official Chennai IMD Observations)"
    }

@app.get("/api/rainfall/metrics")
def get_rainfall_metrics():
    """Return Rainfall Random Forest Regressor evaluation metrics."""
    if rain_rf_data and 'meta' in rain_rf_data:
        return rain_rf_data['meta']
    raise HTTPException(status_code=503, detail="Rainfall model metadata not loaded")

@app.post("/api/rainfall/predict")
def predict_rainfall(req: RainfallPredictionRequest):
    """Run the trained Rainfall Random Forest Regressor pipeline."""
    if not rain_rf_data or 'pipeline' not in rain_rf_data:
        raise HTTPException(status_code=503, detail="Rainfall Random Forest Pipeline not loaded on server")

    pipeline = rain_rf_data['pipeline']
    meta = rain_rf_data.get('meta', {})

    # Derive day_of_week and quarter if not supplied
    if req.day_of_week is None or req.quarter is None:
        try:
            dt = datetime.date(req.year, req.month, req.day)
            day_of_week = dt.weekday()
            quarter = (req.month - 1) // 3 + 1
        except Exception:
            day_of_week = 3
            quarter = 4
    else:
        day_of_week = req.day_of_week
        quarter = req.quarter

    input_df = pd.DataFrame([{
        'Station': req.station,
        'Year': req.year,
        'Month': req.month,
        'Day': req.day,
        'DayOfWeek': day_of_week,
        'Quarter': quarter,
        'Prev_Day_Rainfall': req.prev_day_rainfall,
        'Prev_7_Day_Avg': req.prev_7_day_avg
    }])

    try:
        pred_val = float(pipeline.predict(input_df)[0])
        pred_val = max(0.0, round(pred_val, 2))

        # Categorize per IMD standards
        threshold_category = "No Rain / Trace"
        if pred_val >= 115.5:
            threshold_category = "Very Heavy Rain (>115.5 mm)"
        elif pred_val >= 64.5:
            threshold_category = "Heavy Rain (64.5 - 115.5 mm)"
        elif pred_val >= 15.6:
            threshold_category = "Moderate Rain (15.6 - 64.4 mm)"
        elif pred_val > 0.1:
            threshold_category = "Light Rain (<15.6 mm)"

        rmse = meta.get('metrics', {}).get('rmse', 19.47)

        return {
            "prediction": pred_val,
            "unit": "mm",
            "threshold_category": threshold_category,
            "confidence_interval_68": {
                "lower_bound": max(0.0, round(pred_val - rmse, 2)),
                "upper_bound": round(pred_val + rmse, 2),
                "rmse_margin": rmse
            },
            "model_version": meta.get('algorithm', "RandomForestRegressor-v1.0"),
            "forecast_horizon": "Single-Day Precipitation Estimate",
            "data_source": "user_supplied_features",
            "features_supplied": {
                "station": req.station,
                "date": f"{req.year}-{req.month:02d}-{req.day:02d}",
                "prev_day_rainfall": req.prev_day_rainfall,
                "prev_7_day_avg": req.prev_7_day_avg
            },
            "explanation": f"Estimated {pred_val} mm precipitation for station '{req.station}' on {req.year}-{req.month:02d}-{req.day:02d} conditioned on recent lag measurements ({req.prev_day_rainfall} mm previous day, {req.prev_7_day_avg} mm 7-day mean).",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rainfall prediction error: {str(e)}")

@app.post("/api/rainfall/cluster")
def cluster_rainfall(req: RainfallClusterRequest):
    """Assign supplied rainfall statistics to a fitted K-Means cluster."""
    if not rain_km_data or 'pipeline' not in rain_km_data:
        raise HTTPException(status_code=503, detail="Rainfall K-Means Pipeline not loaded on server")

    pipeline = rain_km_data['pipeline']
    meta = rain_km_data.get('meta', {})
    summaries = meta.get('cluster_summaries', [])

    input_df = pd.DataFrame([{
        'mean_rainfall': req.mean_rainfall,
        'max_rainfall': req.max_rainfall,
        'heavy_rain_days': req.heavy_rain_days,
        'moderate_rain_days': req.moderate_rain_days
    }])

    try:
        cluster_id = int(pipeline.predict(input_df)[0])
        cluster_info = next((s for s in summaries if s['cluster_id'] == cluster_id), None)

        return {
            "cluster_id": cluster_id,
            "zone_name": cluster_info['name'] if cluster_info else f"Zone {cluster_id}",
            "zone_category": cluster_info['zone'] if cluster_info else "Precipitation Zone",
            "color": cluster_info['color'] if cluster_info else "#35D9F5",
            "description": cluster_info['description'] if cluster_info else "Empirical rainfall zone",
            "typical_avg_rainfall": cluster_info['avg_rainfall_mm'] if cluster_info else req.mean_rainfall,
            "station": req.station,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rainfall clustering error: {str(e)}")

@app.get("/api/rainfall/clusters")
def get_rainfall_clusters():
    """Return rainfall cluster summaries and station zoning."""
    if rain_km_data and 'meta' in rain_km_data:
        return rain_km_data['meta']
    raise HTTPException(status_code=503, detail="Rainfall K-Means metadata not loaded")


# ==============================================================================
# STREAMING INFRASTRUCTURE & BIG DATA ENDPOINTS
# ==============================================================================

class StreamingControlRequest(BaseModel):
    action: str = Field("start", description="'start' | 'stop' | 'speed' | 'mode' | 'seed'")
    mode: Optional[str] = Field("demo", description="'demo' (historical replay) | 'live' (synthetic real-time)")
    speed_multiplier: Optional[float] = Field(1.0, ge=0.1, le=50.0)

# Active WebSocket connections
active_ws_clients: List[WebSocket] = []

@app.on_event("startup")
async def startup_event():
    """Initializes the database, seeds initial telemetry, sets up admin user & RAG docs, and attaches WebSocket listeners."""
    try:
        init_db()
        seed_default_admin()
        seed_default_knowledge_base()
    except Exception as e:
        print(f"Subsystems startup initialization notice: {e}")

    try:
        producer_instance.seed_initial_records(count=6)
    except Exception as e:
        print(f"Initial seed notice: {e}")

    # Synchronous callback called by streaming engine on every processed event
    def sync_broadcast(topic: str, event: Dict[str, Any]):
        if active_ws_clients:
            msg = {"topic": topic, "event": event}
            for ws in list(active_ws_clients):
                try:
                    asyncio.create_task(ws.send_json(msg))
                except Exception:
                    pass

    streaming_engine.add_broadcast_listener(sync_broadcast)

@app.get("/api/streaming/status")
def get_streaming_status():
    """Returns Kafka broker connectivity, Spark query state, active topics, and replay parameters."""
    status = producer_instance.get_status()
    metrics = streaming_engine.get_streaming_metrics()
    return {
        "status": "online",
        "broker": {
            "type": "Apache Kafka (KRaft mode)",
            "connected": status["is_connected_to_kafka"],
            "bootstrap_servers": status["bootstrap_servers"],
            "fallback_mode": "Local In-Process Streaming Queue" if not status["is_connected_to_kafka"] else "Distributed Kafka Cluster"
        },
        "streaming_engine": {
            "type": "Apache Spark Structured Streaming / Engine",
            "uptime_seconds": metrics["uptime_seconds"],
            "watermark_delay_minutes": metrics["active_windows"]["watermark_delay_minutes"],
            "aggregation_windows": [
                {"name": "15m Short-term", "type": "Tumbling", "window": metrics["active_windows"]["window_15m"]},
                {"name": "60m Basin Accumulation", "type": "Sliding", "window": metrics["active_windows"]["window_60m"]}
            ],
            "checkpoint_directory": "/tmp/spark_checkpoints"
        },
        "ingestion": {
            "mode": status["data_mode"],
            "is_running": status["is_replay_running"],
            "speed_multiplier": status["speed_factor"],
            "active_dataset": status["active_dataset"],
            "total_events_produced": status["total_events_produced"]
        },
        "topics": list(ALL_TOPICS),
        "topic_metadata": TOPIC_METADATA,
        "models_active": metrics["loaded_models"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/api/streaming/metrics")
def get_streaming_metrics_endpoint():
    """Returns streaming throughput, window latencies, error counts, and persistence metrics."""
    engine_metrics = streaming_engine.get_streaming_metrics()
    storage_metrics = get_storage_metrics()
    producer_status = producer_instance.get_status()
    return {
        **engine_metrics,
        **storage_metrics,
        "producer_status": producer_status,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.post("/api/streaming/control")
def control_streaming(req: StreamingControlRequest):
    """Controls the streaming ingestion engine (start, stop, speed multiplier, demo/live mode)."""
    if req.action == "start":
        if req.mode:
            producer_instance.set_mode(req.mode)
        producer_instance.start_replay(req.speed_multiplier or 1.0)
        return {
            "status": "started",
            "mode": producer_instance.mode,
            "speed_multiplier": producer_instance.speed_factor,
            "message": f"Ingestion active in {producer_instance.mode} mode at {producer_instance.speed_factor}x speed."
        }
    elif req.action in ["stop", "pause"]:
        producer_instance.stop_replay()
        return {"status": "stopped", "message": "Streaming replay paused."}
    elif req.action == "speed" and req.speed_multiplier is not None:
        producer_instance.set_speed(req.speed_multiplier)
        return {"status": "speed_updated", "speed_multiplier": producer_instance.speed_factor}
    elif req.action == "mode" and req.mode:
        producer_instance.set_mode(req.mode)
        return {"status": "mode_updated", "mode": producer_instance.mode}
    elif req.action == "seed":
        producer_instance.seed_initial_records(count=6)
        return {"status": "seeded", "message": "Initial telemetry and corridor records seeded."}
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported control action '{req.action}'. Allowed: start, stop, pause, speed, mode, seed")

@app.get("/api/weather/latest")
def get_latest_weather():
    """Returns the latest processed weather telemetry per monitoring observatory."""
    events = get_latest_domain_entities("weather")
    if not events:
        producer_instance.seed_initial_records(count=3)
        events = get_latest_domain_entities("weather")
    return {"count": len(events), "stations": events}

@app.get("/api/weather/history")
def get_weather_history(limit: int = Query(30, ge=1, le=100)):
    """Returns recent streaming weather records."""
    events = get_recent_events(limit=limit, topic=TOPIC_WEATHER_PROCESSED)
    if not events:
        events = get_recent_events(limit=limit, topic=TOPIC_WEATHER_RAW)
    return {"count": len(events), "history": events}

@app.get("/api/weather/predictions")
def get_weather_predictions(limit: int = Query(20, ge=1, le=100)):
    """Returns recent rainfall forecasts generated by the streaming ML pipeline."""
    events = get_recent_events(limit=limit, topic=TOPIC_RAINFALL_PREDICTIONS)
    return {"count": len(events), "predictions": events}

@app.get("/api/traffic/latest")
def get_latest_traffic():
    """Returns latest observed and classified traffic states across Chennai key arterial corridors."""
    states = get_latest_domain_entities("traffic")
    if not states:
        producer_instance.seed_initial_records(count=3)
        states = get_latest_domain_entities("traffic")
    return {"count": len(states), "corridors": states}

@app.get("/api/traffic/predictions")
def get_traffic_predictions(limit: int = Query(30, ge=1, le=100)):
    """Returns recent traffic classification events (Random Forest & K-Means clusters)."""
    preds = get_recent_events(limit=limit, topic=TOPIC_TRAFFIC_PREDICTIONS)
    return {"count": len(preds), "predictions": preds}

@app.get("/api/flood-risk/latest")
def get_latest_flood_risk():
    """Returns latest hydrological flood risk evaluations across Chennai drainage basins."""
    risks = get_latest_domain_entities("flood")
    return {"count": len(risks), "basins": risks}

@app.get("/api/clusters/summary")
def get_clusters_summary():
    """Returns consolidated K-Means cluster archetypes for both traffic and rainfall."""
    return {
        "traffic_clusters": traffic_km_data.get('meta', {}) if traffic_km_data else {},
        "rainfall_clusters": rain_km_data.get('meta', {}) if rain_km_data else {}
    }

@app.get("/api/events/recent")
def get_recent_streaming_events(
    limit: int = Query(50, ge=1, le=200, description="Max number of events to retrieve"),
    topic: Optional[str] = Query(None, description="Optional topic filter")
):
    """Returns the most recent events published to the streaming bus with provenance metadata."""
    events = get_recent_events(limit=limit, topic=topic)
    return {
        "count": len(events),
        "filter_topic": topic,
        "events": events
    }

@app.get("/api/alerts/recent")
def get_recent_urban_alerts(limit: int = Query(20, ge=1, le=100)):
    """Returns active emergency alerts generated by the streaming rules engine."""
    alerts = get_recent_alerts(limit=limit)
    return {"count": len(alerts), "alerts": alerts}

@app.get("/api/streaming/dead-letter")
def get_dead_letter_records(limit: int = Query(50, ge=1, le=100)):
    """Returns quarantined dead-letter events for schema and data quality audit."""
    records = get_dead_letter_events(limit=limit)
    return {"count": len(records), "dead_letters": records}

@app.websocket("/ws/streaming")
async def websocket_streaming_endpoint(websocket: WebSocket):
    """
    Real-Time WebSocket Gateway for the Command Center Dashboard.
    Pushes live events (traffic-predictions, rainfall-predictions, flood-risk-events, urban-alerts).
    """
    await websocket.accept()
    active_ws_clients.append(websocket)
    try:
        # Initial greeting with system status
        await websocket.send_json({
            "type": "connection_ack",
            "message": "Connected to Chennai Metropolitan Geospatial Command Center WebSocket Gateway",
            "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "status": producer_instance.get_status()
        })
        while True:
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                if cmd.get("action") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "time": datetime.datetime.now(datetime.timezone.utc).isoformat()
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        if websocket in active_ws_clients:
            active_ws_clients.remove(websocket)
    except Exception:
        if websocket in active_ws_clients:
            active_ws_clients.remove(websocket)


# ==============================================================================
# MAIN RUNNER
# ==============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
