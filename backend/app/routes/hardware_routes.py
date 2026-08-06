from fastapi import APIRouter, HTTPException
from app.schemas.sensor_data import SensorPayload
from app.models.sensor_data import SensorData
from app.models.farm_profile import FarmProfile
from datetime import datetime
import asyncio
from app.websocket import manager

router = APIRouter(tags=["Hardware IoT"])

HARDWARE_SECRET = "GOO_HARDWARE_SECRET"

@router.post("/hardware/telemetry")
async def receive_telemetry(payload: SensorPayload):
    # Security check so only your hardware can submit data
    if payload.secret_key != HARDWARE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized hardware")
        
    from pydantic import ValidationError
    
    try:
        farm = await FarmProfile.get(payload.farm_profile_id)
    except (ValueError, ValidationError):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid farm_profile_id: '{payload.farm_profile_id}'. Did you forget to replace 'REPLACE_WITH_YOUR_FARM_PROFILE_ID' in the Arduino code?"
        )
        
        
    if not farm and payload.farm_profile_id != "000000000000000000000000":
        raise HTTPException(status_code=404, detail="Farm profile not found")

    # Create new sensor data record
    sensor_record = SensorData(
        farm_profile_id=payload.farm_profile_id,
        moisture_percent=payload.moisture_percent,
        temperature_c=payload.temperature_c,
        humidity_percent=payload.humidity_percent,
        recorded_at=datetime.utcnow()
    )
    await sensor_record.insert()
    
    # Broadcast to websocket clients in the background
    broadcast_data = {
        "deviceId": payload.farm_profile_id,
        "timestamp": sensor_record.recorded_at.isoformat(),
        "temperature": sensor_record.temperature_c,
        "humidity": sensor_record.humidity_percent,
        "soilMoisture": sensor_record.moisture_percent,
        # Default/mock values for missing fields as per the prompt requirements
        "soilPH": 6.7,
        "light": 800,
        "rain": False,
        "battery": 90,
        "signalStrength": -60
    }
    asyncio.create_task(manager.broadcast(broadcast_data))
    
    return {"status": "success", "message": "Telemetry data recorded successfully"}

@router.get("/hardware/telemetry/{farm_profile_id}")
async def get_telemetry(farm_profile_id: str, limit: int = 10):
    data = await SensorData.find(SensorData.farm_profile_id == farm_profile_id).sort(-SensorData.recorded_at).limit(limit).to_list()
    return {"status": "success", "data": data}
