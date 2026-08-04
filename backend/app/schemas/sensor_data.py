from pydantic import BaseModel

class SensorPayload(BaseModel):
    farm_profile_id: str
    moisture_percent: float
    temperature_c: float
    humidity_percent: float
    secret_key: str
