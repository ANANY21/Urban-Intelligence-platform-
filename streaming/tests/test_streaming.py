import unittest
from streaming.streaming_engine import streaming_engine
from streaming.producer import producer_instance
from backend.storage import get_recent_events, get_latest_domain_entities

class TestStreamingEngine(unittest.TestCase):

    def test_process_traffic_event_and_ml_prediction(self):
        gen = producer_instance.generate_traffic_replay_events()
        event = next(gen)
        success = streaming_engine.process_incoming_raw_event("traffic-raw", event)
        self.assertTrue(success)

        # Verify latest traffic state updated
        traffic_states = get_latest_domain_entities("traffic")
        self.assertTrue(len(traffic_states) > 0)

    def test_process_rainfall_event_and_ml_prediction(self):
        gen = producer_instance.generate_rainfall_replay_events()
        event = next(gen)
        success = streaming_engine.process_incoming_raw_event("rainfall-raw", event)
        self.assertTrue(success)

        # Verify metrics updated
        metrics = streaming_engine.get_streaming_metrics()
        self.assertGreaterEqual(metrics["total_events_processed"], 1)

if __name__ == "__main__":
    unittest.main()
