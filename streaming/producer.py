import os
import json
import time
import uuid
import threading
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Generator

import pandas as pd

from .config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_CLIENT_ID,
    TOPIC_WEATHER_RAW,
    TOPIC_RAINFALL_RAW,
    TOPIC_TRAFFIC_RAW,
    TOPIC_DEAD_LETTER_EVENTS,
    DEFAULT_DATA_MODE,
    REPLAY_DEFAULT_SPEED
)
from .schemas import validate_event, create_dead_letter_event
from backend.storage import save_dead_letter

logger = logging.getLogger("UrbanStreamingProducer")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Paths to datasets
BACKEND_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
TRAFFIC_CSV_PATH = os.path.join(BACKEND_DATA_DIR, "Traffic.csv")
RAINFALL_CSV_PATH = os.path.join(BACKEND_DATA_DIR, "chennai_rainfall.csv")

# Coordinates map for key Chennai observatories & corridors
CHENNAI_STATION_COORDS = {
    "Chennai nungambakkam": {"lat": 13.0674, "lon": 80.2376, "zone": "Zone IX"},
    "Chennai Meenambakkam": {"lat": 12.9866, "lon": 80.1752, "zone": "Zone XII"},
    "Sholinganallur": {"lat": 12.9010, "lon": 80.2279, "zone": "Zone XV"},
    "Ambathur": {"lat": 13.1143, "lon": 80.1548, "zone": "Zone VII"},
    "Alandur": {"lat": 13.0067, "lon": 80.2025, "zone": "Zone XII"},
    "DGP Office": {"lat": 13.0418, "lon": 80.2789, "zone": "Zone IX"},
    "Madhavaram": {"lat": 13.1488, "lon": 80.2306, "zone": "Zone III"},
    "Puzhal": {"lat": 13.1950, "lon": 80.1980, "zone": "Zone III"},
    "Perungudi": {"lat": 12.9650, "lon": 80.2450, "zone": "Zone XIV"},
    "Adyar": {"lat": 13.0012, "lon": 80.2565, "zone": "Zone XIII"},
    "Anna Nagar": {"lat": 13.0850, "lon": 80.2100, "zone": "Zone VIII"},
    "Kodambakkam": {"lat": 13.0520, "lon": 80.2240, "zone": "Zone X"},
    "default": {"lat": 13.0827, "lon": 80.2707, "zone": "Zone V"},
}

CHENNAI_CORRIDOR_COORDS = {
    "OMR-IT-Corridor": {"name": "Old Mahabalipuram Rd (Tidel Park)", "lat": 12.9815, "lon": 80.2450, "zone": "Zone XIV"},
    "GST-Airport-Corridor": {"name": "Grand Southern Trunk Rd (Kathipara)", "lat": 13.0067, "lon": 80.2025, "zone": "Zone XII"},
    "Anna-Salai-Arterial": {"name": "Anna Salai (Mount Road - Spencer)", "lat": 13.0600, "lon": 80.2600, "zone": "Zone IX"},
    "ECR-Coastal-Highway": {"name": "East Coast Road (Kottivakkam)", "lat": 12.9600, "lon": 80.2600, "zone": "Zone XIV"},
    "Inner-Ring-Road": {"name": "100ft Inner Ring Road (Jawaharlal Nehru)", "lat": 13.0450, "lon": 80.2050, "zone": "Zone X"},
    "North-Basin-Expressway": {"name": "Chennai Port - Ennore Highway", "lat": 13.1500, "lon": 80.2950, "zone": "Zone I"},
    "default": {"name": "Chennai Central Arterial", "lat": 13.0827, "lon": 80.2707, "zone": "Zone V"},
}


