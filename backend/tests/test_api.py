"""
AquaGuard AI — Backend API Test Suite
Tests all endpoints using FastAPI TestClient and Pytest.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure root in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app
from backend.app.database.init_db import init_db
from backend.app.core.config import settings
settings.ADMIN_API_KEY = "test-admin-key"

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "AquaGuard AI Engine"
    assert data["pilot_city"] == "Jaipur"

def test_cities_endpoint():
    response = client.get("/api/cities")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) >= 1
    assert cities[0]["name"] == "Jaipur"
    assert cities[0]["is_default"] is True

def test_weather_current():
    response = client.get("/api/weather/current")
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Jaipur"
    assert "current_precipitation_mm" in data
    assert "rainfall_cum_3h_mm" in data

def test_weather_forecast():
    response = client.get("/api/weather/forecast")
    assert response.status_code == 200
    data = response.json()
    assert "hourly_forecast" in data
    assert len(data["hourly_forecast"]) > 0

def test_road_segments():
    response = client.get("/api/map/road-segments")
    assert response.status_code == 200
    segments = response.json()
    assert len(segments) >= 20
    assert any(s["segment_id"] == "JPR-RD-001" for s in segments)

def test_flood_risk_map():
    response = client.get("/api/flood/risk-map")
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Jaipur"
    assert "segments" in data
    assert "summary" in data
    assert "LOW" in data["summary"]
    assert "CRITICAL" in data["summary"]

def test_segment_detail():
    response = client.get("/api/flood/segment/JPR-RD-001")
    assert response.status_code == 200
    data = response.json()
    assert data["segment_id"] == "JPR-RD-001"
    assert "risk_score" in data
    assert "risk_category" in data
    assert "contributing_factors" in data

def test_predict_custom():
    payload = {
        "segment_id": "JPR-RD-001",
        "custom_rainfall_intensity": 55.0,
        "custom_rainfall_3h": 90.0,
        "custom_drainage_condition": "poor",
        "model_type": "hybrid"
    }
    response = client.post("/api/flood/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 60.0
    assert data["risk_category"] in ["HIGH", "CRITICAL"]

def test_simulate_scenario():
    payload = {
        "rainfall_scenario_mm": 60.0,
        "duration_hours": 2.0,
        "drainage_blockage_factor": 0.5,
        "antecedent_rainfall_mm": 30.0
    }
    response = client.post("/api/flood/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "escalated_segments" in data
    assert len(data["escalated_segments"]) > 0

def test_citizen_report_workflow():
    # 1. Submit report
    new_report = {
        "latitude": 26.8920,
        "longitude": 75.7480,
        "road_name": "Purani Chungi Junction",
        "water_depth": "Knee-deep",
        "passability": "4x4 Only",
        "description": "Culvert clogged by urban runoff debris.",
        "reporter_name": "Test Citizen"
    }
    create_res = client.post("/api/reports", json=new_report)
    assert create_res.status_code == 200
    rep_data = create_res.json()
    report_id = rep_data["id"]
    assert rep_data["status"] == "pending"

    # 2. Get list of reports
    list_res = client.get("/api/reports")
    assert list_res.status_code == 200
    reports = list_res.json()
    assert any(r["id"] == report_id for r in reports)

    # 3. Update status (admin verification)
    patch_res = client.patch(
        f"/api/reports/{report_id}/status",
        json={"status": "verified", "admin_notes": "Test-only verification note."},
        headers={"X-Admin-Key": "test-admin-key"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "verified"
    assert "Test-only verification" in patch_res.json()["admin_notes"]

def test_admin_mutation_requires_key():
    response = client.patch(
        "/api/reports/999999/status",
        json={"status": "verified"}
    )
    assert response.status_code == 401


def test_safe_route_calculation():
    # Route from Vaishali Nagar [26.9050, 75.7410] to Malviya Nagar [26.8510, 75.8240]
    payload = {
        "start_lat": 26.9050,
        "start_lon": 75.7410,
        "end_lat": 26.8510,
        "end_lon": 75.8240,
        "avoid_high_risk": True
    }
    response = client.post("/api/routes/safe", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["route_status"] in ["SUCCESS", "NO_ROUTE_FOUND"]
    assert "standard_route" in data
    assert "safe_route" in data
    if data["route_status"] == "NO_ROUTE_FOUND":
        assert data["safe_route"]["coordinates"] == []
        assert "No continuous road path" in data["travel_advisory"]

def test_analytics_overview():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["monitored_city"] == "Jaipur"
    assert data["total_monitored_segments"] >= 20
    assert len(data["historical_hotspots"]) >= 3

def test_ml_metrics():
    response = client.get("/api/ml/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "benchmark_comparison" in data
    assert "global_feature_importance" in data


def test_routing_does_not_invent_connectors():
    from backend.app.services.routing_service import SafeRoutingEngine
    sample_segments = [
        {"segment_id": "A", "name": "Road A", "coordinates": [[26.0, 75.0], [26.001, 75.0]], "length_m": 100, "risk_score": 10},
        {"segment_id": "B", "name": "Road B", "coordinates": [[27.0, 76.0], [27.001, 76.0]], "length_m": 100, "risk_score": 10},
    ]
    engine = SafeRoutingEngine(sample_segments)
    assert engine.graph.number_of_edges() == 2
    result = engine.calculate_routes([26.0, 75.0], [27.0, 76.0])
    assert result["route_status"] == "NO_ROUTE_FOUND"
    assert result["safe_route"]["coordinates"] == []


def test_admin_incidents_requires_key():
    response = client.get("/api/admin/incidents")
    assert response.status_code == 401
    authorized = client.get("/api/admin/incidents", headers={"X-Admin-Key": "test-admin-key"})
    assert authorized.status_code == 200


def test_weather_hour_alignment_and_accumulation():
    from backend.app.services.weather_service import _parse_open_meteo_data
    payload = {
        "current": {
            "time": "2026-10-31T10:00",
            "temperature_2m": 29.0,
            "relative_humidity_2m": 60.0,
            "precipitation": 3.0,
        },
        "hourly": {
            "time": ["2026-10-31T08:00", "2026-10-31T09:00", "2026-10-31T10:00", "2026-10-31T11:00", "2026-10-31T12:00"],
            "precipitation": [1.0, 2.0, 3.0, 4.0, 5.0],
            "temperature_2m": [27.0, 28.0, 29.0, 30.0, 31.0],
        },
    }
    parsed = _parse_open_meteo_data(payload, is_live=True)
    assert parsed.current.rainfall_previous_1h_mm == 2.0
    assert parsed.current.rainfall_cum_3h_mm == 6.0
    assert parsed.current.rainfall_cum_24h_mm == 6.0
    assert parsed.current.forecast_1h_mm == 4.0
    assert parsed.current.forecast_6h_mm == 9.0


def test_routing_rejects_points_far_from_demo_network():
    from backend.app.services.routing_service import SafeRoutingEngine
    sample_segments = [
        {"segment_id": "A", "name": "Road A", "coordinates": [[26.0, 75.0], [26.001, 75.0]], "length_m": 100, "risk_score": 10},
    ]
    engine = SafeRoutingEngine(sample_segments)
    result = engine.calculate_routes([26.0, 75.0], [27.0, 76.0])
    assert result["route_status"] == "POINT_OUTSIDE_DEMO_NETWORK"
    assert result["safe_route"]["coordinates"] == []
    assert "No route was generated" in result["travel_advisory"]
