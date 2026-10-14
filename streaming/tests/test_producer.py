import unittest
from streaming.producer import producer_instance

class TestProducer(unittest.TestCase):

    def test_traffic_replay_generation(self):
        gen = producer_instance.generate_traffic_replay_events()
        event = next(gen)
        self.assertEqual(event["event_type"], "traffic_reading")
        self.assertTrue(event["data_quality"]["is_replay"])
        self.assertIn("car_count", event["payload"])
        self.assertIn("total_vehicles", event["payload"])

    def test_rainfall_replay_generation(self):
        gen = producer_instance.generate_rainfall_replay_events()
        event = next(gen)
        self.assertEqual(event["event_type"], "rainfall_record")
        self.assertTrue(event["data_quality"]["is_replay"])
        self.assertIn("rainfall_mm", event["payload"])

if __name__ == "__main__":
    unittest.main()
