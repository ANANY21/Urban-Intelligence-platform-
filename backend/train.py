import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib

DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "flood_risk_dataset_india.csv"))
MODEL_OUTPUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "model.joblib"))

def train():
    print(f"Loading dataset from: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        print("Dataset not found at path, skipping training.")
        return

    df = pd.read_csv(DATASET_PATH)
    print(f"Dataset loaded. Total shape: {df.shape}")
    print("Columns:", df.columns.tolist())

    # Features:
    # Latitude, Longitude, Rainfall (mm), Temperature (Â°C), Humidity (%), River Discharge (mÂ³/s), Water Level (m), Elevation (m), Land Cover, Soil Type, Population Density, Infrastructure, Historical Floods
    # Target: Flood Occurred

    # Clean column names (handle encoding differences like Â°C and mÂ³/s)
    clean_cols = {}
    for col in df.columns:
        if 'Rainfall' in col:
            clean_cols[col] = 'rainfall_mm'
        elif 'Temperature' in col:
            clean_cols[col] = 'temperature_c'
        elif 'Humidity' in col:
            clean_cols[col] = 'humidity_percent'
        elif 'River' in col:
            clean_cols[col] = 'river_discharge_m3s'
        elif 'Water Level' in col:
            clean_cols[col] = 'water_level_m'
        elif 'Elevation' in col:
            clean_cols[col] = 'elevation_m'
        elif 'Land Cover' in col:
            clean_cols[col] = 'land_cover'
        elif 'Soil Type' in col:
            clean_cols[col] = 'soil_type'
        elif 'Population' in col:
            clean_cols[col] = 'population_density'
        elif 'Infrastructure' in col:
            clean_cols[col] = 'infrastructure_score'
        elif 'Historical' in col:
            clean_cols[col] = 'historical_floods'
        elif 'Flood Occurred' in col:
            clean_cols[col] = 'flood_occurred'
        elif 'Latitude' in col:
            clean_cols[col] = 'latitude'
        elif 'Longitude' in col:
            clean_cols[col] = 'longitude'

    df = df.rename(columns=clean_cols)
    print("Cleaned column names:", df.columns.tolist())

    # One-hot encode categorical features or map them
    land_covers = ['Urban', 'Water Body', 'Agricultural', 'Forest', 'Desert', 'Coastal', 'Suburban', 'Riparian', 'Industrial']
    soil_types = ['Clay', 'Peat', 'Loam', 'Sandy', 'Silt']

    # Normalize categorical
    df['land_cover'] = df['land_cover'].astype(str)
    df['soil_type'] = df['soil_type'].astype(str)

    # Numeric features
    num_features = [
        'rainfall_mm', 'temperature_c', 'humidity_percent',
        'river_discharge_m3s', 'water_level_m', 'elevation_m',
        'population_density', 'infrastructure_score', 'historical_floods'
    ]

    # Convert to numeric
    for col in num_features + ['flood_occurred']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Add simple category index
    soil_map = {st.lower(): i for i, st in enumerate(soil_types)}
    land_map = {lc.lower(): i for i, lc in enumerate(land_covers)}
    df['soil_code'] = df['soil_type'].str.lower().map(soil_map).fillna(0)
    df['land_code'] = df['land_cover'].str.lower().map(land_map).fillna(0)

    feature_cols = num_features + ['soil_code', 'land_code']

    X = df[feature_cols]
    y = df['flood_occurred'].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training Random Forest Classifier...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=14, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print(f"Random Forest Evaluation Results:")
    print(f"Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}, ROC-AUC: {auc:.4f}")
    print(f"Confusion Matrix:\n{cm}")

    print("Training K-Means Clustering on risk features (5 clusters)...")
    cluster_features = ['rainfall_mm', 'river_discharge_m3s', 'water_level_m', 'elevation_m', 'population_density']
    kmeans = KMeans(n_clusters=5, random_state=42, n_init='auto')
    kmeans.fit(df[cluster_features])

    model_payload = {
        'rf_model': rf,
        'kmeans_model': kmeans,
        'feature_cols': feature_cols,
        'cluster_features': cluster_features,
        'metrics': {
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'roc_auc': round(float(auc), 4),
            'confusion_matrix': {
                'true_negative': int(cm[0][0]),
                'false_positive': int(cm[0][1]),
                'false_negative': int(cm[1][0]),
                'true_positive': int(cm[1][1])
            },
            'feature_importances': [
                {'feature': col, 'importance': round(float(imp), 4)}
                for col, imp in zip(feature_cols, rf.feature_importances_)
            ]
        }
    }

    joblib.dump(model_payload, MODEL_OUTPUT_PATH)
    print(f"Model artifact successfully saved to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train()
