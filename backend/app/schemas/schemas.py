from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# Weather Schemas
class WeatherCurrentResponse(BaseModel):
    city: str
    latitude: float
    longitude: float
    current_precipitation_mm: float
    hourly_rate_mm: float
    rainfall_previous_1h_mm: float
    rainfall_cum_3h_mm: float
    rainfall_cum_24h_mm: float
    forecast_1h_mm: float
    forecast_6h_mm: float
    temperature_c: float
    humidity_percent: float
    weather_condition: str
    source: str # "Open-Meteo Live API" or "Cached/Fallback"
    last_updated: str
    is_live: bool

class HourlyWeatherPoint(BaseModel):
    time: str
    precipitation_mm: float
    temperature_c: float

class WeatherForecastResponse(BaseModel):
    city: str
    current: WeatherCurrentResponse
    hourly_forecast: List[HourlyWeatherPoint]

# Road Segment Schemas
class RoadSegmentSchema(BaseModel):
    segment_id: str
    name: str
    road_type: str
    coordinates: List[List[float]]
    length_m: float
    elevation_m: float
    slope_deg: float
    distance_to_drain_m: float
    drainage_status: str
    drainage_capacity_m3s: float
    basin_id: Optional[str] = None
    underpass: bool
    historical_incidents_count: int
    speed_limit_kmh: int
    critical_infrastructure_nearby: Optional[str] = None
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None # LOW, MODERATE, HIGH, CRITICAL

class RiskMapResponse(BaseModel):
    city: str
    total_segments: int
    summary: Dict[str, int] # {"LOW": 14, "MODERATE": 5, "HIGH": 3, "CRITICAL": 2}
    segments: List[Dict[str, Any]]
    weather_context: Dict[str, Any]
    generated_at: str

# Risk Prediction & Explanation Schemas
class PredictRequest(BaseModel):
    segment_id: str
    custom_rainfall_intensity: Optional[float] = None
    custom_rainfall_3h: Optional[float] = None
    custom_drainage_condition: Optional[str] = None # good, adequate, partially_blocked, poor
    model_type: Optional[str] = "hybrid" # "hybrid", "ml_xgboost", "baseline_rules"

class RiskFactor(BaseModel):
    factor: str
    impact: str # "Increases Risk", "Decreases Risk", "Neutral"
    contribution: float # percentage or score delta
    detail: str

class PredictResponse(BaseModel):
    segment_id: str
    road_name: str
    risk_score: float # 0 - 100
    risk_category: str # LOW, MODERATE, HIGH, CRITICAL
    confidence: Optional[float] = None # Not calibrated on observed flood events
    model_type: str
    prediction_horizon: str # "Next 1-3 Hours"
    data_completeness: str # Prototype data provenance and limitations
    features_used: Dict[str, Any]
    contributing_factors: List[RiskFactor]
    recommended_action: str
    timestamp: str

# Simulation Schemas
class SimulationRequest(BaseModel):
    rainfall_scenario_mm: float = Field(..., ge=0.0, le=300.0, description="Hypothetical rainfall amount in mm")
    duration_hours: float = Field(2.0, ge=0.5, le=24.0)
    drainage_blockage_factor: float = Field(0.0, ge=0.0, le=1.0, description="0.0 = Normal, 1.0 = Fully Clogged")
    antecedent_rainfall_mm: float = Field(15.0, ge=0.0, le=200.0)

class SimulationResponse(BaseModel):
    scenario_description: str
    rainfall_intensity_effective: float
    total_segments_analyzed: int
    category_counts_before: Dict[str, int]
    category_counts_after: Dict[str, int]
    escalated_segments: List[Dict[str, Any]]
    segments: List[Dict[str, Any]]
    simulated_at: str

# Citizen Reports
class CitizenReportCreate(BaseModel):
    latitude: float
    longitude: float
    road_name: str
    water_depth: str # Ankle-deep, Knee-deep, Waist-deep, Submerged
    passability: str # Passable, 4x4 Only, Impassable
    description: Optional[str] = None
    image_url: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous Citizen"

class CitizenReportStatusUpdate(BaseModel):
    status: str # pending, verified, rejected, resolved
    admin_notes: Optional[str] = None

class CitizenReportResponse(BaseModel):
    id: int
    report_uid: str
    latitude: float
    longitude: float
    road_name: str
    water_depth: str
    passability: str
    description: Optional[str]
    image_url: Optional[str]
    reporter_name: str
    status: str
    admin_notes: Optional[str]
    created_at: str
    updated_at: str

# Safe Routing
class SafeRouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    avoid_high_risk: bool = True

class SafeRouteResponse(BaseModel):
    route_status: str # "SUCCESS", "NO_ROUTE_FOUND"
    standard_route: Dict[str, Any]
    safe_route: Dict[str, Any]
    segments_avoided: List[Dict[str, Any]]
    risk_reduction_pct: float
    distance_delta_meters: float
    travel_advisory: str

# Analytics
class AnalyticsOverviewResponse(BaseModel):
    monitored_city: str
    total_road_network_km: float
    total_monitored_segments: int
    risk_distribution: Dict[str, int]
    active_incidents: int
    verified_reports_24h: int
    historical_hotspots: List[Dict[str, Any]]
    rainfall_24h_trend: List[Dict[str, Any]]
    system_readiness: str
    last_evaluation: str
