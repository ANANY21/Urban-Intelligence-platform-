import unittest
from streaming.schemas import (
    validate_event,
    create_dead_letter_event,
    EventEnvelope
)

class TestStreamingSchemas(unittest.TestCase):

    def test_valid_traffic_event(self):
        valid_event = {
            "event_id": "test-traffic-001",
            "event_type": "traffic_reading",
            "schema_version": "1.0.0",
            "source": "GCTP_Edge_Sensors",
            "timestamp": "2026-10-14T20:00:00Z",
            "location": {
                "location_id": "OMR-IT-Corridor",
                "location_name": "Old Mahabalipuram Rd",
                "latitude": 12.9815,
                "longitude": 80.2450,
                "zone_id": "Zone XIV"
            },
            "data_quality": {
                "is_simulated": False,
                "is_replay": True,
                "quality_score": 0.99,
                "provenance": "Traffic.csv"
            },
            "payload": {
                "corridor_id": "OMR-IT-Corridor",
                "car_count": 85,
                "bike_count": 65,
                "bus_count": 18,
                "truck_count": 6,
                "total_vehicles": 174,
                "avg_speed_kmh": 16.5,
                "day_of_week": "Monday",
                "hour": 9,
                "date": 12
            }
        }
        is_valid, envelope, err = validate_event("traffic-raw", valid_event)
        self.assertTrue(is_valid)
        self.assertIsNone(err)
        self.assertEqual(envelope.payload["car_count"], 85)

    def test_malformed_event_rejection(self):
        # Negative vehicle count & out-of-boundary coordinate
        malformed_event = {
            "event_id": "test-malformed-001",
            "event_type": "traffic_reading",
            "schema_version": "1.0.0",
            "source": "Faulty_Sensor",
            "timestamp": "2026-10-14T20:00:00Z",
            "location": {
                "location_id": "Invalid-Loc",
                "location_name": "Unknown",
                "latitude": 45.0,  # Invalid for Chennai
                "longitude": 80.2450,
                "zone_id": "Zone XIV"
            },
            "payload": {
                "corridor_id": "OMR",
                "car_count": -10,  # Invalid negative count
                "bike_count": 10,
                "bus_count": 2,
                "truck_count": 1,
                "total_vehicles": 3,
                "avg_speed_kmh": 20.0,
                "day_of_week": "Monday",
                "hour": 9,
                "date": 12
            }
        }
        is_valid, envelope, err = validate_event("traffic-raw", malformed_event)
        self.assertFalse(is_valid)
        self.assertIsNotNone(err)

        dl_event = create_dead_letter_event("traffic-raw", malformed_event, err)
        self.assertEqual(dl_event["event_type"], "dead_letter_quarantine")
        self.assertEqual(dl_event["payload"]["original_topic"], "traffic-raw")

if __name__ == "__main__":
    unittest.main()
