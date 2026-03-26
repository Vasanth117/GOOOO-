from beanie import Document
from pydantic import Field, BaseModel
from typing import List, Optional
from datetime import datetime


class CartItem(BaseModel): # Using dict but schema for documentation
    product_id: str
    quantity: int = 1
    added_at: datetime = Field(default_factory=datetime.utcnow)


class Cart(Document):
    user_id: str
    items: List[dict] = [] # [{ "product_id": str, "quantity": int, "added_at": datetime }]
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "carts"
