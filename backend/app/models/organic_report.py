from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional, Dict

class OrganicReport(Document):
    farmer_id: str
    report_text: str
    photo_url: str
    ai_analysis: Dict
    status: str = "approved" # approved or penalized 
    penalty_applied: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "organic_reports"
