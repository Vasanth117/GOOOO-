"""
Disease & Pest Risk Forecasting — Rule-Based Risk Scoring Engine

Scientifically defensible rule-based scoring system that evaluates
real-time sensor data + weather API data against known agricultural
disease thresholds.

Research basis:
  - Most fungal crop diseases (blast, blight, rust, wilt) are strongly
    correlated with humidity > 85%, temperature 25-32°C, recent rainfall,
    and high soil moisture.
  - These thresholds are used by ICRISAT, IRRI, and FAO early warning systems.
"""

import logging
from typing import Optional
from app.services.weather_service import get_weather_data

logger = logging.getLogger(__name__)


# ─── CROP → DISEASE MAPPING ─────────────────────────────────────
# Maps common crops to their most relevant diseases under high-risk conditions

CROP_DISEASE_MAP = {
    "rice":       [{"disease": "Rice Blast",          "pathogen": "Magnaporthe oryzae"},
                   {"disease": "Bacterial Leaf Blight","pathogen": "Xanthomonas oryzae"}],
    "tomatoes":   [{"disease": "Late Blight",         "pathogen": "Phytophthora infestans"},
                   {"disease": "Early Blight",        "pathogen": "Alternaria solani"}],
    "tomato":     [{"disease": "Late Blight",         "pathogen": "Phytophthora infestans"},
                   {"disease": "Early Blight",        "pathogen": "Alternaria solani"}],
    "potato":     [{"disease": "Late Blight",         "pathogen": "Phytophthora infestans"},
                   {"disease": "Black Scurf",         "pathogen": "Rhizoctonia solani"}],
    "wheat":      [{"disease": "Wheat Rust",          "pathogen": "Puccinia triticina"},
                   {"disease": "Powdery Mildew",      "pathogen": "Blumeria graminis"}],
    "cotton":     [{"disease": "Grey Mildew",         "pathogen": "Ramularia areola"},
                   {"disease": "Bacterial Blight",    "pathogen": "Xanthomonas citri"}],
    "sugarcane":  [{"disease": "Red Rot",             "pathogen": "Colletotrichum falcatum"},
                   {"disease": "Smut",                "pathogen": "Sporisorium scitamineum"}],
    "maize":      [{"disease": "Northern Leaf Blight", "pathogen": "Exserohilum turcicum"},
                   {"disease": "Maize Rust",           "pathogen": "Puccinia sorghi"}],
    "corn":       [{"disease": "Northern Leaf Blight", "pathogen": "Exserohilum turcicum"},
                   {"disease": "Corn Rust",            "pathogen": "Puccinia sorghi"}],
    "banana":     [{"disease": "Panama Disease",       "pathogen": "Fusarium oxysporum"},
                   {"disease": "Sigatoka Leaf Spot",   "pathogen": "Mycosphaerella fijiensis"}],
    "onion":      [{"disease": "Purple Blotch",        "pathogen": "Alternaria porri"},
                   {"disease": "Downy Mildew",         "pathogen": "Peronospora destructor"}],
    "chili":      [{"disease": "Anthracnose",          "pathogen": "Colletotrichum capsici"},
                   {"disease": "Leaf Curl Virus",      "pathogen": "Begomovirus"}],
    "pepper":     [{"disease": "Anthracnose",          "pathogen": "Colletotrichum capsici"},
                   {"disease": "Phytophthora Blight",  "pathogen": "Phytophthora capsici"}],
    "groundnut":  [{"disease": "Tikka Disease",        "pathogen": "Cercospora personata"},
                   {"disease": "Collar Rot",           "pathogen": "Aspergillus niger"}],
    "mango":      [{"disease": "Anthracnose",          "pathogen": "Colletotrichum gloeosporioides"},
                   {"disease": "Powdery Mildew",       "pathogen": "Oidium mangiferae"}],
    "coconut":    [{"disease": "Bud Rot",              "pathogen": "Phytophthora palmivora"},
                   {"disease": "Leaf Blight",          "pathogen": "Lasiodiplodia theobromae"}],
}

# Default for unknown crops
DEFAULT_DISEASES = [
    {"disease": "Fungal Leaf Spot",    "pathogen": "Multiple fungal pathogens"},
    {"disease": "Root Rot",            "pathogen": "Pythium / Fusarium spp."},
]


# ─── RECOMMENDATION TEMPLATES ───────────────────────────────────

