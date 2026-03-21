from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CommunityMission(Document):
    title: str
    description: str
    target_value: float  # e.g., 1,000,000 trees planted
    current_value: float = 0
    unit: str            # e.g., "trees", "kg of CO2"
    reward_pool: int     # XP or Coins divided among contributors
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: datetime
    is_active: bool = True
    contributors: List[str] = [] # List of farmer_ids

    class Settings:
        name = "community_missions"
