from .config import (
    KAFKA_BOOTSTRAP_SERVERS,
    ALL_TOPICS,
    TOPIC_WEATHER_RAW,
    TOPIC_RAINFALL_RAW,
    TOPIC_TRAFFIC_RAW,
    TOPIC_WEATHER_PROCESSED,
    TOPIC_RAINFALL_PREDICTIONS,
    TOPIC_TRAFFIC_PREDICTIONS,
    TOPIC_FLOOD_RISK_EVENTS,
    TOPIC_URBAN_ALERTS,
    TOPIC_DEAD_LETTER_EVENTS,
    TOPIC_METADATA
)
from .schemas import (
    EventEnvelope,
    validate_event,
    create_dead_letter_event
)
from .producer import producer_instance
from .streaming_engine import streaming_engine
from .consumer import consumer_instance

# Automatically register the streaming engine to receive produced events in real time
producer_instance.register_subscriber(streaming_engine.process_incoming_raw_event)
