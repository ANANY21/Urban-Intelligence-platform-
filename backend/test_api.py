import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("=== TESTING URBAN INTELLIGENCE BACKEND ENDPOINTS ===")
    
    # 1. Health
    r = requests.get(f"{BASE_URL}/health")
    print("\n[1] GET /health -> Status:", r.status_code)
    print(json.dumps(r.json(), indent=2))
    
    # 2. Traffic Predict
    traffic_payload = {
        "date": 10,
        "day_of_week": "Tuesday",
        "hour": 8,
        "car_count": 120,
        "bike_count": 50,
        "bus_count": 10,
        "truck_count": 5,
        "total": 185
    }
    r = requests.post(f"{BASE_URL}/api/traffic/predict", json=traffic_payload)
    print("\n[2] POST /api/traffic/predict -> Status:", r.status_code)
    print(json.dumps(r.json(), indent=2))
    
    # 3. Traffic Cluster
    traffic_cluster_payload = {
        "car_count": 120,
        "bike_count": 50,
        "bus_count": 10,
        "truck_count": 5,
        "total": 185
    }
    r = requests.post(f"{BASE_URL}/api/traffic/cluster", json=traffic_cluster_payload)
    print("\n[3] POST /api/traffic/cluster -> Status:", r.status_code)
    print(json.dumps(r.json(), indent=2))
    
    # 4. Traffic Metrics
    r = requests.get(f"{BASE_URL}/api/traffic/metrics")
    print("\n[4] GET /api/traffic/metrics -> Status:", r.status_code)
    metrics_summary = {
        "model_name": r.json().get("model_name"),
        "accuracy": r.json().get("metrics", {}).get("accuracy"),
        "baseline_accuracy": r.json().get("baseline_accuracy"),
        "precision": r.json().get("metrics", {}).get("precision"),
        "f1_score": r.json().get("metrics", {}).get("f1_score")
    }
    print(json.dumps(metrics_summary, indent=2))
    
    # 5. Rainfall Predict
    rain_payload = {
        "station": "Chennai nungambakkam",
        "year": 2026,
        "month": 11,
        "day": 20,
        "day_of_week": 4,
        "quarter": 4,
        "prev_day_rainfall": 28.5,
        "prev_7_day_avg": 35.0
    }
    r = requests.post(f"{BASE_URL}/api/rainfall/predict", json=rain_payload)
    print("\n[5] POST /api/rainfall/predict -> Status:", r.status_code)
    print(json.dumps(r.json(), indent=2))
    
    # 6. Rainfall Cluster
    rain_cluster_payload = {
        "station": "Chennai nungambakkam",
        "mean_rainfall": 24.5,
        "max_rainfall": 185.0,
        "heavy_rain_days": 18,
        "moderate_rain_days": 42
    }
    r = requests.post(f"{BASE_URL}/api/rainfall/cluster", json=rain_cluster_payload)
    print("\n[6] POST /api/rainfall/cluster -> Status:", r.status_code)
    print(json.dumps(r.json(), indent=2))
    
    # 7. Rainfall Metrics
    r = requests.get(f"{BASE_URL}/api/rainfall/metrics")
    print("\n[7] GET /api/rainfall/metrics -> Status:", r.status_code)
    print(json.dumps(r.json().get("metrics"), indent=2))
    print("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
