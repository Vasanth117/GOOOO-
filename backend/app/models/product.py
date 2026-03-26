from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProductCategory(str, Enum):
    FERTILIZER = "fertilizers"
    PESTICIDE = "pesticides"
    SEEDS = "seeds"
    TOOLS = "tools"
    IRRIGATION = "irrigation"
    CROP = "crops"
    CONSULTATION = "consultation"
    OTHER = "other"


class Product(Document):
    seller_id: str
    name: str
    description: str
    price: float
    category: ProductCategory
    image_url: Optional[str] = None
    proof_images: List[str] = []    # Photos of farming process, growth stages
    stock: int = 0
    is_goo_verified: bool = False   # True if seller has score > 500
    is_eco_certified: bool = False
    is_active: bool = True
    is_featured: bool = False
    discount_percent: float = 0.0
    
    # Analytics
    views_count: int = 0
    clicks_count: int = 0
    sales_count: int = 0
    
    # Organic Proof & Business Suite Expansion
    growth_stages: List[dict] = []    # List of {stage: str, date: str, proof: url}
    farming_tasks: List[dict] = []    # List of {task: str, status: str}
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"
