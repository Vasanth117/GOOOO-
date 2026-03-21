from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime


class PeriodicReport(Document):
    farmer_id: str
    submission_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Report items
    tasks_completed_summary: str
    organic_materials_used: List[str]
    live_photo_url: str
    gps_latitude: float
    gps_longitude: float
    
    # AI Analysis Status
    ai_status: str = "pending" # pending, approved, abnormal_detected
    ai_confidence: float = 0.0
    growth_health_score: float = 0.0 # 0-100
    
    # Growth metrics
    abnormal_growth_flag: bool = False
    ai_notes: Optional[str] = None
    
    admin_reviewed: bool = False
    admin_notes: Optional[str] = None

    class Settings:
        name = "periodic_reports"
        indexes = ["farmer_id", "submission_date"]
