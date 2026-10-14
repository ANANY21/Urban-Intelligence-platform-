import os
import datetime
import pandas as pd
import numpy as np
import joblib

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, mean_absolute_error, mean_squared_error, r2_score
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
ARTIFACTS_DIR = os.path.dirname(__file__)

def parse_time_to_hour(time_val):
    """Safely parse time strings like '12:00:00 AM' or datetime/string objects to integer hour 0-23."""
    if pd.isna(time_val):
        return 12
    if isinstance(time_val, (int, float)):
        return int(time_val) % 24
    s = str(time_val).strip()
    try:
        t = pd.to_datetime(s).hour
        return int(t)
    except Exception:
        # Fallback split
        parts = s.split(':')
        if parts:
            try:
                h = int(parts[0])
                if 'pm' in s.lower() and h < 12:
                    h += 12
                elif 'am' in s.lower() and h == 12:
                    h = 0
                return h % 24
            except Exception:
                pass
    return 12

# ==============================================================================
# 1. TRAFFIC RANDOM FOREST PIPELINE & K-MEANS PIPELINE
# ==============================================================================
def train_traffic_pipelines():
    traffic_csv = os.path.join(DATA_DIR, "Traffic.csv")
    print(f"\n[1/4] Training Traffic Models on {traffic_csv}...")
    df = pd.read_csv(traffic_csv)
    print(f"Traffic shape: {df.shape}")

    # Feature engineering: Hour from Time
    df['Hour'] = df['Time'].apply(parse_time_to_hour)

    # Features and Target
    feature_cols = ['Date', 'Day of the week', 'Hour', 'CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']
    X = df[feature_cols].copy()
    y_raw = df['Traffic Situation'].str.strip().str.lower()

    # Target class order
    target_classes = ['low', 'normal', 'high', 'heavy']
    class_map = {cls: i for i, cls in enumerate(target_classes)}
    y = y_raw.map(class_map)

    # Baseline accuracy
    majority_class_count = y_raw.value_counts().max()
    baseline_acc = majority_class_count / len(y_raw)
    print(f"Traffic Baseline Majority Accuracy: {baseline_acc:.4f} ({y_raw.value_counts().idxmax()})")

    # Train / Test split (stratified by class)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ColumnTransformer for raw inputs
    cat_cols = ['Day of the week']
    num_cols = ['Date', 'Hour', 'CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
            ('num', 'passthrough', num_cols)
        ]
    )

    # Traffic Random Forest Pipeline
    rf_clf = RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1)
    traffic_rf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', rf_clf)
    ])

    print("Fitting Traffic Random Forest Pipeline...")
    traffic_rf_pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = traffic_rf_pipeline.predict(X_test)
    y_prob = traffic_rf_pipeline.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2, 3])

    print(f"Traffic RF Test Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")
    print(f"Confusion Matrix (low, normal, high, heavy):\n{cm}")

    # Feature Importances extraction from ColumnTransformer
    encoded_cat_names = traffic_rf_pipeline.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(cat_cols).tolist()
    all_feature_names = encoded_cat_names + num_cols
    importances = traffic_rf_pipeline.named_steps['classifier'].feature_importances_
    feat_imp = sorted(
        [{'feature': f, 'importance': round(float(imp), 4)} for f, imp in zip(all_feature_names, importances)],
        key=lambda x: x['importance'], reverse=True
    )

    traffic_rf_meta = {
        'model_name': 'Traffic Congestion Random Forest Classifier',
        'algorithm': 'RandomForestClassifier(n_estimators=100, max_depth=16)',
        'target_column': 'Traffic Situation',
        'target_classes': target_classes,
        'feature_cols': feature_cols,
        'total_records': len(df),
        'baseline_accuracy': round(float(baseline_acc), 4),
        'metrics': {
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'confusion_matrix': cm.tolist(),
            'feature_importances': feat_imp[:10]
        },
        'class_distribution': df['Traffic Situation'].value_counts().to_dict(),
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    # Save Traffic RF Pipeline Artifact
    rf_artifact_path = os.path.join(ARTIFACTS_DIR, "traffic_random_forest_pipeline.joblib")
    joblib.dump({'pipeline': traffic_rf_pipeline, 'meta': traffic_rf_meta}, rf_artifact_path)
    print(f"Saved: {rf_artifact_path}")

    # ==========================================================================
    # Traffic K-Means Clustering (4 Clusters on Vehicle Features)
    # ==========================================================================
    print("\n[2/4] Training Traffic K-Means Clustering (4 Clusters)...")
    cluster_features = ['CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']
    X_clust = df[cluster_features].copy()

    traffic_kmeans_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('kmeans', KMeans(n_clusters=4, random_state=42, n_init=10))
    ])

    df['Cluster'] = traffic_kmeans_pipeline.fit_predict(X_clust)

    # Analyze Cluster Characteristics to give truthful, data-backed names
    cluster_stats = []
    cluster_profiles = {}
    for cid in range(4):
        cdf = df[df['Cluster'] == cid]
        avg_cars = float(cdf['CarCount'].mean())
        avg_bikes = float(cdf['BikeCount'].mean())
        avg_buses = float(cdf['BusCount'].mean())
        avg_trucks = float(cdf['TruckCount'].mean())
        avg_total = float(cdf['Total'].mean())
        dominant_situation = cdf['Traffic Situation'].value_counts().idxmax()
        count = len(cdf)

        cluster_stats.append({
            'cluster_id': cid,
            'count': count,
            'percentage': round((count / len(df)) * 100, 1),
            'avg_car_count': round(avg_cars, 1),
            'avg_bike_count': round(avg_bikes, 1),
            'avg_bus_count': round(avg_buses, 1),
            'avg_truck_count': round(avg_trucks, 1),
            'avg_total_vehicles': round(avg_total, 1),
            'dominant_situation': dominant_situation
        })

    # Human-readable labels derived strictly from feature statistics
    # Sort by avg_total_vehicles to understand density gradient
    sorted_by_total = sorted(cluster_stats, key=lambda x: x['avg_total_vehicles'])
    
    # Lowest volume -> Off-peak / Free Flow
    # Highest volume -> Peak Gridlock / High Inflow
    # High bikes vs cars -> Commuter Bike Rush
    # High bus/truck -> Heavy Commercial Arterial
    labels_map = {}
    labels_map[sorted_by_total[0]['cluster_id']] = {
        'name': 'Off-Peak Free-Flow Pattern',
        'archetype': 'Minimal vehicular volume, fluid movement across all arterial roads.',
        'color': '#10B981'
    }
    labels_map[sorted_by_total[3]['cluster_id']] = {
        'name': 'Peak Congestion Gridlock',
        'archetype': 'Maximum car count and composite vehicle pressure exceeding corridor capacity.',
        'color': '#EF4444'
    }

    # For intermediate 1 & 2: check ratio of bikes to commercial
    rem1, rem2 = sorted_by_total[1], sorted_by_total[2]
    if (rem1['avg_bike_count'] / (rem1['avg_car_count'] + 1)) > (rem2['avg_bike_count'] / (rem2['avg_car_count'] + 1)):
        bike_cid, comm_cid = rem1['cluster_id'], rem2['cluster_id']
    else:
        bike_cid, comm_cid = rem2['cluster_id'], rem1['cluster_id']

    labels_map[bike_cid] = {
        'name': 'Two-Wheeler Commuter Surge',
        'archetype': 'Elevated motorcycle and scooter density with moderate private car transit.',
        'color': '#35D9F5'
    }
    labels_map[comm_cid] = {
        'name': 'Heavy Commercial / Logistics Transit',
        'archetype': 'Disproportionate freight trucks and public transit buses sharing the roadway.',
        'color': '#F59E0B'
    }

    for stat in cluster_stats:
        cid = stat['cluster_id']
        stat.update(labels_map[cid])

    traffic_kmeans_meta = {
        'model_name': 'Traffic Vehicle Composition K-Means Clustering',
        'features': cluster_features,
        'n_clusters': 4,
        'cluster_summaries': cluster_stats,
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    kmeans_artifact_path = os.path.join(ARTIFACTS_DIR, "traffic_kmeans_pipeline.joblib")
    joblib.dump({'pipeline': traffic_kmeans_pipeline, 'meta': traffic_kmeans_meta}, kmeans_artifact_path)
    print(f"Saved: {kmeans_artifact_path}")

# ==============================================================================
# 2. RAINFALL REGRESSION PIPELINE & K-MEANS PIPELINE
# ==============================================================================
def train_rainfall_pipelines():
    rainfall_csv = os.path.join(DATA_DIR, "chennai_rainfall.csv")
    print(f"\n[3/4] Training Rainfall Models on {rainfall_csv}...")
    df = pd.read_csv(rainfall_csv)
    print(f"Raw Rainfall shape: {df.shape}")

    # Clean & parse dates (format DD-MM-YYYY)
    df['Date'] = pd.to_datetime(df['Date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['Date', 'Rainfall', 'Station']).copy()
    df = df.drop_duplicates(subset=['Station', 'Date'])
    df = df.sort_values(by=['Station', 'Date']).reset_index(drop=True)
    df['Rainfall'] = pd.to_numeric(df['Rainfall'], errors='coerce').fillna(0)

    # Calendar feature engineering
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['DayOfWeek'] = df['Date'].dt.dayofweek
    df['Quarter'] = df['Date'].dt.quarter

    # Lag features per station (information available at prediction time)
    df['Prev_Day_Rainfall'] = df.groupby('Station')['Rainfall'].shift(1)
    df['Prev_7_Day_Avg'] = df.groupby('Station')['Rainfall'].rolling(7, min_periods=1).mean().reset_index(0, drop=True)

    # Fill initial station missing lags with 0
    df['Prev_Day_Rainfall'] = df['Prev_Day_Rainfall'].fillna(0)
    df['Prev_7_Day_Avg'] = df['Prev_7_Day_Avg'].fillna(0)

    # Modeling DataFrame
    feature_cols = [
        'Station', 'Year', 'Month', 'Day', 'DayOfWeek', 'Quarter',
        'Prev_Day_Rainfall', 'Prev_7_Day_Avg'
    ]
    X = df[feature_cols].copy()
    y = df['Rainfall'].values

    # Baseline performance (predicting Prev_Day_Rainfall as simple baseline)
    baseline_mae = mean_absolute_error(y, df['Prev_Day_Rainfall'])
    baseline_rmse = mean_squared_error(y, df['Prev_Day_Rainfall']) ** 0.5
    print(f"Rainfall Baseline (Lag 1) MAE: {baseline_mae:.2f} mm, RMSE: {baseline_rmse:.2f} mm")

    # Chronological holdout: test on latest 15% of dates to avoid future data leakage
    split_idx = int(len(df) * 0.85)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # Pipeline with Station OneHotEncoding
    cat_cols = ['Station']
    num_cols = ['Year', 'Month', 'Day', 'DayOfWeek', 'Quarter', 'Prev_Day_Rainfall', 'Prev_7_Day_Avg']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
            ('num', 'passthrough', num_cols)
        ]
    )

    rf_reg = RandomForestRegressor(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1)
    rainfall_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', rf_reg)
    ])

    print("Fitting Rainfall Random Forest Pipeline...")
    rainfall_pipeline.fit(X_train, y_train)

    y_pred = rainfall_pipeline.predict(X_test)
    y_pred = np.maximum(y_pred, 0) # non-negative rainfall

    mae = mean_absolute_error(y_test, y_pred)
    rmse = mean_squared_error(y_test, y_pred) ** 0.5
    r2 = r2_score(y_test, y_pred)
    print(f"Rainfall RF Test MAE: {mae:.2f} mm, RMSE: {rmse:.2f} mm, R²: {r2:.4f}")

    # Feature Importances
    all_stations = sorted(df['Station'].unique().tolist())
    encoded_station_names = rainfall_pipeline.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(cat_cols).tolist()
    all_feat_names = encoded_station_names + num_cols
    rf_importances = rainfall_pipeline.named_steps['regressor'].feature_importances_
    feat_imp = sorted(
        [{'feature': f, 'importance': round(float(imp), 4)} for f, imp in zip(all_feat_names, rf_importances)],
        key=lambda x: x['importance'], reverse=True
    )

    rainfall_meta = {
        'model_name': 'Chennai Station Rainfall Random Forest Regressor',
        'algorithm': 'RandomForestRegressor(n_estimators=100, max_depth=16)',
        'target': 'Rainfall (mm)',
        'target_unit': 'mm',
        'stations': all_stations,
        'feature_cols': feature_cols,
        'total_records': len(df),
        'metrics': {
            'mae': round(float(mae), 2),
            'rmse': round(float(rmse), 2),
            'r2_score': round(float(r2), 4),
            'baseline_mae': round(float(baseline_mae), 2),
            'baseline_rmse': round(float(baseline_rmse), 2),
            'feature_importances': feat_imp[:12]
        },
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    rainfall_artifact_path = os.path.join(ARTIFACTS_DIR, "rainfall_prediction_pipeline.joblib")
    joblib.dump({'pipeline': rainfall_pipeline, 'meta': rainfall_meta}, rainfall_artifact_path)
    print(f"Saved: {rainfall_artifact_path}")

    # ==========================================================================
    # Rainfall K-Means Clustering across 62 Chennai Stations
    # ==========================================================================
    print("\n[4/4] Training Rainfall K-Means Clustering across 62 Chennai Stations...")
    # Calculate station-level multi-factor precipitation profile
    station_profile = df.groupby('Station').agg(
        mean_rainfall=('Rainfall', 'mean'),
        max_rainfall=('Rainfall', 'max'),
        heavy_rain_days=('Rainfall', lambda x: (x >= 64.5).sum()),
        moderate_rain_days=('Rainfall', lambda x: ((x >= 15.6) & (x < 64.5)).sum()),
        total_observations=('Rainfall', 'count')
    ).reset_index()

    station_clust_features = ['mean_rainfall', 'max_rainfall', 'heavy_rain_days', 'moderate_rain_days']
    X_station_clust = station_profile[station_clust_features].copy()

    rainfall_kmeans_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('kmeans', KMeans(n_clusters=3, random_state=42, n_init=10))
    ])

    station_profile['Cluster'] = rainfall_kmeans_pipeline.fit_predict(X_station_clust)

    # Sort clusters by mean_rainfall to label Low, Medium, High precipitation zones
    cluster_means = station_profile.groupby('Cluster')['mean_rainfall'].mean().to_dict()
    sorted_cids = sorted(cluster_means.keys(), key=lambda c: cluster_means[c])
    
    zone_labels = {
        sorted_cids[0]: {
            'name': 'Lowland / Inland Lower Precipitation Catchment',
            'zone': 'Lower Rainfall Zone',
            'color': '#10B981',
            'description': 'Stations with lower average annual precipitation and reduced frequency of severe convective cloudbursts.'
        },
        sorted_cids[1]: {
            'name': 'Central Urban Moderate Precipitation Zone',
            'zone': 'Medium Rainfall Zone',
            'color': '#35D9F5',
            'description': 'Metropolitan core stations subject to typical northeast monsoon squall lines.'
        },
        sorted_cids[2]: {
            'name': 'Coastal & Estuary Heavy Surge Zone',
            'zone': 'High Rainfall Zone',
            'color': '#EF4444',
            'description': 'Coastal and marine-adjacent stations subject to intense maritime moisture influx and peak cloudbursts (>150mm).'
        }
    }

    station_profile['Zone_Name'] = station_profile['Cluster'].map(lambda c: zone_labels[c]['name'])
    station_profile['Zone'] = station_profile['Cluster'].map(lambda c: zone_labels[c]['zone'])

    rainfall_cluster_summaries = []
    for cid in range(3):
        c_meta = zone_labels[cid]
        c_stations = station_profile[station_profile['Cluster'] == cid]
        rainfall_cluster_summaries.append({
            'cluster_id': cid,
            'name': c_meta['name'],
            'zone': c_meta['zone'],
            'color': c_meta['color'],
            'description': c_meta['description'],
            'station_count': len(c_stations),
            'avg_rainfall_mm': round(float(c_stations['mean_rainfall'].mean()), 2),
            'max_rainfall_recorded_mm': round(float(c_stations['max_rainfall'].max()), 1),
            'avg_heavy_rain_events': round(float(c_stations['heavy_rain_days'].mean()), 1),
            'stations_sample': c_stations['Station'].head(6).tolist()
        })

    rainfall_kmeans_meta = {
        'model_name': 'Chennai Stations K-Means Rainfall Zone Clustering',
        'n_clusters': 3,
        'features': station_clust_features,
        'cluster_summaries': rainfall_cluster_summaries,
        'station_assignments': station_profile[['Station', 'Cluster', 'Zone', 'mean_rainfall', 'max_rainfall']].to_dict(orient='records'),
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    rain_kmeans_artifact_path = os.path.join(ARTIFACTS_DIR, "rainfall_kmeans_pipeline.joblib")
    joblib.dump({'pipeline': rainfall_kmeans_pipeline, 'meta': rainfall_kmeans_meta}, rain_kmeans_artifact_path)
    print(f"Saved: {rain_kmeans_artifact_path}")
    print("\n[SUCCESS] All 4 pipelines successfully trained, evaluated, and serialized!")

if __name__ == "__main__":
    train_traffic_pipelines()
    train_rainfall_pipelines()
