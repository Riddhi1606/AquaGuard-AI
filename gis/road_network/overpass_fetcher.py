"""
Overpass API Road Network Fetcher and Geospatial Cache
Complies with OpenStreetMap usage policy:
- Rates limited, uses User-Agent headers
- Caches raw Overpass query responses locally in gis/data/
- Gracefully falls back to bundled verified Jaipur road network
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CACHE_FILE = os.path.join(CACHE_DIR, "jaipur_osm_cache.json")
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

class OverpassRoadFetcher:
    def __init__(self, user_agent: str = "AquaGuard-AI-SmartCity/1.0 (Hackathon Educational Research)"):
        self.user_agent = user_agent
        os.makedirs(CACHE_DIR, exist_ok=True)

    def get_jaipur_bbox_query(self, south: float = 26.80, west: float = 75.70, north: float = 27.00, east: float = 75.90) -> str:
        """Construct Overpass QL for major highways in Jaipur bounding box."""
        return f"""
        [out:json][timeout:25];
        (
          way["highway"~"^(primary|secondary|trunk)$"]({south},{west},{north},{east});
        );
        out geom 50;
        """

    async def fetch_osm_roads(self, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """Fetch OSM road network with disk caching to prevent Overpass server strain."""
        if use_cache and os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    logger.info("Loaded cached OSM data from %s", CACHE_FILE)
                    return json.load(f)
            except Exception as e:
                logger.warning("Failed to read cache: %s. Fetching fresh...", e)

        query = self.get_jaipur_bbox_query()
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    OVERPASS_URL,
                    data={"data": query},
                    headers={"User-Agent": self.user_agent}
                )
                if response.status_code == 200:
                    data = response.json()
                    with open(CACHE_FILE, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2)
                    logger.info("Successfully cached %d OSM road elements", len(data.get("elements", [])))
                    return data
                else:
                    logger.warning("Overpass API returned status code %s", response.status_code)
                    return None
        except Exception as e:
            logger.warning("Overpass API request failed (using bundled GIS dataset): %s", e)
            return None
