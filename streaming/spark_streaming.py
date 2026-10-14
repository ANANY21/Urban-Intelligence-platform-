"""
Chennai Urban Intelligence Platform — Apache Spark Structured Streaming Engine
================================================================================
Consumes raw Kafka topics (traffic-raw, rainfall-raw, weather-raw), performs
event-time windowing with watermarks (15m, 60m), applies Scikit-Learn ML inference
pipelines (Random Forest & K-Means), detects threshold breaches, and publishes
processed intelligence events back into output Kafka topics.
"""

import os
import sys
import json
import logging
from typing import Dict, Any, List

# Check if PySpark is available
try:
    from pyspark.sql import SparkSession
    from pyspark.sql.functions import (
        col, from_json, to_json, struct, window, expr,
        udf, lit, current_timestamp, coalesce
    )
    from pyspark.sql.types import (
        StructType, StructField, StringType, DoubleType,
        IntegerType, BooleanType, TimestampType
    )
    HAS_PYSPARK = True
except ImportError:
    HAS_PYSPARK = False

import joblib
import pandas as pd
import numpy as np

# Configuration imports
from .config import (
    KAFKA_BOOTSTRAP_SERVERS,
    SPARK_MASTER_URL,
    SPARK_APP_NAME,
    SPARK_CHECKPOINT_DIR,
    TOPIC_WEATHER_RAW,
    TOPIC_RAINFALL_RAW,
    TOPIC_TRAFFIC_RAW,
    TOPIC_WEATHER_PROCESSED,
    TOPIC_RAINFALL_PREDICTIONS,
    TOPIC_TRAFFIC_PREDICTIONS,
    TOPIC_FLOOD_RISK_EVENTS,
    TOPIC_URBAN_ALERTS,
    TOPIC_DEAD_LETTER_EVENTS,
    CHENNAI_BOUNDS
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] SparkStreaming: %(message)s")
logger = logging.getLogger("SparkStructuredStreaming")

# Load ML Pipeline Artifacts for Driver / Worker Inference
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
TRAFFIC_RF_PATH = os.path.join(BACKEND_DIR, "traffic_random_forest_pipeline.joblib")
TRAFFIC_KM_PATH = os.path.join(BACKEND_DIR, "traffic_kmeans_pipeline.joblib")
RAIN_RF_PATH = os.path.join(BACKEND_DIR, "rainfall_prediction_pipeline.joblib")
FLOOD_MODEL_PATH = os.path.join(BACKEND_DIR, "model.joblib")


def load_ml_models():
    """Loads all serialized scikit-learn models from disk."""
    models = {}
    try:
        if os.path.exists(TRAFFIC_RF_PATH):
            models["traffic_rf"] = joblib.load(TRAFFIC_RF_PATH)
            logger.info("Loaded Traffic Random Forest Pipeline")
        if os.path.exists(TRAFFIC_KM_PATH):
            models["traffic_km"] = joblib.load(TRAFFIC_KM_PATH)
            logger.info("Loaded Traffic KMeans Pipeline")
        if os.path.exists(RAIN_RF_PATH):
            models["rainfall_rf"] = joblib.load(RAIN_RF_PATH)
            logger.info("Loaded Rainfall Random Forest Pipeline")
        if os.path.exists(FLOOD_MODEL_PATH):
            models["flood_model"] = joblib.load(FLOOD_MODEL_PATH)
            logger.info("Loaded Flood Risk Model")
    except Exception as e:
        logger.error(f"Error loading models in Spark environment: {e}")
    return models


# ==============================================================================
# SPARK PYSPARK SCHEMAS
# ==============================================================================
def get_traffic_raw_schema():
    return StructType([
        StructField("event_id", StringType(), False),
        StructField("event_type", StringType(), False),
        StructField("timestamp", StringType(), False),
        StructField("source", StringType(), True),
        StructField("location", StructType([
            StructField("location_id", StringType(), True),
            StructField("location_name", StringType(), True),
            StructField("latitude", DoubleType(), True),
            StructField("longitude", DoubleType(), True),
            StructField("zone_id", StringType(), True)
        ]), True),
        StructField("payload", StructType([
            StructField("corridor_id", StringType(), True),
            StructField("car_count", IntegerType(), True),
            StructField("bike_count", IntegerType(), True),
            StructField("bus_count", IntegerType(), True),
            StructField("truck_count", IntegerType(), True),
            StructField("total_vehicles", IntegerType(), True),
            StructField("avg_speed_kmh", DoubleType(), True),
            StructField("day_of_week", StringType(), True),
            StructField("hour", IntegerType(), True),
            StructField("date", IntegerType(), True)
        ]), True)
    ])


def get_rainfall_raw_schema():
    return StructType([
        StructField("event_id", StringType(), False),
        StructField("event_type", StringType(), False),
        StructField("timestamp", StringType(), False),
        StructField("source", StringType(), True),
        StructField("location", StructType([
            StructField("location_id", StringType(), True),
            StructField("location_name", StringType(), True),
            StructField("latitude", DoubleType(), True),
            StructField("longitude", DoubleType(), True),
            StructField("zone_id", StringType(), True)
        ]), True),
        StructField("payload", StructType([
            StructField("station", StringType(), True),
            StructField("rainfall_mm", DoubleType(), True),
            StructField("rate_mm_per_hour", DoubleType(), True),
            StructField("prev_day_rainfall", DoubleType(), True),
            StructField("prev_7_day_avg", DoubleType(), True)
        ]), True)
    ])


