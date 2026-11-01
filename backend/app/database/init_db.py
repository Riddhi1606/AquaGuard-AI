"""
AquaGuard AI — Database Initialization & Seed Script
Creates all tables and seeds the database with Jaipur road network segments,
emergency services, drainage channels, and initial clearly labelled demonstration reports.
"""

import sys
import os
import datetime

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from backend.app.database.session import engine, Base, SessionLocal
from backend.app.models.models import (
    User, RoadSegment, DrainageFeature, EmergencyService, CitizenReport, Alert
)
from gis.road_network.jaipur_roads import (
    JAIPUR_ROAD_SEGMENTS, JAIPUR_DRAINAGE_FEATURES, JAIPUR_EMERGENCY_SERVICES
)

def init_db():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Default Admin & Operator Users if not present
        if db.query(User).count() == 0:
            print("Seeding admin user...")
            admin = User(
                username="admin",
                email="controlroom@jaipurmc.gov.in",
                hashed_password="hashed_demo_admin_pw",
                role="admin"
            )
            citizen = User(
                username="citizen_demo",
                email="resident@jaipur.org",
                hashed_password="hashed_demo_citizen_pw",
                role="citizen"
            )
            db.add_all([admin, citizen])
            db.commit()

        # 2. Seed Road Segments if empty
        if db.query(RoadSegment).count() == 0:
            print(f"Seeding {len(JAIPUR_ROAD_SEGMENTS)} Jaipur road network segments...")
            for s in JAIPUR_ROAD_SEGMENTS:
                seg = RoadSegment(
                    segment_id=s["segment_id"],
                    name=s["name"],
                    road_type=s["road_type"],
                    coordinates=s["coordinates"],
                    length_m=s["length_m"],
                    elevation_m=s["elevation_m"],
                    slope_deg=s["slope_deg"],
                    distance_to_drain_m=s["distance_to_drain_m"],
                    drainage_status=s["drainage_status"],
                    drainage_capacity_m3s=s["drainage_capacity_m3s"],
                    basin_id=s.get("basin_id"),
                    underpass=s["underpass"],
                    historical_incidents_count=s["historical_incidents_count"],
                    speed_limit_kmh=s["speed_limit_kmh"],
                    critical_infrastructure_nearby=s.get("critical_infrastructure_nearby"),
                    soil_runoff_coeff=s.get("soil_runoff_coeff", 0.82),
                    is_culvert_present=s.get("is_culvert_present", False)
                )
                db.add(seg)
            db.commit()

        # 3. Seed Drainage Features
        if db.query(DrainageFeature).count() == 0:
            print("Seeding Jaipur drainage features...")
            for d in JAIPUR_DRAINAGE_FEATURES:
                drain = DrainageFeature(
                    drain_id=d["drain_id"],
                    name=d["name"],
                    type=d["type"],
                    condition=d["condition"],
                    flow_capacity_m3s=d["flow_capacity_m3s"],
                    coordinates=d["coordinates"]
                )
                db.add(drain)
            db.commit()

        # 4. Seed Emergency Services
        if db.query(EmergencyService).count() == 0:
            print("Seeding Jaipur emergency services...")
            for e in JAIPUR_EMERGENCY_SERVICES:
                svc = EmergencyService(
                    service_id=e["id"],
                    name=e["name"],
                    service_type=e["service_type"],
                    phone=e["phone"],
                    latitude=e["coordinates"][0],
                    longitude=e["coordinates"][1],
                    address=e["address"],
                    is_active=True
                )
                db.add(svc)
            db.commit()

        # 5. Seed Initial Citizen Reports for Demonstration
        if db.query(CitizenReport).count() == 0:
            print("Seeding clearly labelled DEMO citizen reports (not real incidents)...")
            now = datetime.datetime.now(datetime.timezone.utc)
            r1 = CitizenReport(
                report_uid="DEMO-REP-JPR-A101",
                latitude=26.9042,
                longitude=75.7780,
                road_name="Sodala Underpass Approach",
                water_depth="Knee-deep",
                passability="4x4 Only",
                description="DEMO ONLY — fictional sample report for interface testing. Not a real incident.",
                image_url=None,
                reporter_name="Demo Citizen 1",
                status="pending",
                admin_notes="DEMO ONLY — no real verification or dispatch occurred.",
                created_at=now - datetime.timedelta(minutes=45),
                updated_at=now - datetime.timedelta(minutes=15)
            )
            r2 = CitizenReport(
                report_uid="DEMO-REP-JPR-A102",
                latitude=26.9590,
                longitude=75.7640,
                road_name="Sikar Road near Dadi Ka Phatak",
                water_depth="Waist-deep",
                passability="Impassable",
                description="DEMO ONLY — fictional sample report for interface testing. Not a real incident.",
                image_url=None,
                reporter_name="Demo Citizen 2",
                status="pending",
                admin_notes="DEMO ONLY — illustrative triage note, not a real dispatch.",
                created_at=now - datetime.timedelta(minutes=20),
                updated_at=now - datetime.timedelta(minutes=20)
            )
            r3 = CitizenReport(
                report_uid="DEMO-REP-JPR-A103",
                latitude=26.8620,
                longitude=75.8090,
                road_name="JLN Marg (WTP Underpass)",
                water_depth="Ankle-deep",
                passability="Passable",
                description="DEMO ONLY — fictional sample report for interface testing. Not a real incident.",
                image_url=None,
                reporter_name="Demo Citizen 3",
                status="pending",
                admin_notes="DEMO ONLY — no real resolution occurred.",
                created_at=now - datetime.timedelta(hours=2),
                updated_at=now - datetime.timedelta(minutes=30)
            )
            db.add_all([r1, r2, r3])
            db.commit()

        # 6. Seed Alerts
        if db.query(Alert).count() == 0:
            print("Seeding clearly labelled DEMO flood alerts (not live warnings)...")
            now = datetime.datetime.now(datetime.timezone.utc)
            a1 = Alert(
                alert_uid="DEMO-ALT-JPR-001",
                segment_id="JPR-RD-001",
                location_name="Sodala Underpass Corridor",
                risk_level="CRITICAL",
                alert_message="DEMO ALERT — illustrative waterlogging scenario at Sodala Underpass; not a live warning.",
                reason="DEMO ONLY — based on illustrative, unverified attributes.",
                suggested_action="Do not rely on this demo alert. Follow official traffic and emergency instructions.",
                is_active=True,
                created_at=now - datetime.timedelta(minutes=35)
            )
            a2 = Alert(
                alert_uid="DEMO-ALT-JPR-002",
                segment_id="JPR-RD-005",
                location_name="Sikar Road (Dadi Ka Phatak)",
                risk_level="HIGH",
                alert_message="DEMO ALERT — illustrative drainage scenario near railway crossing; not a live warning.",
                reason="DEMO ONLY — drainage capacity values are unverified.",
                suggested_action="Do not rely on this demo alert. Follow official traffic and emergency instructions.",
                is_active=True,
                created_at=now - datetime.timedelta(minutes=15)
            )
            db.add_all([a1, a2])
            db.commit()

        print("Database initialized and seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during database initialization: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
