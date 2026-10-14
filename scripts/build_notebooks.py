import json
import os

os.makedirs('notebooks', exist_ok=True)

# 1. Traffic Colab Notebook
traffic_nb = {
    'cells': [
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': [
                "# Urban Intelligence Platform: Traffic Congestion Prediction & K-Means Clustering\n",
                "**Chennai Smart City Operational Mobility Intelligence**\n",
                "\n",
                "This notebook trains:\n",
                "1. A **RandomForestClassifier** with a scikit-learn Pipeline on `Traffic.csv` to classify `Traffic Situation` (`low`, `normal`, `high`, `heavy`).\n",
                "2. A **K-Means Clustering Pipeline** (`StandardScaler` + `KMeans(n_clusters=4)`) to discover traffic density archetypes based on multimodal vehicle counts.\n",
                "3. Exports `traffic_random_forest_pipeline.joblib` and `traffic_kmeans_pipeline.joblib` for real-time FastAPI inference."
            ]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "import pandas as pd\n",
                "import numpy as np\n",
                "import matplotlib.pyplot as plt\n",
                "import seaborn as sns\n",
                "import joblib\n",
                "\n",
                "from sklearn.pipeline import Pipeline\n",
                "from sklearn.compose import ColumnTransformer\n",
                "from sklearn.preprocessing import OneHotEncoder, StandardScaler\n",
                "from sklearn.ensemble import RandomForestClassifier\n",
                "from sklearn.cluster import KMeans\n",
                "from sklearn.model_selection import train_test_split\n",
                "from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 1. Load and Inspect Traffic Dataset"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "df = pd.read_csv('Traffic.csv')\n",
                "print('Shape:', df.shape)\n",
                "print('Columns:', df.columns.tolist())\n",
                "print('\\nMissing values:\\n', df.isnull().sum())\n",
                "print('\\nTraffic Situation distribution:\\n', df['Traffic Situation'].value_counts())\n",
                "df.head()"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 2. Feature Engineering & Preprocessing Pipeline"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "def parse_time_to_hour(val):\n",
                "    try:\n",
                "        return pd.to_datetime(str(val).strip()).hour\n",
                "    except Exception:\n",
                "        return 12\n",
                "\n",
                "df['Hour'] = df['Time'].apply(parse_time_to_hour)\n",
                "df['Traffic Situation'] = df['Traffic Situation'].str.strip().str.lower()\n",
                "\n",
                "feature_cols = ['Date', 'Day of the week', 'Hour', 'CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']\n",
                "X = df[feature_cols].copy()\n",
                "y = df['Traffic Situation'].copy()\n",
                "\n",
                "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)\n",
                "print('Train shape:', X_train.shape, 'Test shape:', X_test.shape)\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 3. Train Random Forest Classifier Pipeline"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "cat_cols = ['Day of the week']\n",
                "num_cols = ['Date', 'Hour', 'CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']\n",
                "\n",
                "preprocessor = ColumnTransformer([\n",
                "    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),\n",
                "    ('num', 'passthrough', num_cols)\n",
                "])\n",
                "\n",
                "rf_pipeline = Pipeline([\n",
                "    ('preprocessor', preprocessor),\n",
                "    ('classifier', RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1))\n",
                "])\n",
                "\n",
                "rf_pipeline.fit(X_train, y_train)\n",
                "y_pred = rf_pipeline.predict(X_test)\n",
                "\n",
                "print('Test Accuracy:', round(accuracy_score(y_test, y_pred), 4))\n",
                "print('\\nClassification Report:\\n', classification_report(y_test, y_pred))\n",
                "print('\\nConfusion Matrix:\\n', confusion_matrix(y_test, y_pred))\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 4. Train K-Means Clustering on Vehicle Attributes"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "cluster_features = ['CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Total']\n",
                "kmeans_pipeline = Pipeline([\n",
                "    ('scaler', StandardScaler()),\n",
                "    ('kmeans', KMeans(n_clusters=4, random_state=42, n_init=10))\n",
                "])\n",
                "\n",
                "df['Cluster'] = kmeans_pipeline.fit_predict(df[cluster_features])\n",
                "print('Cluster counts:\\n', df['Cluster'].value_counts())\n",
                "print('\\nCluster feature means:\\n', df.groupby('Cluster')[cluster_features].mean())\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 5. Export Pipelines for FastAPI Serving"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "joblib.dump({'pipeline': rf_pipeline}, 'traffic_random_forest_pipeline.joblib')\n",
                "joblib.dump({'pipeline': kmeans_pipeline}, 'traffic_kmeans_pipeline.joblib')\n",
                "print('Traffic pipelines exported successfully!')\n"
            ]
        }
    ],
    'metadata': {'language_info': {'name': 'python'}},
    'nbformat': 4,
    'nbformat_minor': 4
}

with open('notebooks/Traffic_Intelligence_Colab_Notebook.ipynb', 'w') as f:
    json.dump(traffic_nb, f, indent=2)

