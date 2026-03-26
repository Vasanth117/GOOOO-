import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.product import Product
from app.models.cart import Cart
from app.config import settings

async def check_db():
    print("Checking Database Integrity...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client.get_default_database(), document_models=[User, Product, Cart])
    
    # Check users
    print("\n[USERS]")
    async for u in User.find_all():
        print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Status: {u.status}")
        
    # Check carts
    print("\n[CARTS]")
    async for c in Cart.find_all():
        print(f"User: {c.user_id}, Items: {len(c.items)}")
        for i in c.items:
            print(f"  - Product: {i.get('product_id')}, Qty: {i.get('quantity')}")

if __name__ == "__main__":
    asyncio.run(check_db())
