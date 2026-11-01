"""
AquaGuard AI — Weather & Precipitation Integration Service
Connects to Open-Meteo Global Forecasting API for real-time and forecast rainfall.
Pilot: Jaipur, Rajasthan (26.9124 N, 75.7873 E)

Strict Rules:
- Never label simulated data as live observations.
- Always include last updated timestamp and source provenance.
- Cache results to minimize API requests and withstand network downtime.
"""

import datetime
import logging
from typing import Dict, Any, List, Optional
import httpx

from backend.app.core.config import settings
from backend.app.schemas.schemas import WeatherCurrentResponse, WeatherForecastResponse, HourlyWeatherPoint

logger = logging.getLogger(__name__)

# In-memory cache with TTL (10 minutes)
_WEATHER_CACHE: Optional[Dict[str, Any]] = None
_CACHE_TIMESTAMP: Optional[datetime.datetime] = None
CACHE_TTL_SECONDS = 600

async def get_jaipur_weather(force_refresh: bool = False) -> WeatherForecastResponse:
    global _WEATHER_CACHE, _CACHE_TIMESTAMP

    now = datetime.datetime.now(datetime.timezone.utc)
    if not force_refresh and _WEATHER_CACHE and _CACHE_TIMESTAMP:
        if (now - _CACHE_TIMESTAMP).total_seconds() < CACHE_TTL_SECONDS:
            return _WEATHER_CACHE

    params = {
        "latitude": settings.PILOT_LAT,
        "longitude": settings.PILOT_LON,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "rain", "weather_code"],
        "hourly": ["temperature_2m", "precipitation", "weather_code"],
        "past_days": 1,
        "forecast_days": 2,
        "timezone": "Asia/Kolkata"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                parsed = _parse_open_meteo_data(data, is_live=True)
                _WEATHER_CACHE = parsed
                _CACHE_TIMESTAMP = now
                return parsed
            else:
                logger.warning("Open-Meteo returned status %d. Falling back to cached/demo.", resp.status_code)
    except Exception as e:
        logger.warning("Open-Meteo API unreachable (%s). Using fallback demonstration weather.", e)

    # If cache exists from earlier, preserve its original timestamp but clearly
    # mark it as cached rather than presenting it as a fresh live response.
    if _WEATHER_CACHE:
        cached_current = _WEATHER_CACHE.current.model_copy(update={
            "source": "Cached Open-Meteo data (refresh unavailable)",
            "is_live": False,
            "weather_condition": f"Cached data — {_WEATHER_CACHE.current.weather_condition}",
        })
        return _WEATHER_CACHE.model_copy(update={"current": cached_current})

    # Graceful Fallback with clear disclosure
    fallback = _generate_fallback_weather()
    _WEATHER_CACHE = fallback
    _CACHE_TIMESTAMP = now
    return fallback


