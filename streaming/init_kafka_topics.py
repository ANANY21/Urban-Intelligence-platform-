#!/usr/bin/env python3
"""
Kafka Topic Provisioner for Chennai Urban Intelligence Platform.
Provisions the 9 required Kafka topics with 3 partitions and configured retention policies.
"""
import os
import sys
import time
import logging

from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError, NoBrokersAvailable

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from streaming.config import (
    KAFKA_BOOTSTRAP_SERVERS,
    ALL_TOPICS,
    TOPIC_METADATA,
    DEFAULT_PARTITIONS,
    DEFAULT_REPLICATION_FACTOR
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] KafkaInit: %(message)s")
logger = logging.getLogger("KafkaInit")


def provision_topics(bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS, max_retries: int = 10, retry_delay: int = 3):
    """Connects to Kafka broker and ensures all 9 topics are created with target configurations."""
    admin_client = None
    logger.info(f"Connecting to Kafka AdminClient at {bootstrap_servers}...")

    for attempt in range(1, max_retries + 1):
        try:
            admin_client = KafkaAdminClient(
                bootstrap_servers=bootstrap_servers.split(","),
                client_id="ChennaiTopicProvisioner",
                request_timeout_ms=5000
            )
            logger.info("Successfully connected to Kafka broker cluster.")
            break
        except NoBrokersAvailable:
            logger.warning(f"Kafka broker not ready (attempt {attempt}/{max_retries}). Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
        except Exception as e:
            logger.error(f"Unexpected connection error: {e}")
            time.sleep(retry_delay)

    if not admin_client:
        logger.error(f"Failed to connect to Kafka at {bootstrap_servers} after {max_retries} attempts.")
        return False

    existing_topics = set(admin_client.list_topics())
    topics_to_create = []

    for topic_name in ALL_TOPICS:
        if topic_name in existing_topics:
            logger.info(f"Topic '{topic_name}' already exists.")
            continue

        meta = TOPIC_METADATA.get(topic_name, {})
        retention_ms = str(meta.get("retention_hours", 72) * 3600 * 1000)

        topic = NewTopic(
            name=topic_name,
            num_partitions=DEFAULT_PARTITIONS,
            replication_factor=DEFAULT_REPLICATION_FACTOR,
            topic_configs={
                "retention.ms": retention_ms,
                "cleanup.policy": "delete"
            }
        )
        topics_to_create.append(topic)

    if topics_to_create:
        try:
            admin_client.create_topics(new_topics=topics_to_create, validate_only=False)
            logger.info(f"Successfully created {len(topics_to_create)} Kafka topics: {[t.name for t in topics_to_create]}")
        except TopicAlreadyExistsError:
            logger.info("Some topics were created concurrently by another process.")
        except Exception as e:
            logger.error(f"Error creating Kafka topics: {e}")
            return False
    else:
        logger.info("All 9 required Kafka topics are already provisioned and verified.")

    admin_client.close()
    return True


if __name__ == "__main__":
    servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", KAFKA_BOOTSTRAP_SERVERS)
    success = provision_topics(servers)
    sys.exit(0 if success else 1)