RECOMMENDATIONS = {
    "HIGH": [
        "🚨 Apply copper-based or systemic fungicide as a preventive spray immediately",
        "✂️ Prune dense canopy sections to improve air circulation and reduce leaf wetness",
        "💧 Switch to drip irrigation — avoid overhead watering that wets foliage",
        "🔍 Inspect crops daily for early symptoms (spots, yellowing, wilting)",
        "🧹 Remove and destroy any infected plant debris from the field",
    ],
    "MEDIUM": [
        "⚠️ Monitor crops closely over the next 48 hours for early disease symptoms",
        "🌿 Apply neem oil or bio-fungicide (Trichoderma) as a preventive measure",
        "💨 Ensure adequate plant spacing for better air circulation",
        "📋 Keep a log of any unusual spots, lesions, or discoloration on leaves",
    ],
    "LOW": [
        "✅ Conditions are currently favorable — continue routine monitoring",
        "🌱 Maintain good agricultural practices (crop rotation, clean tools)",
        "📊 Check sensor readings again in 12–24 hours for trend changes",
    ],
}


# ─── CORE RISK SCORING ENGINE ───────────────────────────────────

def calculate_risk_score(
    temperature: float,
    humidity: float,
    soil_moisture: float,
    rain: bool,
    weather_humidity: Optional[float] = None,
    weather_rainfall_mm: Optional[float] = None,
) -> dict:
    """
    Rule-based disease risk scoring engine.

    Scoring matrix (max 100):
      - Humidity > 85%         → +30 points
      - Temperature 25–32°C   → +30 points
      - Rainfall active/recent → +20 points
      - Soil Moisture > 70%    → +20 points

    Returns a dict with score, level, individual factor breakdowns.
    """
    factors = []
    risk_score = 0

    # Use the higher of sensor humidity vs weather API humidity
    effective_humidity = humidity
    if weather_humidity and weather_humidity > humidity:
        effective_humidity = weather_humidity

    # ── Factor 1: Humidity ──
    humidity_points = 0
    if effective_humidity > 85:
        humidity_points = 30
        reason = f"High humidity ({effective_humidity:.0f}%) creates ideal conditions for fungal spore germination"
    elif effective_humidity > 70:
        humidity_points = 15
        reason = f"Moderate humidity ({effective_humidity:.0f}%) — some risk of fungal growth"
    else:
        reason = f"Humidity ({effective_humidity:.0f}%) is within safe range"

    risk_score += humidity_points
    factors.append({
        "name": "Humidity",
        "value": f"{effective_humidity:.0f}%",
        "points": humidity_points,
        "max_points": 30,
        "triggered": humidity_points > 0,
        "reason": reason,
    })

    # ── Factor 2: Temperature ──
    temp_points = 0
    if 25 <= temperature <= 32:
        temp_points = 30
        reason = f"Temperature ({temperature:.1f}°C) is in the 25–32°C pathogen growth sweet spot"
    elif 20 <= temperature < 25 or 32 < temperature <= 35:
        temp_points = 15
        reason = f"Temperature ({temperature:.1f}°C) is moderately favorable for pathogen activity"
    else:
        reason = f"Temperature ({temperature:.1f}°C) is outside the high-risk range"

    risk_score += temp_points
    factors.append({
        "name": "Temperature",
        "value": f"{temperature:.1f}°C",
        "points": temp_points,
        "max_points": 30,
        "triggered": temp_points > 0,
        "reason": reason,
    })

    # ── Factor 3: Rainfall ──
    rain_points = 0
    is_raining = rain
    rainfall_mm = weather_rainfall_mm or 0

    if is_raining or rainfall_mm > 20:
        rain_points = 20
        reason = "Active rainfall increases leaf wetness and spore dispersal across the field"
    elif rainfall_mm > 5:
        rain_points = 10
        reason = f"Light rainfall ({rainfall_mm:.0f}mm) — moderate risk of leaf wetness"
    else:
        reason = "No significant rainfall — leaf surfaces remain dry"

    risk_score += rain_points
    factors.append({
        "name": "Rainfall",
        "value": "Active" if is_raining else f"{rainfall_mm:.0f}mm",
        "points": rain_points,
        "max_points": 20,
        "triggered": rain_points > 0,
        "reason": reason,
    })

    # ── Factor 4: Soil Moisture ──
    soil_points = 0
    if soil_moisture > 70:
        soil_points = 20
        reason = f"High soil moisture ({soil_moisture:.0f}%) promotes root rot and damping-off diseases"
    elif soil_moisture > 50:
        soil_points = 10
        reason = f"Soil moisture ({soil_moisture:.0f}%) slightly elevated — monitor drainage"
    else:
        reason = f"Soil moisture ({soil_moisture:.0f}%) is within optimal range"

    risk_score += soil_points
    factors.append({
        "name": "Soil Moisture",
        "value": f"{soil_moisture:.0f}%",
        "points": soil_points,
        "max_points": 20,
        "triggered": soil_points > 0,
        "reason": reason,
    })

    # ── Determine Risk Level ──
    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": factors,
    }


