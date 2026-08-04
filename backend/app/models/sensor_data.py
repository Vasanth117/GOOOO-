from beanie import Document
from pydantic import Field
from datetime import datetime

class SensorData(Document):
    farm_profile_id: str
    moisture_percent: float
    temperature_c: float
    humidity_percent: float
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sensor_data"