def _parse_open_meteo_data(data: Dict[str, Any], is_live: bool = True) -> WeatherForecastResponse:
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    
    precip_current = float(current.get("precipitation", 0.0))
    temp_c = float(current.get("temperature_2m", 28.5))
    humidity = float(current.get("relative_humidity_2m", 62.0))
    
    # Calculate accumulations from hourly list
    precip_hourly = hourly.get("precipitation", [])
    times_hourly = hourly.get("time", [])
    temps_hourly = hourly.get("temperature_2m", [])
    
    # Match the API's local current timestamp to its hourly time array. The
    # old fixed index (24) was wrong for requests made at other local hours.
    current_time = current.get("time")
    idx_now = len(precip_hourly) - 1
    if current_time and times_hourly:
        try:
            current_hour = datetime.datetime.fromisoformat(current_time).replace(minute=0, second=0, microsecond=0)
            parsed_hours = [datetime.datetime.fromisoformat(value) for value in times_hourly]
            eligible = [i for i, value in enumerate(parsed_hours) if value <= current_hour]
            if eligible:
                idx_now = eligible[-1]
            else:
                idx_now = min(range(len(parsed_hours)), key=lambda i: abs((parsed_hours[i] - current_hour).total_seconds()))
        except (TypeError, ValueError):
            logger.warning("Could not align Open-Meteo current.time with hourly timestamps; using final available hour")

    if not precip_hourly:
        precip_hourly = [precip_current]
        times_hourly = [current_time or datetime.datetime.now().isoformat()]
        temps_hourly = [temp_c]
        idx_now = 0

    # Open-Meteo hourly precipitation already contains the current hour. Do
    # not add current.precipitation again (that would double-count it).
    prev_1h = float(precip_hourly[idx_now - 1]) if idx_now > 0 else 0.0
    cum_3h = float(sum(precip_hourly[max(0, idx_now - 2):idx_now + 1]))
    cum_24h = float(sum(precip_hourly[max(0, idx_now - 23):idx_now + 1]))

    # Forecast starts with the next hourly bucket, not the current one.
    forecast_1h = float(precip_hourly[idx_now + 1]) if idx_now + 1 < len(precip_hourly) else 0.0
    forecast_6h = float(sum(precip_hourly[idx_now + 1:min(idx_now + 7, len(precip_hourly))]))
    
    weather_desc = "Clear / Partly Cloudy"
    if precip_current > 15.0 or cum_3h > 35.0:
        weather_desc = "Heavy Monsoon Rain"
    elif precip_current > 2.0 or cum_3h > 10.0:
        weather_desc = "Moderate Rain / Waterlogging Threat"
    elif precip_current > 0.1:
        weather_desc = "Light Rain / Drizzle"

    # 12 hourly forecast points for UI graph
    hourly_points: List[HourlyWeatherPoint] = []
    start_pt = max(0, idx_now - 4)
    end_pt = min(len(precip_hourly), idx_now + 12)
    for i in range(start_pt, end_pt):
        t_raw = times_hourly[i] if i < len(times_hourly) else f"+{i-idx_now}h"
        # Extract time portion HH:MM
        t_str = t_raw.split("T")[-1] if "T" in t_raw else t_raw
        hourly_points.append(HourlyWeatherPoint(
            time=t_str,
            precipitation_mm=round(float(precip_hourly[i]), 2),
            temperature_c=round(float(temps_hourly[i]), 1) if i < len(temps_hourly) else temp_c
        ))

    curr_resp = WeatherCurrentResponse(
        city=settings.PILOT_CITY,
        latitude=settings.PILOT_LAT,
        longitude=settings.PILOT_LON,
        current_precipitation_mm=round(precip_current, 2),
        hourly_rate_mm=round(precip_current, 2),
        rainfall_previous_1h_mm=round(prev_1h, 2),
        rainfall_cum_3h_mm=round(cum_3h, 2),
        rainfall_cum_24h_mm=round(cum_24h, 2),
        forecast_1h_mm=round(forecast_1h, 2),
        forecast_6h_mm=round(forecast_6h, 2),
        temperature_c=round(temp_c, 1),
        humidity_percent=round(humidity, 1),
        weather_condition=weather_desc,
        source="Open-Meteo Live API" if is_live else "Demonstration fallback data",
        last_updated=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        is_live=is_live
    )

    return WeatherForecastResponse(
        city=settings.PILOT_CITY,
        current=curr_resp,
        hourly_forecast=hourly_points
    )


def _generate_fallback_weather() -> WeatherForecastResponse:
    """Provides a realistic Jaipur monsoon demo scenario when internet connection is down."""
    now_hour = datetime.datetime.now().hour
    mock_hourly = []
    for h_offset in range(-4, 12):
        clock_h = (now_hour + h_offset) % 24
        # Simulated monsoon peak in afternoon/evening
        rain_val = 12.5 if 14 <= clock_h <= 18 else (4.2 if 12 <= clock_h <= 20 else 0.4)
        mock_hourly.append(HourlyWeatherPoint(
            time=f"{clock_h:02d}:00",
            precipitation_mm=round(rain_val, 1),
            temperature_c=round(31.0 - (rain_val * 0.3), 1)
        ))

    curr_resp = WeatherCurrentResponse(
        city=settings.PILOT_CITY,
        latitude=settings.PILOT_LAT,
        longitude=settings.PILOT_LON,
        current_precipitation_mm=14.2,
        hourly_rate_mm=14.2,
        rainfall_previous_1h_mm=18.0,
        rainfall_cum_3h_mm=42.5,
        rainfall_cum_24h_mm=68.0,
        forecast_1h_mm=11.0,
        forecast_6h_mm=32.0,
        temperature_c=27.4,
        humidity_percent=88.0,
        weather_condition="Moderate Monsoon Rain (Simulated Fallback)",
        source="Demonstration Weather Profile (Open-Meteo Offline Fallback)",
        last_updated=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        is_live=False
    )

    return WeatherForecastResponse(
        city=settings.PILOT_CITY,
        current=curr_resp,
        hourly_forecast=mock_hourly
    )