# ─── CROP-SPECIFIC RISK MAPPING ─────────────────────────────────

def get_crop_risks(crop_types: list, risk_level: str) -> list:
    """Map farmer's crops to specific disease risks based on current risk level."""
    crop_risks = []

    for crop in crop_types:
        crop_key = crop.strip().lower()
        diseases = CROP_DISEASE_MAP.get(crop_key, DEFAULT_DISEASES)

        for disease_info in diseases:
            crop_risks.append({
                "crop": crop.strip(),
                "disease": disease_info["disease"],
                "pathogen": disease_info["pathogen"],
                "severity": risk_level,
            })

    # If no crops configured, still return general warnings
    if not crop_risks:
        for d in DEFAULT_DISEASES:
            crop_risks.append({
                "crop": "General",
                "disease": d["disease"],
                "pathogen": d["pathogen"],
                "severity": risk_level,
            })

    return crop_risks


# ─── FULL ASSESSMENT ORCHESTRATOR ────────────────────────────────

async def assess_disease_risk(
    temperature: float,
    humidity: float,
    soil_moisture: float,
    rain: bool,
    farm_lat: Optional[float] = None,
    farm_lon: Optional[float] = None,
    farm_location_name: Optional[str] = None,
    crop_types: Optional[list] = None,
) -> dict:
    """
    Full disease risk assessment pipeline:
      1. Fetch real-time weather data (rainfall, humidity supplement)
      2. Run rule-based scoring engine
      3. Map to crop-specific diseases
      4. Generate actionable recommendations
    """

    # 1. Supplement with weather API data
    weather_data = {}
    weather_humidity = None
    weather_rainfall_mm = 0.0

    if farm_lat and farm_lon:
        try:
            weather_data = await get_weather_data(
                lat=farm_lat,
                lon=farm_lon,
                location_hint=farm_location_name,
            )
            weather_humidity = weather_data.get("humidity")

            # Extract rainfall from raw OpenWeatherMap response
            raw = weather_data.get("raw", {})
            rain_data = raw.get("rain", {})
            weather_rainfall_mm = rain_data.get("1h", rain_data.get("3h", 0.0))

            # If weather says it's raining, override sensor
            weather_condition = weather_data.get("condition", "").lower()
            if weather_condition in ("rain", "drizzle", "thunderstorm"):
                rain = True

        except Exception as e:
            logger.warning(f"Weather API failed during risk assessment: {e}")

    # 2. Run scoring engine
    result = calculate_risk_score(
        temperature=temperature,
        humidity=humidity,
        soil_moisture=soil_moisture,
        rain=rain,
        weather_humidity=weather_humidity,
        weather_rainfall_mm=weather_rainfall_mm,
    )

    # 3. Crop-specific risk mapping
    crops = crop_types or []
    result["crop_risks"] = get_crop_risks(crops, result["risk_level"])

    # 4. Recommendations
    result["recommendations"] = RECOMMENDATIONS.get(result["risk_level"], RECOMMENDATIONS["LOW"])

    # 5. Include weather context
    result["weather"] = {
        "location": weather_data.get("location_name", farm_location_name or "Unknown"),
        "temp": weather_data.get("temp"),
        "humidity": weather_data.get("humidity"),
        "condition": weather_data.get("condition", "Unknown"),
        "description": weather_data.get("description", ""),
        "wind_speed": weather_data.get("wind_speed"),
    }

    # 6. Sensor input snapshot (for frontend display)
    result["sensor_input"] = {
        "temperature": temperature,
        "humidity": humidity,
        "soil_moisture": soil_moisture,
        "rain": rain,
    }

    logger.info(
        f"Disease risk assessment: score={result['risk_score']}, "
        f"level={result['risk_level']}, crops={[c['crop'] for c in result['crop_risks']]}"
    )

    return result
