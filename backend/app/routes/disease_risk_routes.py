from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional

from app.middleware.auth_middleware import get_current_user, require_farmer
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.services.disease_risk_service import assess_disease_risk
from app.utils.response_utils import success_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/disease-risk", tags=["Disease Risk Forecasting"])


class DiseaseRiskRequest(BaseModel):
    """Sensor data payload for disease risk assessment."""
    temperature: float = Field(..., description="Temperature in °C from sensor")
    humidity: float = Field(..., description="Humidity % from sensor")
    soil_moisture: float = Field(..., description="Soil moisture % from sensor")
    rain: bool = Field(False, description="Whether rain is currently detected by sensor")


@router.post("/assess", summary="Assess disease & pest risk from sensor data")
async def assess_risk(
    data: DiseaseRiskRequest,
    current_user: User = Depends(require_farmer),
):
    """
    Accepts live sensor readings and returns a rule-based disease risk
    assessment with score, contributing factors, crop-specific warnings,
    and actionable recommendations.
    """
    # Fetch farmer's farm profile for location + crop data
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(current_user.id))

    farm_lat = None
    farm_lon = None
    farm_location_name = None
    crop_types = []

    if farm:
        if farm.location:
            farm_lat = farm.location.latitude
            farm_lon = farm.location.longitude
            farm_location_name = farm.location.name
        crop_types = farm.crop_types or []

    result = await assess_disease_risk(
        temperature=data.temperature,
        humidity=data.humidity,
        soil_moisture=data.soil_moisture,
        rain=data.rain,
        farm_lat=farm_lat,
        farm_lon=farm_lon,
        farm_location_name=farm_location_name,
        crop_types=crop_types,
    )

    return success_response(result, "Disease risk assessment complete")
