# CHENNAI URBAN INTELLIGENCE PLATFORM — MACHINE LEARNING MODELS ARCHITECTURE & SPECIFICATIONS
**Document Reference:** UIP-ML-ARCH-DOC-V3  
**Category:** model-documentation  
**Issuing Authority:** Data Science & Urban Intelligence Research Group  
**Source URL:** https://urban-intelligence.chennai.gov.in/docs/ml-models-architecture.html  
**Publication Date:** 2026-03-10  
**Retrieval Date:** 2026-10-14  

---

## 1. Overview of Deployed Machine Learning Models
The platform hosts four primary serialized machine learning pipelines loaded directly into memory:

### Model 1: Traffic Congestion Classifier (`traffic_random_forest_pipeline.joblib`)
- **Algorithm:** RandomForestClassifier (100 estimators, max_depth=None, balanced weights).
- **Target Variable:** `Traffic Situation` with 4 categorical classes: `low`, `normal`, `high`, `heavy`.
- **Training Dataset:** `Traffic.csv` (2,976 records).
- **Input Features:** `Date` (day of month 1-31), `Day of the week` (string), `Hour` (0-23), `CarCount`, `BikeCount`, `BusCount`, `TruckCount`, `Total` (composite vehicle count).
- **Reported Accuracy:** ~99.16% test accuracy on held-out test splits.
- **Limitation Disclosure:** Reported accuracy is calibrated on the historical training distribution; real-world live corridor velocity is modulated by rainfall waterlogging and intersection signal delays.

### Model 2: Traffic Fleet K-Means Clustering (`traffic_kmeans_pipeline.joblib`)
- **Algorithm:** KMeans clustering (k=4 archetypes) with Standard Scaler preprocessing.
- **Features Used:** `CarCount`, `BikeCount`, `BusCount`, `TruckCount`, `Total`.
- **Identified Clusters:**
  - Cluster 0: Moderate Mixed Urban Flow (balanced vehicle distribution).
  - Cluster 1: High-Density Mixed Arterial (peak hour corridor congestion).
  - Cluster 2: Heavy Vehicle / Freight Corridor (elevated bus and truck percentages).
  - Cluster 3: Two-Wheeler / Light Vehicle Dominant (suburban feeder corridors).

### Model 3: Quantitative Precipitation Regressor (`rainfall_prediction_pipeline.joblib`)
- **Algorithm:** RandomForestRegressor (100 estimators, random_state=42).
- **Target Variable:** `Rainfall` in millimeters (continuous quantitative estimate).
- **Training Dataset:** `chennai_rainfall.csv` (~3,000 meteorological daily observations across Chennai stations).
- **Input Features:** `Station`, `Year`, `Month`, `Day`, `DayOfWeek`, `Quarter`, `Prev_Day_Rainfall`, `Prev_7_Day_Avg`.
- **Reported Performance:** RMSE: ~19.47 mm, MAE: ~12.35 mm, R²: ~0.42 (outperforming persistence and historical baseline models).
- **Confidence Interval:** Generates a 68% confidence interval bounded by `[max(0, prediction - RMSE), prediction + RMSE]`.

### Model 4: Hydrological Inundation Risk Index (`model.joblib`)
- **Algorithm:** Multi-factor hydrological risk classifier combining river discharge (m³/s), recent rainfall (mm), water level (m), digital elevation (m MSL), soil permeability (clay, loam, sand), and population density.
- **Output:** Flood probability score (0.0 to 1.0) and categorical risk levels: `safe`, `low`, `moderate`, `high`, `critical`.
- **Operational Rule:** Water level > 6.5m or rainfall > 150 mm in low elevation (< 5m MSL) triggers a `critical` risk warning.
