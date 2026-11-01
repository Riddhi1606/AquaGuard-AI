"""
Hydrological Dataset Generator for Model Training & Baseline Benchmarking
Combines empirical physical runoff formulas (Rational Method & SCS-CN concepts)
with Jaipur geographical features to create an explainable training and testing dataset.

Transparent Disclosure:
- Features reflect real Jaipur topography and road characteristics from gis/road_network/jaipur_roads.py.
- Label annotations are generated using calibrated hydrological risk functions for software validation
  and will be updated as municipal sensor and ground-truth verified incident data accumulates.
"""

import os
import sys
import numpy as np
import pandas as pd

# Add repo root to path to import jaipur_roads
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from gis.road_network.jaipur_roads import JAIPUR_ROAD_SEGMENTS

DATA_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(DATA_DIR, "flood_training_dataset.csv")

def generate_flood_training_data(n_samples_per_road: int = 120, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    records = []

    drainage_status_map = {
        "good": 1.0,
        "adequate": 0.75,
        "partially_blocked": 0.40,
        "poor": 0.15
    }

    # Weather simulation profiles (dry, light, moderate monsoon, heavy downpour, cloudburst)
    weather_scenarios = [
        {"intensity_range": (0.0, 5.0), "cum3_range": (0.0, 8.0), "cum24_range": (0.0, 15.0), "prob": 0.35},
        {"intensity_range": (5.0, 20.0), "cum3_range": (8.0, 35.0), "cum24_range": (15.0, 50.0), "prob": 0.30},
        {"intensity_range": (20.0, 45.0), "cum3_range": (35.0, 75.0), "cum24_range": (50.0, 110.0), "prob": 0.20},
        {"intensity_range": (45.0, 85.0), "cum3_range": (75.0, 140.0), "cum24_range": (110.0, 210.0), "prob": 0.12},
        {"intensity_range": (85.0, 140.0), "cum3_range": (140.0, 260.0), "cum24_range": (210.0, 360.0), "prob": 0.03},
    ]

    scenario_probs = [s["prob"] for s in weather_scenarios]

    for road in JAIPUR_ROAD_SEGMENTS:
        seg_id = road["segment_id"]
        elev = road["elevation_m"]
        slope = road["slope_deg"]
        drain_dist = road["distance_to_drain_m"]
        drain_cap = road["drainage_capacity_m3s"]
        drain_cond = drainage_status_map.get(road["drainage_status"], 0.7)
        underpass = 1 if road["underpass"] else 0
        hist_incidents = road["historical_incidents_count"]
        soil_coeff = road.get("soil_runoff_coeff", 0.82)

        # Baseline elevation of Jaipur drainage threshold ~380m
        elev_depression = max(0.0, (435.0 - elev) / 60.0)

        for _ in range(n_samples_per_road):
            sc_idx = np.random.choice(len(weather_scenarios), p=scenario_probs)
            sc = weather_scenarios[sc_idx]

            rain_intensity = np.random.uniform(*sc["intensity_range"])
            rain_cum_3h = np.random.uniform(*sc["cum3_range"])
            rain_cum_24h = np.random.uniform(*sc["cum24_range"])
            forecast_1h = max(0.0, rain_intensity * np.random.uniform(0.7, 1.3))

            # Hydrological Runoff Potential (Modified Rational Method principle)
            # Runoff = C * I * A / Drainage_Absorption
            runoff_factor = (rain_intensity * 0.45) + (rain_cum_3h * 0.35) + (rain_cum_24h * 0.10) + (forecast_1h * 0.10)
            runoff_volume = runoff_factor * soil_coeff

            # Resistance factors: high elevation, high slope, close drain with high capacity
            drain_resistance = (drain_cap * drain_cond * 2.5) / (1.0 + (drain_dist / 80.0))
            slope_drainage_speed = slope * 2.2

            # Water accumulation index
            water_accumulation = runoff_volume * (1.0 + elev_depression * 1.4) * (1.0 + underpass * 2.2)
            net_waterlogged_load = water_accumulation - drain_resistance - slope_drainage_speed

            # Historical vulnerability bias
            hist_bias = (hist_incidents / 20.0) * 12.0

            # Raw risk calculation (0 - 100)
            raw_risk = (net_waterlogged_load * 0.85) + hist_bias + np.random.normal(0, 3.5)
            risk_score = float(np.clip(raw_risk, 0.0, 100.0))

            # Binary waterlogged label (threshold at 55 for flood risk classification)
            waterlogged = 1 if risk_score >= 55.0 else 0

            # Estimated water depth (cm)
            if risk_score < 30:
                water_depth_cm = float(np.random.uniform(0, 5))
            elif risk_score < 60:
                water_depth_cm = float(np.random.uniform(5, 20))
            elif risk_score < 80:
                water_depth_cm = float(np.random.uniform(20, 50))
            else:
                water_depth_cm = float(np.random.uniform(50, 110))

            records.append({
                "segment_id": seg_id,
                "rainfall_intensity_mm_h": round(rain_intensity, 2),
                "rainfall_cum_3h_mm": round(rain_cum_3h, 2),
                "rainfall_cum_24h_mm": round(rain_cum_24h, 2),
                "forecast_1h_mm": round(forecast_1h, 2),
                "elevation_m": round(elev, 2),
                "slope_deg": round(slope, 2),
                "distance_to_drain_m": round(drain_dist, 2),
                "drainage_capacity_m3s": round(drain_cap, 2),
                "drainage_status_val": round(drain_cond, 2),
                "underpass": underpass,
                "historical_incidents_count": hist_incidents,
                "soil_runoff_coeff": round(soil_coeff, 2),
                "risk_score": round(risk_score, 2),
                "water_depth_cm": round(water_depth_cm, 1),
                "waterlogged": waterlogged,
                "dataset_provenance": "Empirical Hydrological Simulation (Jaipur Benchmarks)"
            })

    df = pd.DataFrame(records)
    df.to_csv(CSV_PATH, index=False)
    print(f"Generated {len(df)} samples across {len(JAIPUR_ROAD_SEGMENTS)} road segments.")
    print(f"Class distribution: {df['waterlogged'].value_counts().to_dict()}")
    return df

if __name__ == "__main__":
    generate_flood_training_data()