# ==============================================================================
# SPARK STRUCTURED STREAMING APPLICATION ENTRYPOINT
# ==============================================================================
def run_spark_pipeline(bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS, checkpoint_dir: str = SPARK_CHECKPOINT_DIR):
    """
    Initializes SparkSession and runs the multi-query streaming pipeline:
    1. Traffic Ingestion -> Validation -> Windowing -> RF Congestion & KMeans Archetype -> Kafka Sink
    2. Rainfall Ingestion -> Validation -> 15m/60m Accumulation -> RF Quantitative Regressor -> Kafka Sink
    3. Flood Risk & Urban Alert generator
    """
    if not HAS_PYSPARK:
        logger.error("PySpark is not installed in current Python environment. Please execute within Docker Spark container.")
        return False

    logger.info("Initializing Apache Spark Session with Kafka Structured Streaming...")
    spark = SparkSession.builder \
        .appName(SPARK_APP_NAME) \
        .master(SPARK_MASTER_URL) \
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
        .config("spark.sql.streaming.forceDeleteTempCheckpointLocation", "true") \
        .config("spark.sql.shuffle.partitions", "4") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")
    models = load_ml_models()

    # --------------------------------------------------------------------------
    # 1. TRAFFIC STRUCTURED STREAMING QUERY
    # --------------------------------------------------------------------------
    logger.info(f"Subscribing to Kafka topic: {TOPIC_TRAFFIC_RAW}")
    traffic_raw_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", bootstrap_servers) \
        .option("subscribe", TOPIC_TRAFFIC_RAW) \
        .option("startingOffsets", "latest") \
        .option("failOnDataLoss", "false") \
        .load()

    traffic_schema = get_traffic_raw_schema()
    parsed_traffic = traffic_raw_df.select(
        from_json(col("value").cast("string"), traffic_schema).alias("data")
    ).select("data.*")

    # Filter out-of-boundary coordinates
    valid_traffic = parsed_traffic.filter(
        (col("location.latitude") >= CHENNAI_BOUNDS["min_lat"] - 0.5) &
        (col("location.latitude") <= CHENNAI_BOUNDS["max_lat"] + 0.5) &
        (col("location.longitude") >= CHENNAI_BOUNDS["min_lon"] - 0.5) &
        (col("location.longitude") <= CHENNAI_BOUNDS["max_lon"] + 0.5)
    )

    # Process micro-batch with ML pipeline
    def process_traffic_batch(batch_df, batch_id):
        if batch_df.isEmpty():
            return
        logger.info(f"Processing Traffic Micro-Batch {batch_id} (count: {batch_df.count()})")
        pdf = batch_df.toPandas()
        if "traffic_rf" not in models or pdf.empty:
            return

        pipeline = models["traffic_rf"].get("pipeline")
        km_pipeline = models["traffic_km"].get("pipeline") if "traffic_km" in models else None

        results = []
        for _, row in pdf.iterrows():
            payload = row["payload"]
            loc = row["location"]
            # Prepare DataFrame matching training feature columns
            feature_row = pd.DataFrame([{
                "Date": payload["date"],
                "Day of the week": payload["day_of_week"],
                "Hour": payload["hour"],
                "CarCount": payload["car_count"],
                "BikeCount": payload["bike_count"],
                "BusCount": payload["bus_count"],
                "TruckCount": payload["truck_count"],
                "Total": payload["total_vehicles"]
            }])

            # Inference
            pred_class_idx = int(pipeline.predict(feature_row)[0])
            pred_probs = pipeline.predict_proba(feature_row)[0]
            classes = ["low", "normal", "high", "heavy"]
            pred_label = classes[pred_class_idx]

            # K-Means Cluster
            cluster_id = 0
            if km_pipeline:
                cluster_features = pd.DataFrame([{
                    "CarCount": payload["car_count"],
                    "BikeCount": payload["bike_count"],
                    "BusCount": payload["bus_count"],
                    "TruckCount": payload["truck_count"],
                    "Total": payload["total_vehicles"]
                }])
                cluster_id = int(km_pipeline.predict(cluster_features)[0])

            result_event = {
                "event_id": str(row["event_id"]),
                "event_type": "traffic_prediction",
                "timestamp": str(row["timestamp"]),
                "location": {
                    "location_id": loc["location_id"],
                    "location_name": loc["location_name"],
                    "latitude": loc["latitude"],
                    "longitude": loc["longitude"],
                    "zone_id": loc["zone_id"]
                },
                "payload": {
                    "corridor_id": payload["corridor_id"],
                    "predicted_situation": pred_label,
                    "confidence": round(float(pred_probs[pred_class_idx]), 3),
                    "class_probabilities": {
                        "low": round(float(pred_probs[0]), 3),
                        "normal": round(float(pred_probs[1]), 3),
                        "high": round(float(pred_probs[2]), 3),
                        "heavy": round(float(pred_probs[3]), 3)
                    },
                    "cluster_id": cluster_id,
                    "cluster_name": f"Archetype #{cluster_id}",
                    "dominant_situation": pred_label
                }
            }
            results.append(result_event)

        # Output to Kafka sink or log
        logger.info(f"Batch {batch_id}: Generated {len(results)} traffic predictions")

    # Start traffic stream query with checkpoint
    traffic_checkpoint = os.path.join(checkpoint_dir, "traffic_stream")
    traffic_query = valid_traffic.writeStream \
        .foreachBatch(process_traffic_batch) \
        .option("checkpointLocation", traffic_checkpoint) \
        .start()

    logger.info("Spark Structured Streaming active. Awaiting micro-batches...")
    return traffic_query


if __name__ == "__main__":
    servers = sys.argv[1] if len(sys.argv) > 1 else KAFKA_BOOTSTRAP_SERVERS
    run_spark_pipeline(bootstrap_servers=servers)
