# Chennai Urban Intelligence Platform
> **Unified Smart City Situational Awareness & Flood Predictive Command Center**
> Built for Greater Chennai Corporation (GCC), Chennai Smart City, and TNSDMA operations.

---

## 🏛️ System Architecture Overview

The **Chennai Urban Intelligence Platform** is a dark-mode geospatial command-center frontend and ML inference engine combining:
- **Hydrological Flood Intelligence**: Supervised Machine Learning (Random Forest Classifier + K-Means spatial clustering) trained on Indian flood observation data and calibrated with Chennai catchments (Adyar River, Cooum River, Buckingham Canal, Chembarambakkam Reservoir).
- **Rainfall & Meteorological Radar**: Doppler radar precipitation tracking, automatic weather station telemetry (Nungambakkam, Meenambakkam, Taramani, Chembarambakkam, Ennore, Velachery), and 24-hour hyetographs with IMD thresholds.
- **Traffic Mobility Intelligence**: Real-time arterial corridor transit velocity (OMR IT Expressway, Anna Salai, GST Road, ECR, Inner Ring Road), subway waterlogging chokepoints, and dynamic rerouting suggestions.
- **Risk Zones & K-Means Clustering**: 5 unsupervised environmental archetypes with multi-factor Radar chart feature breakdowns.
- **Tactical Situational AI Insights**: Deterministic rule-based synthesis linking reservoir outflows and tidal backwaters to mitigation actions.
- **Tactical Alerts Center**: Multi-agency dispatch feed with acknowledged statuses and Common Alerting Protocol (CAP) gateway simulation.
- **Model Governance & Performance**: Empirical classification metrics (Accuracy, Precision, Recall, F1, ROC-AUC), 2×2 confusion matrix heatmap, and feature importance bar charts.

---

## 🚀 Running the Platform

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (with `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `joblib`)

### 2. Start the FastAPI ML Backend
```bash
# From the project root:
python backend/server.py
```
- Listens on `http://127.0.0.1:8000`
- Available endpoints:
  - `GET /health` — Health and model loading status
  - `POST /predict` — Random Forest flood prediction and K-Means cluster assignment
  - `GET /api/model-performance` — Live evaluation metrics and confusion matrix

### 3. Start the Frontend Command Center
```bash
# In another terminal:
npm run dev
```
- Open `http://127.0.0.1:5173` in your browser.

---

## 🗺️ Geospatial & Command Center Features
- **CartoDB Dark Matter Tiles**: Ultra-clean aerospace styling.
- **Interactive Layers**: Toggle Flood Risk, Rainfall Halos, Traffic Corridors, Waterways, and Roadway Incidents.
- **Hotspot Presets**: One-click simulation for **Velachery Lake Basin**, **Saidapet Adyar Spate**, **OMR Tech Corridor**, **Besant Nagar Coast**, and **Tambaram Highlands**.
- **Dual Runtime**: Seamlessly works with live FastAPI backend or calibrated offline simulation with clear visual provenance badges.