# 2. Rainfall Colab Notebook
rainfall_nb = {
    'cells': [
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': [
                "# Urban Intelligence Platform: Rainfall Prediction & Station K-Means Clustering\n",
                "**Chennai Real Historical Daily Precipitation Telemetry (1993 - 2023)**\n",
                "\n",
                "This notebook trains:\n",
                "1. A **RandomForestRegressor** pipeline on historical daily observations from 62 Chennai meteorological stations.\n",
                "2. A **K-Means Clustering Pipeline** (`KMeans(n_clusters=3)`) grouping Chennai stations into empirical precipitation zones (Lower, Moderate, Heavy Surge).\n",
                "3. Exports `rainfall_prediction_pipeline.joblib` and `rainfall_kmeans_pipeline.joblib`."
            ]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "import pandas as pd\n",
                "import numpy as np\n",
                "import matplotlib.pyplot as plt\n",
                "import seaborn as sns\n",
                "import joblib\n",
                "\n",
                "from sklearn.pipeline import Pipeline\n",
                "from sklearn.compose import ColumnTransformer\n",
                "from sklearn.preprocessing import OneHotEncoder, StandardScaler\n",
                "from sklearn.ensemble import RandomForestRegressor\n",
                "from sklearn.cluster import KMeans\n",
                "from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 1. Load and Clean Chennai Rainfall Dataset"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "df = pd.read_csv('chennai_rainfall.csv')\n",
                "print('Shape:', df.shape)\n",
                "df['Date'] = pd.to_datetime(df['Date'], format='%d-%m-%Y', errors='coerce')\n",
                "df = df.dropna(subset=['Date', 'Rainfall', 'Station']).drop_duplicates(subset=['Station', 'Date'])\n",
                "df = df.sort_values(by=['Station', 'Date']).reset_index(drop=True)\n",
                "df['Rainfall'] = pd.to_numeric(df['Rainfall'], errors='coerce').fillna(0)\n",
                "\n",
                "df['Year'] = df['Date'].dt.year\n",
                "df['Month'] = df['Date'].dt.month\n",
                "df['Day'] = df['Date'].dt.day\n",
                "df['DayOfWeek'] = df['Date'].dt.dayofweek\n",
                "df['Quarter'] = df['Date'].dt.quarter\n",
                "df['Prev_Day_Rainfall'] = df.groupby('Station')['Rainfall'].shift(1).fillna(0)\n",
                "df['Prev_7_Day_Avg'] = df.groupby('Station')['Rainfall'].rolling(7, min_periods=1).mean().reset_index(0, drop=True).fillna(0)\n",
                "df.head()\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 2. Train Rainfall Random Forest Regressor Pipeline"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "feature_cols = ['Station', 'Year', 'Month', 'Day', 'DayOfWeek', 'Quarter', 'Prev_Day_Rainfall', 'Prev_7_Day_Avg']\n",
                "X = df[feature_cols]\n",
                "y = df['Rainfall'].values\n",
                "\n",
                "split_idx = int(len(df) * 0.85)\n",
                "X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]\n",
                "y_train, y_test = y[:split_idx], y[split_idx:]\n",
                "\n",
                "preprocessor = ColumnTransformer([\n",
                "    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), ['Station']),\n",
                "    ('num', 'passthrough', ['Year', 'Month', 'Day', 'DayOfWeek', 'Quarter', 'Prev_Day_Rainfall', 'Prev_7_Day_Avg'])\n",
                "])\n",
                "\n",
                "rainfall_rf_pipeline = Pipeline([\n",
                "    ('preprocessor', preprocessor),\n",
                "    ('regressor', RandomForestRegressor(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1))\n",
                "])\n",
                "\n",
                "rainfall_rf_pipeline.fit(X_train, y_train)\n",
                "pred = np.maximum(rainfall_rf_pipeline.predict(X_test), 0)\n",
                "\n",
                "print('MAE:', round(mean_absolute_error(y_test, pred), 2), 'mm')\n",
                "print('RMSE:', round(mean_squared_error(y_test, pred) ** 0.5, 2), 'mm')\n",
                "print('R2 Score:', round(r2_score(y_test, pred), 4))\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 3. Station K-Means Spatial Precipitation Zones"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "station_profile = df.groupby('Station').agg(\n",
                "    mean_rainfall=('Rainfall', 'mean'),\n",
                "    max_rainfall=('Rainfall', 'max'),\n",
                "    heavy_rain_days=('Rainfall', lambda x: (x >= 64.5).sum()),\n",
                "    moderate_rain_days=('Rainfall', lambda x: ((x >= 15.6) & (x < 64.5)).sum())\n",
                ").reset_index()\n",
                "\n",
                "station_clust_features = ['mean_rainfall', 'max_rainfall', 'heavy_rain_days', 'moderate_rain_days']\n",
                "rainfall_kmeans_pipeline = Pipeline([\n",
                "    ('scaler', StandardScaler()),\n",
                "    ('kmeans', KMeans(n_clusters=3, random_state=42, n_init=10))\n",
                "])\n",
                "\n",
                "station_profile['Cluster'] = rainfall_kmeans_pipeline.fit_predict(station_profile[station_clust_features])\n",
                "print(station_profile.groupby('Cluster')[station_clust_features].mean())\n"
            ]
        },
        {
            'cell_type': 'markdown',
            'metadata': {},
            'source': ["## 4. Export Pipelines for FastAPI Serving"]
        },
        {
            'cell_type': 'code',
            'execution_count': None,
            'metadata': {},
            'outputs': [],
            'source': [
                "joblib.dump({'pipeline': rainfall_rf_pipeline}, 'rainfall_prediction_pipeline.joblib')\n",
                "joblib.dump({'pipeline': rainfall_kmeans_pipeline}, 'rainfall_kmeans_pipeline.joblib')\n",
                "print('Rainfall pipelines exported successfully!')\n"
            ]
        }
    ],
    'metadata': {'language_info': {'name': 'python'}},
    'nbformat': 4,
    'nbformat_minor': 4
}

with open('notebooks/Rainfall_Intelligence_Colab_Notebook.ipynb', 'w') as f:
    json.dump(rainfall_nb, f, indent=2)

print('Both Colab notebooks written to notebooks/ successfully!')
