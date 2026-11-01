"""
AquaGuard AI — REST API Endpoints Router
Fully documented FastAPI router implementing all Smart City and Citizen services.
"""

import os
import json
import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy.orm import Session
from secrets import compare_digest

from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.models.models import (
    RoadSegment, CitizenReport, Alert, FloodIncident, EmergencyService, ModelMetadata
)
from backend.app.schemas.schemas import (
    WeatherForecastResponse, WeatherCurrentResponse,
    PredictRequest, PredictResponse,
    SimulationRequest, SimulationResponse,
    CitizenReportCreate, CitizenReportResponse, CitizenReportStatusUpdate,
    SafeRouteRequest, SafeRouteResponse,
    AnalyticsOverviewResponse
)
from backend.app.services.weather_service import get_jaipur_weather
from backend.app.services.risk_engine import predict_segment_risk
from backend.app.services.routing_service import SafeRoutingEngine
from gis.road_network.jaipur_roads import (
    JAIPUR_ROAD_SEGMENTS, JAIPUR_METADATA, JAIPUR_DRAINAGE_FEATURES, JAIPUR_EMERGENCY_SERVICES
)

router = APIRouter()


def require_admin_key(x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key")):
    """Protect admin operations with a server-side key; never embed it in the bundle."""
    configured_key = settings.ADMIN_API_KEY
    if not configured_key:
        raise HTTPException(status_code=503, detail="Admin access is disabled until ADMIN_API_KEY is configured on the server.")
    if not x_admin_key or not compare_digest(x_admin_key, configured_key):
        raise HTTPException(status_code=401, detail="A valid X-Admin-Key header is required for this admin operation.")
    return True

@router.get("/health", tags=["System"])
async def health_check(db: Session = Depends(get_db)):
    """Health check validating backend, DB connection, and ML engine status."""
    db_status = "connected"
    try:
        # test DB query
        db.query(RoadSegment).limit(1).all()
    except Exception as e:
        db_status = f"error: {str(e)}"

    ml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml_engine", "saved_models", "flood_model.joblib"))
    ml_ready = os.path.exists(ml_path)

    return {
        "status": "online" if db_status == "connected" else "degraded",
        "service": "AquaGuard AI Engine",
        "version": "1.0.0",
        "database": db_status,
        "ml_engine_ready": ml_ready,
        "pilot_city": JAIPUR_METADATA["city"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


@router.get("/cities", tags=["System"])
async def get_supported_cities():
    """List of supported pilot cities and geographic extents."""
    return [
        {
            "id": "jaipur",
            "name": "Jaipur",
            "state": "Rajasthan",
            "country": "India",
            "is_default": True,
            "center": JAIPUR_METADATA["center"],
            "zoom": JAIPUR_METADATA["default_zoom"],
            "monitored_segments": len(JAIPUR_ROAD_SEGMENTS),
            "status": "Active Pilot"
        },
        {
            "id": "mumbai",
            "name": "Mumbai (Upcoming)",
            "state": "Maharashtra",
            "country": "India",
            "is_default": False,
            "center": [19.0760, 72.8777],
            "zoom": 12,
            "monitored_segments": 0,
            "status": "Data Ingestion Pipeline Ready"
        }
    ]


# --- WEATHER ENDPOINTS ---

@router.get("/weather/current", response_model=WeatherCurrentResponse, tags=["Weather"])
async def get_current_weather():
    """Fetches Open-Meteo current weather fields for Jaipur, or a labelled fallback."""
    weather = await get_jaipur_weather()
    return weather.current


@router.get("/weather/forecast", response_model=WeatherForecastResponse, tags=["Weather"])
async def get_weather_forecast():
    """Fetches hourly precipitation forecast and rainfall accumulation trends."""
    return await get_jaipur_weather()


# --- MAP & GEOSPATIAL ENDPOINTS ---

@router.get("/map/road-segments", tags=["Geospatial"])
async def get_road_segments(db: Session = Depends(get_db)):
    """Returns all monitored street-level road segments with geometries and topographic features."""
    db_segments = db.query(RoadSegment).all()
    if db_segments:
        return [
            {
                "segment_id": s.segment_id,
                "name": s.name,
                "road_type": s.road_type,
                "coordinates": s.coordinates,
                "length_m": s.length_m,
                "elevation_m": s.elevation_m,
                "slope_deg": s.slope_deg,
                "distance_to_drain_m": s.distance_to_drain_m,
                "drainage_status": s.drainage_status,
                "drainage_capacity_m3s": s.drainage_capacity_m3s,
                "basin_id": s.basin_id,
                "underpass": s.underpass,
                "historical_incidents_count": s.historical_incidents_count,
                "speed_limit_kmh": s.speed_limit_kmh,
                "critical_infrastructure_nearby": s.critical_infrastructure_nearby
            }
            for s in db_segments
        ]
    return JAIPUR_ROAD_SEGMENTS


@router.get("/flood/risk-map", tags=["Flood Prediction"])
async def get_live_risk_map(db: Session = Depends(get_db)):
    """
    Computes prototype risk scores for bundled road corridors using current Open-Meteo
    fields when available and illustrative, unverified road / terrain / drainage attributes.
    """
    weather = await get_jaipur_weather()
    weather_dict = weather.current.model_dump()

    # Fetch segments from DB or bundled illustrative demo dataset
    db_segs = db.query(RoadSegment).all()
    segments_source = [
        {
            "segment_id": s.segment_id,
            "name": s.name,
            "road_type": s.road_type,
            "coordinates": s.coordinates,
            "length_m": s.length_m,
            "elevation_m": s.elevation_m,
            "slope_deg": s.slope_deg,
            "distance_to_drain_m": s.distance_to_drain_m,
            "drainage_status": s.drainage_status,
            "drainage_capacity_m3s": s.drainage_capacity_m3s,
            "basin_id": s.basin_id,
            "underpass": s.underpass,
            "historical_incidents_count": s.historical_incidents_count,
            "soil_runoff_coeff": s.soil_runoff_coeff
        }
        for s in db_segs
    ] if db_segs else JAIPUR_ROAD_SEGMENTS

    evaluated_segments = []
    summary_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}

    for road in segments_source:
        res = predict_segment_risk(road, weather_dict, model_choice="hybrid")
        summary_counts[res["risk_category"]] = summary_counts.get(res["risk_category"], 0) + 1
        evaluated_segments.append(res)

    return {
        "city": JAIPUR_METADATA["city"],
        "total_segments": len(evaluated_segments),
        "summary": summary_counts,
        "segments": evaluated_segments,
        "data_quality": "Prototype estimates based on illustrative, unverified road/elevation/drainage attributes; not operational flood warnings.",
        "weather_context": weather_dict,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


@router.get("/flood/segment/{segment_id}", tags=["Flood Prediction"])
async def get_segment_details(segment_id: str, db: Session = Depends(get_db)):
    """Retrieves in-depth hydrological details, risk factor breakdown, and recommendations for a single segment."""
    weather = await get_jaipur_weather()
    weather_dict = weather.current.model_dump()

    road = next((r for r in JAIPUR_ROAD_SEGMENTS if r["segment_id"] == segment_id), None)
    if not road:
        # Check DB
        db_road = db.query(RoadSegment).filter(RoadSegment.segment_id == segment_id).first()
        if db_road:
            road = {
                "segment_id": db_road.segment_id,
                "name": db_road.name,
                "road_type": db_road.road_type,
                "coordinates": db_road.coordinates,
                "length_m": db_road.length_m,
                "elevation_m": db_road.elevation_m,
                "slope_deg": db_road.slope_deg,
                "distance_to_drain_m": db_road.distance_to_drain_m,
                "drainage_status": db_road.drainage_status,
                "drainage_capacity_m3s": db_road.drainage_capacity_m3s,
                "basin_id": db_road.basin_id,
                "underpass": db_road.underpass,
                "historical_incidents_count": db_road.historical_incidents_count,
                "soil_runoff_coeff": db_road.soil_runoff_coeff,
                "critical_infrastructure_nearby": db_road.critical_infrastructure_nearby
            }
        else:
            raise HTTPException(status_code=404, detail=f"Road segment '{segment_id}' not found.")

    prediction = predict_segment_risk(road, weather_dict, model_choice="hybrid")
    return prediction


@router.post("/flood/predict", tags=["Flood Prediction"])
async def custom_predict_segment(req: PredictRequest):
    """
    Predicts waterlogging risk for a road segment with custom rainfall or drainage scenario parameters.
    Allows toggling between Baseline Hydrological Formulation and Supervised Machine Learning.
    """
    road = next((r for r in JAIPUR_ROAD_SEGMENTS if r["segment_id"] == req.segment_id), None)
    if not road:
        raise HTTPException(status_code=404, detail=f"Segment ID {req.segment_id} not found.")

    weather = await get_jaipur_weather()
    weather_dict = weather.current.model_dump()

    res = predict_segment_risk(
        road,
        weather_dict,
        custom_rain=req.custom_rainfall_intensity,
        custom_3h=req.custom_rainfall_3h,
        drain_status_override=req.custom_drainage_condition,
        model_choice=req.model_type or "hybrid"
    )
    return res


@router.post("/flood/simulate", response_model=SimulationResponse, tags=["Scenario Simulator"])
async def simulate_rainfall_scenario(req: SimulationRequest):
    """
    Digital Twin Rainfall Scenario Simulator.
    Calculates citywide flood risk under hypothetical conditions (e.g., 20mm, 40mm, 60mm, 100mm cloudburst).
    """
    effective_intensity = req.rainfall_scenario_mm / req.duration_hours
    effective_3h = min(req.rainfall_scenario_mm, effective_intensity * 3.0)

    weather_baseline = {
        "hourly_rate_mm": 0.0,
        "rainfall_cum_3h_mm": 0.0,
        "rainfall_cum_24h_mm": 5.0,
        "forecast_1h_mm": 0.0
    }

    # Baseline dry counts
    before_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    for road in JAIPUR_ROAD_SEGMENTS:
        b_res = predict_segment_risk(road, weather_baseline, model_choice="hybrid")
        before_counts[b_res["risk_category"]] = before_counts.get(b_res["risk_category"], 0) + 1

    # Simulated condition
    after_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    escalated = []
    simulated_segments = []

    for road in JAIPUR_ROAD_SEGMENTS:
        # Apply simulated drainage blockage if requested
        drain_status = road.get("drainage_status", "adequate")
        if req.drainage_blockage_factor > 0.6:
            drain_status = "poor"
        elif req.drainage_blockage_factor > 0.3:
            drain_status = "partially_blocked"

        sim_res = predict_segment_risk(
            road,
            weather={
                "hourly_rate_mm": effective_intensity,
                "rainfall_cum_3h_mm": effective_3h,
                "rainfall_cum_24h_mm": req.antecedent_rainfall_mm,
                "forecast_1h_mm": effective_intensity * 0.8
            },
            drain_status_override=drain_status,
            model_choice="hybrid"
        )

        after_counts[sim_res["risk_category"]] = after_counts.get(sim_res["risk_category"], 0) + 1
        simulated_segments.append(sim_res)

        if sim_res["risk_category"] in ["HIGH", "CRITICAL"]:
            escalated.append({
                "segment_id": sim_res["segment_id"],
                "road_name": sim_res["road_name"],
                "risk_score": sim_res["risk_score"],
                "risk_category": sim_res["risk_category"],
                "primary_cause": sim_res["contributing_factors"][0]["factor"] if sim_res["contributing_factors"] else "Heavy Precipitation"
            })

    # Sort escalated by risk score descending
    escalated.sort(key=lambda x: x["risk_score"], reverse=True)

    desc = f"Hypothetical Scenario: {req.rainfall_scenario_mm} mm over {req.duration_hours}h ({effective_intensity:.1f} mm/h)"
    if req.drainage_blockage_factor > 0:
        desc += f" with {int(req.drainage_blockage_factor * 100)}% drainage blockage"

    return SimulationResponse(
        scenario_description=desc,
        rainfall_intensity_effective=round(effective_intensity, 1),
        total_segments_analyzed=len(JAIPUR_ROAD_SEGMENTS),
        category_counts_before=before_counts,
        category_counts_after=after_counts,
        escalated_segments=escalated,
        segments=simulated_segments,
        simulated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )


# --- CITIZEN REPORTS ---

@router.post("/reports", response_model=CitizenReportResponse, tags=["Citizen Reports"])
async def submit_citizen_report(report: CitizenReportCreate, db: Session = Depends(get_db)):
    """Submits a citizen waterlogging report with location, depth, passability, and optional image."""
    report_uid = f"REP-JPR-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.datetime.now(datetime.timezone.utc)

    db_report = CitizenReport(
        report_uid=report_uid,
        latitude=report.latitude,
        longitude=report.longitude,
        road_name=report.road_name,
        water_depth=report.water_depth,
        passability=report.passability,
        description=report.description,
        image_url=report.image_url,
        reporter_name=report.reporter_name or "Anonymous Citizen",
        status="pending",
        created_at=now,
        updated_at=now
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return CitizenReportResponse(
        id=db_report.id,
        report_uid=db_report.report_uid,
        latitude=db_report.latitude,
        longitude=db_report.longitude,
        road_name=db_report.road_name,
        water_depth=db_report.water_depth,
        passability=db_report.passability,
        description=db_report.description,
        image_url=db_report.image_url,
        reporter_name=db_report.reporter_name,
        status=db_report.status,
        admin_notes=db_report.admin_notes,
        created_at=db_report.created_at.isoformat(),
        updated_at=db_report.updated_at.isoformat()
    )


@router.get("/reports", response_model=List[CitizenReportResponse], tags=["Citizen Reports"])
async def get_citizen_reports(
    status_filter: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieves all citizen waterlogging reports with optional status filtering."""
    query = db.query(CitizenReport)
    if status_filter:
        query = query.filter(CitizenReport.status == status_filter)
    
    reports = query.order_by(CitizenReport.created_at.desc()).limit(limit).all()
    return [
        CitizenReportResponse(
            id=r.id,
            report_uid=r.report_uid,
            latitude=r.latitude,
            longitude=r.longitude,
            road_name=r.road_name,
            water_depth=r.water_depth,
            passability=r.passability,
            description=r.description,
            image_url=r.image_url,
            reporter_name=r.reporter_name,
            status=r.status,
            admin_notes=r.admin_notes,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat()
        )
        for r in reports
    ]


@router.patch("/reports/{report_id}/status", response_model=CitizenReportResponse, tags=["Citizen Reports"])
async def update_report_status(
    report_id: int,
    update: CitizenReportStatusUpdate,
    db: Session = Depends(get_db),
    _admin: bool = Depends(require_admin_key)
):
    """Admin endpoint to verify, reject, or resolve a citizen report and add triage notes."""
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if update.status not in ["pending", "verified", "rejected", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    report.status = update.status
    if update.admin_notes:
        report.admin_notes = update.admin_notes
    report.updated_at = datetime.datetime.now(datetime.timezone.utc)
    
    db.commit()
    db.refresh(report)

    return CitizenReportResponse(
        id=report.id,
        report_uid=report.report_uid,
        latitude=report.latitude,
        longitude=report.longitude,
        road_name=report.road_name,
        water_depth=report.water_depth,
        passability=report.passability,
        description=report.description,
        image_url=report.image_url,
        reporter_name=report.reporter_name,
        status=report.status,
        admin_notes=report.admin_notes,
        created_at=report.created_at.isoformat(),
        updated_at=report.updated_at.isoformat()
    )


# --- ROUTING ENDPOINT ---

@router.post("/routes/safe", response_model=SafeRouteResponse, tags=["Safe Routing"])
async def calculate_safe_route(req: SafeRouteRequest):
    """
    Computes standard shortest route and flood-risk-aware safe alternative route across Jaipur,
    identifying avoided high-risk segments and risk reduction percentage.
    """
    weather = await get_jaipur_weather()
    weather_dict = weather.current.model_dump()

    # Pre-evaluate segments with risk scores
    scored_segments = []
    for road in JAIPUR_ROAD_SEGMENTS:
        r_copy = dict(road)
        p = predict_segment_risk(road, weather_dict)
        r_copy["risk_score"] = p["risk_score"]
        scored_segments.append(r_copy)

    engine = SafeRoutingEngine(scored_segments)
    route_result = engine.calculate_routes(
        [req.start_lat, req.start_lon],
        [req.end_lat, req.end_lon]
    )

    return route_result


# --- ALERTS & EMERGENCY ---

@router.get("/alerts", tags=["Alerts"])
async def get_active_alerts(db: Session = Depends(get_db)):
    """Returns active hyperlocal early warnings and citizen flood advisories."""
    alerts = db.query(Alert).filter(Alert.is_active == True).order_by(Alert.created_at.desc()).all()
    if alerts:
        return [
            {
                "id": a.id,
                "alert_uid": a.alert_uid,
                "segment_id": a.segment_id,
                "location_name": a.location_name,
                "risk_level": a.risk_level,
                "alert_message": a.alert_message,
                "reason": a.reason,
                "suggested_action": a.suggested_action,
                "created_at": a.created_at.isoformat(),
                "is_demo": a.alert_uid.startswith("DEMO-")
            }
            for a in alerts
        ]

    # Clearly marked demo alerts only; these are not verified live incidents.
    return [
        {
            "id": 1,
            "is_demo": True,
            "alert_uid": "DEMO-ALT-JPR-001",
            "segment_id": "JPR-RD-001",
            "location_name": "Sodala Underpass",
            "risk_level": "CRITICAL",
            "alert_message": "DEMO ALERT: Illustrative high waterlogging risk scenario at Sodala Underpass.",
            "reason": "Illustrative scenario based on unverified demo attributes; not a confirmed incident.",
            "suggested_action": "Demonstration advisory only. Check official traffic and emergency instructions.",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        {
            "id": 2,
            "is_demo": True,
            "alert_uid": "DEMO-ALT-JPR-002",
            "segment_id": "JPR-RD-005",
            "location_name": "Sikar Road (Dadi Ka Phatak)",
            "risk_level": "HIGH",
            "alert_message": "DEMO ALERT: Illustrative drainage scenario near railway crossing; not a live warning.",
            "reason": "DEMO ONLY: drainage capacity values are unverified.",
            "suggested_action": "Do not rely on this demo alert. Follow official traffic and emergency instructions.",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    ]


@router.get("/emergency-services", tags=["Emergency"])
async def get_emergency_services(db: Session = Depends(get_db)):
    """Returns municipal emergency services, SDRF centers, trauma hospitals, and fire stations in Jaipur."""
    services = db.query(EmergencyService).filter(EmergencyService.is_active == True).all()
    if services:
        return [
            {
                "id": s.service_id,
                "name": s.name,
                "service_type": s.service_type,
                "phone": s.phone,
                "coordinates": [s.latitude, s.longitude],
                "address": s.address,
                "is_demo": True,
                "verification_note": "Bundled contact details and coordinates are unverified placeholders. Confirm with official sources before relying on them."
            }
            for s in services
        ]
    return [
        {
            **service,
            "is_demo": True,
            "verification_note": "Bundled contact details and coordinates are unverified placeholders. Confirm with official sources before relying on them."
        }
        for service in JAIPUR_EMERGENCY_SERVICES
    ]


# --- ANALYTICS & ADMIN ---

@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse, tags=["Analytics"])
async def get_analytics_overview(db: Session = Depends(get_db)):
    """Municipal analytics overview with KPI metrics, historical hotspots, and rainfall trends."""
    total_km = sum(r["length_m"] for r in JAIPUR_ROAD_SEGMENTS) / 1000.0
    weather = await get_jaipur_weather()
    weather_dict = weather.current.model_dump()

    summary_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    for road in JAIPUR_ROAD_SEGMENTS:
        res = predict_segment_risk(road, weather_dict)
        summary_counts[res["risk_category"]] = summary_counts.get(res["risk_category"], 0) + 1

    active_reports_count = db.query(CitizenReport).filter(CitizenReport.status.in_(["pending", "verified"])).count()
    verified_24h_count = db.query(CitizenReport).filter(CitizenReport.status == "verified").count()

    # Hotspot rankings based on documented historical incidents
    hotspots = [
        {
            "rank": 1,
            "segment_id": "JPR-RD-005",
            "name": "Sikar Road (Dadi Ka Phatak)",
            "historical_incidents": 18,
            "vulnerability_index": "Severe (Underpass + Inadequate Drain)"
        },
        {
            "rank": 2,
            "segment_id": "JPR-RD-016",
            "name": "Sanganer Bridge & Airport Peripheral",
            "historical_incidents": 17,
            "vulnerability_index": "Severe (Low Elevation Basin)"
        },
        {
            "rank": 3,
            "segment_id": "JPR-RD-004",
            "name": "Amer Road (Jal Mahal Promenade)",
            "historical_incidents": 16,
            "vulnerability_index": "High (Nahargarh Hill Runoff)"
        },
        {
            "rank": 4,
            "segment_id": "JPR-RD-011",
            "name": "Gopalpura Bypass (Triveni Nagar)",
            "historical_incidents": 15,
            "vulnerability_index": "High (Canal Outfall Chokepoint)"
        },
        {
            "rank": 5,
            "segment_id": "JPR-RD-001",
            "name": "Sodala Underpass Corridor",
            "historical_incidents": 14,
            "vulnerability_index": "High (Sub-grade Enclosure)"
        }
    ]

    # 24h rainfall trend points
    trend = [
        {"hour": "00:00", "rainfall_mm": 0.0},
        {"hour": "04:00", "rainfall_mm": 1.2},
        {"hour": "08:00", "rainfall_mm": 4.5},
        {"hour": "12:00", "rainfall_mm": 18.0},
        {"hour": "16:00", "rainfall_mm": 24.5},
        {"hour": "20:00", "rainfall_mm": 11.0},
        {"hour": "Now", "rainfall_mm": weather_dict.get("hourly_rate_mm", 0.0)}
    ]

    return AnalyticsOverviewResponse(
        monitored_city=JAIPUR_METADATA["city"],
        total_road_network_km=round(total_km, 1),
        total_monitored_segments=len(JAIPUR_ROAD_SEGMENTS),
        risk_distribution=summary_counts,
        active_incidents=active_reports_count,
        verified_reports_24h=verified_24h_count,
        historical_hotspots=hotspots,
        rainfall_24h_trend=trend,
        system_readiness="Prototype readiness: live Open-Meteo API when reachable; bundled illustrative GIS attributes require verification",
        last_evaluation=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    )


@router.get("/admin/incidents", tags=["Admin"])
async def get_admin_prioritized_incidents(db: Session = Depends(get_db), _admin: bool = Depends(require_admin_key)):
    """
    Control room dispatch queue ranking citizen reports and high-risk segments
    by emergency priority (water depth, passability, critical infrastructure proximity).
    """
    reports = db.query(CitizenReport).order_by(CitizenReport.created_at.desc()).limit(20).all()
    prioritized = []

    for r in reports:
        # Calculate priority score
        depth_weights = {"Submerged": 50, "Waist-deep": 40, "Knee-deep": 25, "Ankle-deep": 10}
        pass_weights = {"Impassable": 40, "4x4 Only": 25, "Passable": 5}
        
        p_score = depth_weights.get(r.water_depth, 15) + pass_weights.get(r.passability, 10)
        if r.status == "verified":
            p_score += 15

        tier = "P1 - CRITICAL" if p_score >= 80 else ("P2 - HIGH" if p_score >= 50 else "P3 - MODERATE")

        prioritized.append({
            "id": r.id,
            "report_uid": r.report_uid,
            "road_name": r.road_name,
            "water_depth": r.water_depth,
            "passability": r.passability,
            "reporter_name": r.reporter_name,
            "status": r.status,
            "priority_score": p_score,
            "priority_tier": tier,
            "created_at": r.created_at.isoformat(),
            "coordinates": [r.latitude, r.longitude]
        })

    # Sort by priority score descending
    prioritized.sort(key=lambda x: x["priority_score"], reverse=True)
    return prioritized


@router.get("/ml/metrics", tags=["AI/ML"])
async def get_ml_metrics():
    """Returns model benchmark metrics; bundled metrics are from synthetic scenarios, not field validation."""
    metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml_engine", "saved_models", "metrics.json"))
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "status": "pending_training",
        "message": "Run ml_engine/training/train_models.py to compute full evaluation metrics."
    }
