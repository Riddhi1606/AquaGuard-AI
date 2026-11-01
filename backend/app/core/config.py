import os
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AquaGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./aquaguard.db"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-only-change-me-before-deployment")
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Pilot City Configuration
    PILOT_CITY: str = "Jaipur"
    PILOT_STATE: str = "Rajasthan"
    PILOT_LAT: float = 26.9124
    PILOT_LON: float = 75.7873
    
    # External APIs
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    model_config = ConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()


