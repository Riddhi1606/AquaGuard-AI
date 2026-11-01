"""
AquaGuard AI — Main FastAPI Application
AI-Powered Hyperlocal Flood Prediction & Smart City Early Warning System
Pilot City: Jaipur, Rajasthan, India
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from backend.app.core.config import settings
from backend.app.api.endpoints import router as api_router
from backend.app.database.init_db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aquaguard")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AquaGuard AI database and geospatial seeds...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", e)
    yield
    logger.info("Shutting down AquaGuard AI services.")

app = FastAPI(
    title="AquaGuard AI — Hyperlocal Flood Prediction System",
    description="""
    ## AI-Powered Hyperlocal Flood Prediction & Smart City Early Warning System
    **Pilot City:** Jaipur, Rajasthan, India
    
    Prototype capabilities:
    1. Open-Meteo current weather fields and hourly forecasts when the external API is reachable
    2. Illustrative bundled road, elevation, slope, and drainage attributes (not authoritative GIS data)
    3. NetworkX route experiments over the bundled illustrative road graph
    4. Synthetic-scenario ML benchmark models and a configurable rule-based risk score
    5. Citizen-submitted reports with pending / admin-reviewed workflow

    This is a hackathon prototype, not an operational flood warning, emergency dispatch,
    verified road-condition, or navigation service. Synthetic model metrics are not
    evidence of real-world flood-prediction accuracy.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
