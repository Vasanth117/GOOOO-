import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_geo_cache = {}

async def _resolve_location_name(lat: float, lon: float, client: httpx.AsyncClient) -> str:
    """Reverse geocodes coordinates to a human-friendly village or town name."""
    cache_key = (round(lat, 3), round(lon, 3))
    if cache_key in _geo_cache:
        return _geo_cache[cache_key]
    
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        headers = {"User-Agent": "GooAgriculturalPlatform/1.0"}
        params = {"lat": lat, "lon": lon, "format": "json"}
        r = await client.get(url, params=params, headers=headers, timeout=5.0)
        if r.status_code == 200:
            addr = r.json().get("address", {})
            name = (
                addr.get("village")
                or addr.get("town")
                or addr.get("suburb")
                or addr.get("city")
                or addr.get("county")
                or addr.get("state_district")
            )
            if name:
                _geo_cache[cache_key] = name
                return name
    except Exception as e:
        logger.warning(f"Reverse geocode failed for ({lat}, {lon}): {e}")
    return "Your Farm"

async def get_weather_data(lat: float, lon: float, location_hint: str = None) -> dict:
    """Fetch current weather and resolved village/city name."""
    if not settings.WEATHER_API_KEY:
        logger.warning("WEATHER_API_KEY not set. Returning dummy data.")
        return _get_dummy_weather(location_hint)

    try:
        async with httpx.AsyncClient() as client:
            # 1. Fetch current weather from OpenWeatherMap
            params = {
                "lat": lat,
                "lon": lon,
                "appid": settings.WEATHER_API_KEY,
                "units": "metric"
            }
            resp = await client.get(f"{settings.WEATHER_API_URL}/weather", params=params, timeout=10.0)
            resp.raise_for_status()
            current = resp.json()

            # 2. Resolve true farm location name
            resolved_location = location_hint
            if not resolved_location:
                resolved_location = await _resolve_location_name(lat, lon, client)
            if not resolved_location:
                resolved_location = current.get("name", "Your Farm")

            return {
                "location_name": resolved_location,
                "weather_station": current.get("name"),
                "temp": current["main"]["temp"],
                "humidity": current["main"]["humidity"],
                "condition": current["weather"][0]["main"],
                "description": current["weather"][0]["description"],
                "wind_speed": current["wind"]["speed"],
                "raw": current
            }
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        return _get_dummy_weather(location_hint)

def _get_dummy_weather(location_hint: str = None):
    return {
        "location_name": location_hint or "Kondampatty",
        "weather_station": "Local Station",
        "temp": 25.0,
        "humidity": 60,
        "condition": "Clear",
        "description": "clear sky",
        "wind_speed": 3.4,
        "is_dummy": True
    }
