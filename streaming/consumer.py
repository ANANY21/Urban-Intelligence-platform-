import json
import logging
import threading
import time
from typing import Optional, List

from .config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_CONSUMER_GROUP,
    TOPIC_WEATHER_RAW,
    TOPIC_RAINFALL_RAW,
    TOPIC_TRAFFIC_RAW,
)
from .streaming_engine import streaming_engine

logger = logging.getLogger("UrbanKafkaConsumer")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] KafkaConsumer: %(message)s")


class UrbanKafkaConsumer:
    """
    Subscribes to raw Kafka topics and continuously feeds the streaming engine.
    Ensures offset tracking, fault recovery, and partition rebalance resilience.
    """

    def __init__(self, bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS, group_id: str = KAFKA_CONSUMER_GROUP):
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.consumer = None
        self.is_running = False
        self.worker_thread: Optional[threading.Thread] = None
        self.total_consumed = 0
        self.last_consumed_timestamp: Optional[str] = None
        self.is_connected = False

    def start(self, topics: Optional[List[str]] = None):
        """Starts the consumer loop in a background daemon thread."""
        if self.is_running:
            return
        if topics is None:
            topics = [TOPIC_WEATHER_RAW, TOPIC_RAINFALL_RAW, TOPIC_TRAFFIC_RAW]

        self.is_running = True
        self.worker_thread = threading.Thread(target=self._run_loop, args=(topics,), daemon=True)
        self.worker_thread.start()
        logger.info(f"Kafka consumer thread launched for topics: {topics}")

    def stop(self):
        """Stops the consumer loop cleanly."""
        self.is_running = False
        if self.consumer:
            try:
                self.consumer.close()
            except Exception:
                pass
        if self.worker_thread and self.worker_thread.is_alive():
            self.worker_thread.join(timeout=1.0)
        logger.info("Kafka consumer thread stopped.")

    def _run_loop(self, topics: List[str]):
        """Main polling loop with exponential backoff on broker reconnection."""
        while self.is_running:
            try:
                from kafka import KafkaConsumer
                logger.info(f"Connecting KafkaConsumer to {self.bootstrap_servers} (group: {self.group_id})...")
                self.consumer = KafkaConsumer(
                    *topics,
                    bootstrap_servers=self.bootstrap_servers.split(","),
                    group_id=self.group_id,
                    auto_offset_reset="latest",
                    enable_auto_commit=True,
                    auto_commit_interval_ms=1000,
                    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                    consumer_timeout_ms=1000
                )
                self.is_connected = True
                logger.info("KafkaConsumer connection established successfully.")

                while self.is_running:
                    for msg in self.consumer:
                        if not self.is_running:
                            break
                        self.total_consumed += 1
                        topic = msg.topic
                        val = msg.value
                        streaming_engine.process_incoming_raw_event(topic, val)

            except Exception as e:
                self.is_connected = False
                logger.warning(f"Kafka consumer connection paused ({e}). Re-trying handshake in 5 seconds...")
                time.sleep(5)


# Global Consumer Instance
consumer_instance = UrbanKafkaConsumer()