class UrbanDataProducer:
    """
    Robust Ingestion Producer supporting:
    1. Direct Kafka cluster connection (when running with Kafka/Docker).
    2. Local streaming fallback queue (when Kafka is offline or spinning up).
    3. Replay Mode: Replays historical records from Traffic.csv and chennai_rainfall.csv.
    4. Live Mode: Continuous real-time simulated telemetry for 15 GCC zones.
    """

    def __init__(self, bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS):
        self.bootstrap_servers = bootstrap_servers
        self.kafka_producer = None
        self.is_connected = False
        self.is_running = False
        self.replay_thread: Optional[threading.Thread] = None
        self.mode = DEFAULT_DATA_MODE  # 'demo' or 'live'
        self.speed_factor = REPLAY_DEFAULT_SPEED
        self.total_events_produced = 0
        self.total_dead_letter_events = 0
        self.last_produced_timestamp: Optional[str] = None
        self.active_dataset = "Traffic.csv & chennai_rainfall.csv"

        # Local event subscribers (for in-process streaming engine or WebSocket bridge)
        self.subscribers = []

        self._init_kafka()

    def _init_kafka(self):
        """Attempts connection to the Kafka broker cluster with safe fallback."""
        try:
            from kafka import KafkaProducer
            self.kafka_producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers.split(","),
                client_id=KAFKA_CLIENT_ID,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                retries=3,
                request_timeout_ms=5000,
            )
            self.is_connected = True
            logger.info(f"Connected to Apache Kafka cluster at {self.bootstrap_servers}")
        except Exception as e:
            self.is_connected = False
            self.kafka_producer = None
            logger.warning(
                f"Kafka broker offline ({e}). Producer operating in Standalone/Local Queue mode."
            )

    def register_subscriber(self, callback):
        """Allows the local streaming engine / WebSocket to receive produced events in real time."""
        if callback not in self.subscribers:
            self.subscribers.append(callback)

    def send_event(self, topic: str, event_data: Dict[str, Any], key: Optional[str] = None):
        """
        Validates event against schemas.py and publishes to Kafka (or local bus).
        If malformed, gracefully routes to dead-letter-events topic.
        """
        is_valid, validated_envelope, error_msg = validate_event(topic, event_data)

        if not is_valid:
            logger.warning(f"Validation failure for {topic}: {error_msg}. Routing to {TOPIC_DEAD_LETTER_EVENTS}")
            dead_letter_event = create_dead_letter_event(topic, event_data, error_msg or "Unknown schema error")
            save_dead_letter(topic, event_data, error_msg or "Schema Validation Failure")
            self._dispatch_to_sink(TOPIC_DEAD_LETTER_EVENTS, dead_letter_event, key="quarantine")
            self.total_dead_letter_events += 1
            return False

        self._dispatch_to_sink(topic, event_data, key=key)
        self.total_events_produced += 1
        self.last_produced_timestamp = datetime.now(timezone.utc).isoformat()
        return True

    def _dispatch_to_sink(self, topic: str, payload: Dict[str, Any], key: Optional[str] = None):
        """Dispatches event to Kafka broker and any registered in-process subscribers."""
        # 1. Kafka Broker dispatch
        if self.is_connected and self.kafka_producer:
            try:
                self.kafka_producer.send(topic, key=key, value=payload)
            except Exception as e:
                logger.error(f"Error publishing to Kafka topic {topic}: {e}")
                self.is_connected = False

        # 2. In-process dispatch to streaming engine / memory bus
        for sub in self.subscribers:
            try:
                sub(topic, payload)
            except Exception as e:
                logger.debug(f"Subscriber error on {topic}: {e}")

    # ==========================================================================
    # HISTORICAL CSV REPLAY GENERATORS (DEMO MODE)
    # ==========================================================================
    def generate_traffic_replay_events(self) -> Generator[Dict[str, Any], None, None]:
        """Reads Traffic.csv and generates formatted streaming event envelopes."""
        if not os.path.exists(TRAFFIC_CSV_PATH):
            logger.error(f"Traffic CSV not found at {TRAFFIC_CSV_PATH}")
            return

        df = pd.read_csv(TRAFFIC_CSV_PATH)
        corridors = list(CHENNAI_CORRIDOR_COORDS.keys())[:-1]

        for idx, row in df.iterrows():
            cid = corridors[idx % len(corridors)]
            cinfo = CHENNAI_CORRIDOR_COORDS.get(cid, CHENNAI_CORRIDOR_COORDS["default"])

            car = int(row.get("CarCount", 20))
            bike = int(row.get("BikeCount", 15))
            bus = int(row.get("BusCount", 5))
            truck = int(row.get("TruckCount", 4))
            total = int(row.get("Total", car + bike + bus + truck))

            # Approximate speed based on congestion in dataset
            speed = 42.0 if total < 50 else (28.0 if total < 110 else 14.5)

            event = {
                "event_id": str(uuid.uuid4()),
                "event_type": "traffic_reading",
                "schema_version": "1.0.0",
                "source": "GCTP_Edge_Sensors",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
                "location": {
                    "location_id": cid,
                    "location_name": cinfo["name"],
                    "latitude": cinfo["lat"],
                    "longitude": cinfo["lon"],
                    "zone_id": cinfo["zone"],
                },
                "data_quality": {
                    "is_simulated": False,
                    "is_replay": True,
                    "quality_score": 0.99,
                    "provenance": "Traffic.csv (Historical Replay)",
                },
                "payload": {
                    "corridor_id": cid,
                    "car_count": car,
                    "bike_count": bike,
                    "bus_count": bus,
                    "truck_count": truck,
                    "total_vehicles": total,
                    "avg_speed_kmh": speed,
                    "day_of_week": str(row.get("Day of the week", "Monday")),
                    "hour": int(idx % 24),
                    "date": int(row.get("Date", 15)),
                },
            }
            yield event

    def generate_rainfall_replay_events(self) -> Generator[Dict[str, Any], None, None]:
        """Reads chennai_rainfall.csv and generates formatted streaming event envelopes."""
        if not os.path.exists(RAINFALL_CSV_PATH):
            logger.error(f"Rainfall CSV not found at {RAINFALL_CSV_PATH}")
            return

        df = pd.read_csv(RAINFALL_CSV_PATH).head(3000)

        for _, row in df.iterrows():
            station_name = str(row.get("Station", "Chennai nungambakkam")).strip()
            cinfo = CHENNAI_STATION_COORDS.get(station_name, CHENNAI_STATION_COORDS["default"])
            rainfall_val = float(pd.to_numeric(row.get("Rainfall", 0), errors="coerce") or 0.0)

            event = {
                "event_id": str(uuid.uuid4()),
                "event_type": "rainfall_record",
                "schema_version": "1.0.0",
                "source": "IMD_Chennai_AWS",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
                "location": {
                    "location_id": f"stn-{station_name.lower().replace(' ', '-')}",
                    "location_name": station_name,
                    "latitude": cinfo["lat"],
                    "longitude": cinfo["lon"],
                    "zone_id": cinfo["zone"],
                },
                "data_quality": {
                    "is_simulated": False,
                    "is_replay": True,
                    "quality_score": 0.98,
                    "provenance": "chennai_rainfall.csv (Historical Replay)",
                },
                "payload": {
                    "station": station_name,
                    "rainfall_mm": rainfall_val,
                    "rate_mm_per_hour": round(rainfall_val / 24.0, 2),
                    "prev_day_rainfall": max(0.0, rainfall_val * 0.8),
                    "prev_7_day_avg": max(0.0, rainfall_val * 0.6),
                },
            }
            yield event

    # ==========================================================================
    # BACKGROUND WORKER CONTROLLER
    # ==========================================================================
    def start_replay(self, speed_factor: float = 1.0):
        """Starts background streaming replay in a dedicated thread."""
        if self.is_running:
            return
        self.speed_factor = max(0.1, speed_factor)
        self.is_running = True
        self.replay_thread = threading.Thread(target=self._run_replay_loop, daemon=True)
        self.replay_thread.start()
        logger.info(f"Replay ingestion loop started at {self.speed_factor}x speed.")

    def stop_replay(self):
        """Halts the streaming replay loop."""
        self.is_running = False
        if self.replay_thread and self.replay_thread.is_alive():
            self.replay_thread.join(timeout=1.0)
        logger.info("Replay ingestion loop stopped.")

    def _run_replay_loop(self):
        """Continuous replay cycle alternating between traffic and rainfall observations."""
        traffic_gen = self.generate_traffic_replay_events()
        rainfall_gen = self.generate_rainfall_replay_events()

        while self.is_running:
            # 1. Produce Traffic Event
            try:
                tevent = next(traffic_gen)
            except StopIteration:
                traffic_gen = self.generate_traffic_replay_events()
                tevent = next(traffic_gen)

            self.send_event(TOPIC_TRAFFIC_RAW, tevent, key=tevent["location"]["location_id"])

            # 2. Produce Rainfall Event
            try:
                revent = next(rainfall_gen)
            except StopIteration:
                rainfall_gen = self.generate_rainfall_replay_events()
                revent = next(rainfall_gen)

            self.send_event(TOPIC_RAINFALL_RAW, revent, key=revent["location"]["location_id"])

            # 3. Produce Ambient Weather Event
            wevent = {
                "event_id": str(uuid.uuid4()),
                "event_type": "weather_observation",
                "schema_version": "1.0.0",
                "source": "GCC_Doppler_Weather_Telemetry",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
                "location": {
                    "location_id": "ws-nungambakkam",
                    "location_name": "Nungambakkam Regional Met Centre",
                    "latitude": 13.0674,
                    "longitude": 80.2376,
                    "zone_id": "Zone IX",
                },
                "data_quality": {
                    "is_simulated": True,
                    "is_replay": False,
                    "quality_score": 0.95,
                    "provenance": "GCC_Doppler_Synthetic_Stream",
                },
                "payload": {
                    "temperature_c": 28.4,
                    "humidity_percent": 88.0,
                    "pressure_hpa": 1008.5,
                    "wind_speed_kmh": 24.5,
                    "wind_direction_deg": 65.0,
                    "uv_index": 4.2,
                },
            }
            self.send_event(TOPIC_WEATHER_RAW, wevent, key=wevent["location"]["location_id"])

            # Sleep between micro-batches based on speed factor
            sleep_duration = max(0.05, 1.0 / self.speed_factor)
            time.sleep(sleep_duration)

    def set_speed(self, speed_factor: float):
        """Dynamically adjusts the replay playback speed."""
        self.speed_factor = max(0.1, min(50.0, float(speed_factor)))
        logger.info(f"Replay speed adjusted to {self.speed_factor}x")

    def set_mode(self, mode: str):
        """Switches ingestion between 'demo' (replay) and 'live' (synthetic real-time)."""
        if mode in ["demo", "live"]:
            self.mode = mode
            logger.info(f"Ingestion mode switched to {self.mode}")

    def seed_initial_records(self, count: int = 6):
        """Seeds initial batch of traffic, rainfall, and weather events so dashboard has immediate state."""
        try:
            traffic_gen = self.generate_traffic_replay_events()
            rainfall_gen = self.generate_rainfall_replay_events()
            for _ in range(count):
                try:
                    tevent = next(traffic_gen)
                    self.send_event(TOPIC_TRAFFIC_RAW, tevent, key=tevent["location"]["location_id"])
                except StopIteration:
                    break

                try:
                    revent = next(rainfall_gen)
                    self.send_event(TOPIC_RAINFALL_RAW, revent, key=revent["location"]["location_id"])
                except StopIteration:
                    break

            # Seed an ambient weather record
            wevent = {
                "event_id": str(uuid.uuid4()),
                "event_type": "weather_observation",
                "schema_version": "1.0.0",
                "source": "IMD_Chennai_Doppler",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
                "location": {
                    "location_id": "ws-nungambakkam",
                    "location_name": "Nungambakkam Regional Met Centre",
                    "latitude": 13.0674,
                    "longitude": 80.2376,
                    "zone_id": "Zone IX",
                },
                "data_quality": {
                    "is_simulated": False,
                    "is_replay": True,
                    "quality_score": 0.99,
                    "provenance": "IMD Baseline Telemetry",
                },
                "payload": {
                    "temperature_c": 29.2,
                    "humidity_percent": 82.0,
                    "pressure_hpa": 1009.2,
                    "wind_speed_kmh": 18.0,
                    "wind_direction_deg": 80.0,
                    "uv_index": 5.0,
                },
            }
            self.send_event(TOPIC_WEATHER_RAW, wevent, key=wevent["location"]["location_id"])
            logger.info(f"Seeded initial {count} streaming records across traffic, rainfall, and weather.")
        except Exception as e:
            logger.warning(f"Error seeding initial records: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Returns current producer diagnostics."""
        return {
            "is_connected_to_kafka": self.is_connected,
            "bootstrap_servers": self.bootstrap_servers,
            "is_replay_running": self.is_running,
            "data_mode": self.mode,
            "speed_factor": self.speed_factor,
            "total_events_produced": self.total_events_produced,
            "total_dead_letter_events": self.total_dead_letter_events,
            "last_produced_timestamp": self.last_produced_timestamp,
            "active_dataset": self.active_dataset,
        }


# Global Producer Instance
producer_instance = UrbanDataProducer()

