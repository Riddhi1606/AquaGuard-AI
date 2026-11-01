"""
AquaGuard AI — Core Risk Prediction & Explainability Engine
Implements:
1. Hydrological Rule-Based Risk Engine (Transparent Rational Method Formulation)
2. Supervised Machine Learning Predictor (Loads trained model from saved_models/)
3. Explainable AI Feature Attribution & Natural Language Reasoning
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
import joblib

from backend.app.schemas.schemas import PredictResponse, RiskFactor

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml_engine", "saved_models"))
MODEL_PATH = os.path.join(MODELS_DIR, "flood_model.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

_LOADED_MODEL = None
_LOADED_SCALER = None
_METRICS_INFO = None

def _get_ml_artifacts():
    global _LOADED_MODEL, _LOADED_SCALER, _METRICS_INFO
    if _LOADED_MODEL is None and os.path.exists(MODEL_PATH):
        try:
            _LOADED_MODEL = joblib.load(MODEL_PATH)
            if os.path.exists(SCALER_PATH):
                _LOADED_SCALER = joblib.load(SCALER_PATH)
            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r", encoding="utf-8") as f:
                    _METRICS_INFO = json.load(f)
            logger.info("Successfully loaded ML model from %s", MODEL_PATH)
        except Exception as e:
            logger.warning("Could not load ML artifacts: %s. Using Baseline Engine.", e)
    return _LOADED_MODEL, _LOADED_SCALER, _METRICS_INFO


def calculate_baseline_risk(
    road: Dict[str, Any],
    rain_intensity: float,
    rain_3h: float,
    rain_24h: float,
    forecast_1h: float,
    drain_status_override: str = None
) -> Tuple[float, List[RiskFactor]]:
    """
    Hydrological Baseline Risk Engine.
    Transparent heuristic score using configurable rainfall and illustrative road attributes; not a physically calibrated flood model.
    """
    drainage_map = {"good": 1.0, "adequate": 0.75, "partially_blocked": 0.40, "poor": 0.15}
    status_str = drain_status_override or road.get("drainage_status", "adequate")
    drain_cond = drainage_map.get(status_str, 0.7)

    elev = road.get("elevation_m", 410.0)
    slope = road.get("slope_deg", 2.0)
    drain_dist = road.get("distance_to_drain_m", 200.0)
    drain_cap = road.get("drainage_capacity_m3s", 15.0)
    underpass = 1.0 if road.get("underpass", False) else 0.0
    hist_incidents = road.get("historical_incidents_count", 0)
    soil_coeff = road.get("soil_runoff_coeff", 0.82)

    # 1. Rainfall hydraulic pressure component (0 - 45 pts)
    # Heavy current downpour + antecedent ground saturation + short-term forecast
    rain_score = min(45.0, (rain_intensity * 0.8) + (rain_3h * 0.35) + (rain_24h * 0.08) + (forecast_1h * 0.2)) * (soil_coeff / 0.8)

    # 2. Elevation & Topographic Depression (0 - 25 pts)
    # Jaipur low valley threshold is ~375m - 395m (e.g. Sanganer, Tonk Rd Dravyavati basin, Sodala)
    depression_penalty = max(0.0, (430.0 - elev) / 55.0) * 18.0
    underpass_penalty = 16.0 if underpass else 0.0
    elevation_score = min(25.0, depression_penalty + underpass_penalty)

    # 3. Drainage Inadequacy / Obstruction (0 - 20 pts)
    # Distance to drain and condition status
    dist_factor = min(10.0, (drain_dist / 60.0))
    cond_factor = (1.0 - drain_cond) * 12.0
    drain_penalty = min(20.0, dist_factor + cond_factor)

    # 4. Historical Vulnerability & Local Geometry (-5 to +15 pts)
    slope_relief = min(10.0, slope * 2.0) # steeper roads drain faster into lower segments
    hist_factor = min(12.0, (hist_incidents / 15.0) * 12.0)
    vulnerability_score = max(0.0, hist_factor - slope_relief)

    total_risk = float(np.clip(rain_score + elevation_score + drain_penalty + vulnerability_score, 0.0, 100.0))

    # Explainability Factor Breakdown
    factors: List[RiskFactor] = []
    if rain_intensity > 15.0 or rain_3h > 35.0:
        factors.append(RiskFactor(
            factor="Extreme Monsoon Precipitation",
            impact="Increases Risk",
            contribution=round(rain_score, 1),
            detail=f"{rain_intensity:.1f} mm/h current rainfall with {rain_3h:.1f} mm 3h accumulation exceeds normal soil absorption."
        ))
    elif rain_intensity > 3.0:
        factors.append(RiskFactor(
            factor="Moderate Rainfall Inflow",
            impact="Increases Risk",
            contribution=round(rain_score, 1),
            detail=f"Steady precipitation ({rain_intensity:.1f} mm/h) contributing to runoff."
        ))

    if underpass:
        factors.append(RiskFactor(
            factor="Enclosed Underpass Geometry",
            impact="Increases Risk",
            contribution=16.0,
            detail="Sub-grade underpass funneling runoff from adjacent corridors."
        ))

    if elev < 392.0:
        factors.append(RiskFactor(
            factor="Low Basin Elevation",
            impact="Increases Risk",
            contribution=round(depression_penalty, 1),
            detail=f"Low benchmark elevation ({elev:.1f}m) in natural drainage catchment."
        ))
    elif elev > 425.0:
        factors.append(RiskFactor(
            factor="High Ridge Elevation",
            impact="Decreases Risk",
            contribution=-8.0,
            detail=f"Elevated terrain ({elev:.1f}m) promotes gravity runoff away from roadway."
        ))

    if drain_cond < 0.5:
        factors.append(RiskFactor(
            factor="Compromised Drainage Status",
            impact="Increases Risk",
            contribution=round(cond_factor, 1),
            detail=f"Stormwater drain status is '{status_str}' causing backflow vulnerability."
        ))
    elif drain_dist < 60.0:
        factors.append(RiskFactor(
            factor="Proximity to Outfall Channel",
            impact="Decreases Risk",
            contribution=-5.0,
            detail=f"Configured demo attribute places this segment {drain_dist:.0f}m from a mapped drainage feature; location and capacity are unverified."
        ))

    if hist_incidents >= 8:
        factors.append(RiskFactor(
            factor="Historical Flood Repetition",
            impact="Increases Risk",
            contribution=round(hist_factor, 1),
            detail=f"The bundled illustrative dataset assigns an incident-count value of {hist_incidents}; this is not a verified incident record."
        ))

    if slope > 3.0:
        factors.append(RiskFactor(
            factor="Natural Terrain Gradient",
            impact="Decreases Risk",
            contribution=-round(slope_relief, 1),
            detail=f"Surface slope of {slope:.1f}° accelerates natural water clearance."
        ))

    return total_risk, factors


def predict_segment_risk(
    road: Dict[str, Any],
    weather: Dict[str, Any],
    custom_rain: float = None,
    custom_3h: float = None,
    drain_status_override: str = None,
    model_choice: str = "hybrid"
) -> Dict[str, Any]:
    """
    Computes calibrated risk score, category, confidence, and natural language explanations.
    Supports Rule-Based, ML Supervised, and Hybrid methods.
    """
    rain_i = custom_rain if custom_rain is not None else float(weather.get("hourly_rate_mm", 0.0))
    rain_3h = custom_3h if custom_3h is not None else float(weather.get("rainfall_cum_3h_mm", 0.0))
    rain_24h = float(weather.get("rainfall_cum_24h_mm", 0.0))
    forecast_1h = float(weather.get("forecast_1h_mm", 0.0))

    # 1. Baseline hydrological engine calculation
    base_risk, base_factors = calculate_baseline_risk(
        road, rain_i, rain_3h, rain_24h, forecast_1h, drain_status_override
    )

    # 2. ML Engine prediction if available
    ml_model, scaler, metrics = _get_ml_artifacts()
    ml_risk = None

    if ml_model is not None and model_choice in ["hybrid", "ml_xgboost"]:
        drainage_map = {"good": 1.0, "adequate": 0.75, "partially_blocked": 0.40, "poor": 0.15}
        status_str = drain_status_override or road.get("drainage_status", "adequate")
        
        feature_vector = np.array([[
            rain_i,
            rain_3h,
            rain_24h,
            forecast_1h,
            road.get("elevation_m", 410.0),
            road.get("slope_deg", 2.0),
            road.get("distance_to_drain_m", 200.0),
            road.get("drainage_capacity_m3s", 15.0),
            drainage_map.get(status_str, 0.7),
            1 if road.get("underpass", False) else 0,
            road.get("historical_incidents_count", 0),
            road.get("soil_runoff_coeff", 0.82)
        ]])

        try:
            if hasattr(ml_model, "predict_proba"):
                model_input = feature_vector
                feature_names = metrics.get("features") if isinstance(metrics, dict) else None
                if feature_names and len(feature_names) == feature_vector.shape[1]:
                    model_input = pd.DataFrame(feature_vector, columns=feature_names)
                prob = ml_model.predict_proba(model_input)[0][1]
                ml_risk = float(prob * 100.0)
        except Exception as e:
            logger.debug("ML predict exception: %s", e)

    # Final combined score
    if model_choice == "baseline_rules" or ml_risk is None:
        final_score = base_risk
        active_model_desc = "Prototype heuristic rainfall / terrain / drainage score"
    elif model_choice == "ml_xgboost":
        final_score = ml_risk
        active_model_desc = f"Synthetic-scenario ML model ({type(ml_model).__name__})"
    else: # hybrid
        final_score = (base_risk * 0.45) + (ml_risk * 0.55)
        active_model_desc = f"Prototype hybrid score (heuristic + synthetic-scenario {type(ml_model).__name__})"

    final_score = round(float(np.clip(final_score, 0.0, 100.0)), 1)

    # Categorization thresholds (per prompt: 0-30 LOW, 30-60 MODERATE, 60-80 HIGH, 80-100 CRITICAL)
    if final_score < 30.0:
        category = "LOW"
        action = "The prototype score is low under the configured inputs. This does not confirm that the road is clear; check current official/local conditions."
    elif final_score < 60.0:
        category = "MODERATE"
        action = "The prototype score indicates moderate relative risk under the configured inputs. Verify local conditions before travel."
    elif final_score < 80.0:
        category = "HIGH"
        action = "The prototype score is elevated. Water depth is not measured or forecast by this model; check official advisories and avoid visibly flooded areas."
    else:
        category = "CRITICAL"
        action = "The prototype score is very high under the configured assumptions. This is not a confirmed inundation warning; follow official emergency and traffic instructions."

    return {
        "segment_id": road.get("segment_id"),
        "road_name": road.get("name"),
        "risk_score": final_score,
        "risk_category": category,
        "confidence": None,
        "model_type": active_model_desc,
        "prediction_horizon": "Current inputs with next-hour forecast context",
        "data_completeness": "Limited prototype data: Open-Meteo when reachable plus illustrative, unverified road/terrain/drainage attributes; synthetic ML training data.",
        "features_used": {
            "rainfall_intensity_mm_h": round(rain_i, 1),
            "rainfall_cum_3h_mm": round(rain_3h, 1),
            "elevation_m": road.get("elevation_m"),
            "slope_deg": road.get("slope_deg"),
            "distance_to_drain_m": road.get("distance_to_drain_m"),
            "underpass": road.get("underpass", False),
            "drainage_status": drain_status_override or road.get("drainage_status")
        },
        "contributing_factors": [f.model_dump() for f in base_factors],
        "recommended_action": action,
        "coordinates": road.get("coordinates")
    }
