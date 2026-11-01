import datetime

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="citizen", nullable=False) # 'citizen' or 'admin'
    created_at = Column(DateTime, default=utc_now)

    monitored_locations = relationship("MonitoredLocation", back_populates="user")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    road_type = Column(String(50), default="primary")
    coordinates = Column(JSON, nullable=False) # list of [lat, lon]
    length_m = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    slope_deg = Column(Float, nullable=False)
    distance_to_drain_m = Column(Float, nullable=False)
    drainage_status = Column(String(50), default="adequate") # good, adequate, partially_blocked, poor
    drainage_capacity_m3s = Column(Float, default=15.0)
    basin_id = Column(String(100), nullable=True)
    underpass = Column(Boolean, default=False)
    historical_incidents_count = Column(Integer, default=0)
    speed_limit_kmh = Column(Integer, default=50)
    critical_infrastructure_nearby = Column(String(255), nullable=True)
    soil_runoff_coeff = Column(Float, default=0.82)
    is_culvert_present = Column(Boolean, default=False)

    predictions = relationship("Prediction", back_populates="road_segment")
    incidents = relationship("FloodIncident", back_populates="road_segment")


class RainfallRecord(Base):
    __tablename__ = "rainfall_records"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), default="JPR-MET-01")
    timestamp = Column(DateTime, default=utc_now, index=True)
    precipitation_mm = Column(Float, default=0.0)
    hourly_rate_mm = Column(Float, default=0.0)
    cum_3h_mm = Column(Float, default=0.0)
    cum_24h_mm = Column(Float, default=0.0)
    forecast_next_1h = Column(Float, default=0.0)
    forecast_next_6h = Column(Float, default=0.0)
    temperature_c = Column(Float, default=28.0)
    humidity_percent = Column(Float, default=65.0)
    source = Column(String(50), default="Open-Meteo API")
    is_live = Column(Boolean, default=True)


class ElevationRecord(Base):
    __tablename__ = "elevation_records"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(String(50), ForeignKey("road_segments.segment_id"))
    elevation_m = Column(Float, nullable=False)
    slope_percent = Column(Float, nullable=False)
    flow_accumulation = Column(Float, default=100.0)
    depression_flag = Column(Boolean, default=False)


class DrainageFeature(Base):
    __tablename__ = "drainage_features"

    id = Column(Integer, primary_key=True, index=True)
    drain_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    condition = Column(String(50), default="adequate")
    flow_capacity_m3s = Column(Float, default=20.0)
    coordinates = Column(JSON, nullable=False) # [[lat, lon], ...]


class FloodIncident(Base):
    __tablename__ = "flood_incidents"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(String(50), ForeignKey("road_segments.segment_id"))
    incident_date = Column(DateTime, default=utc_now)
    water_depth_cm = Column(Float, default=25.0)
    severity = Column(String(20), default="MODERATE") # LOW, MODERATE, HIGH, CRITICAL
    duration_hours = Column(Float, default=2.5)
    cause = Column(String(255), default="Heavy precipitation and drain overflow")
    verified = Column(Boolean, default=True)

    road_segment = relationship("RoadSegment", back_populates="incidents")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_uid = Column(String(50), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_name = Column(String(255), nullable=False)
    water_depth = Column(String(50), nullable=False) # Ankle-deep, Knee-deep, Waist-deep, Submerged
    passability = Column(String(50), nullable=False) # Passable, 4x4 Only, Impassable
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    reporter_name = Column(String(100), default="Anonymous Citizen")
    status = Column(String(30), default="pending") # pending, verified, rejected, resolved
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(String(50), ForeignKey("road_segments.segment_id"))
    timestamp = Column(DateTime, default=utc_now, index=True)
    risk_score = Column(Float, nullable=False) # 0 - 100
    risk_category = Column(String(20), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    confidence = Column(Float, default=0.88)
    rainfall_input_mm = Column(Float, default=0.0)
    model_version = Column(String(50), default="XGBoost_v1.0")
    contributing_factors = Column(JSON, nullable=True)
    horizon_hours = Column(Integer, default=1)

    road_segment = relationship("RoadSegment", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_uid = Column(String(50), unique=True, index=True, nullable=False)
    segment_id = Column(String(50), nullable=True)
    location_name = Column(String(255), nullable=False)
    risk_level = Column(String(20), nullable=False) # MODERATE, HIGH, CRITICAL
    alert_message = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)


class EmergencyService(Base):
    __tablename__ = "emergency_services"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    service_type = Column(String(50), nullable=False)
    phone = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)


class MonitoredLocation(Base):
    __tablename__ = "monitored_locations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=2.0)
    alert_threshold = Column(String(20), default="HIGH") # MODERATE, HIGH, CRITICAL

    user = relationship("User", back_populates="monitored_locations")


class ModelMetadata(Base):
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    trained_date = Column(DateTime, default=utc_now)
    test_accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    pr_auc = Column(Float, nullable=False)
    features_list = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
