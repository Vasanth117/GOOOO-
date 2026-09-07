import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.goo_db
    count = await db.sensordata.count_documents({})
    print(f"Total SensorData documents: {count}")
    
    docs = await db.sensordata.find().sort("recorded_at", -1).limit(5).to_list(5)
    for d in docs:
        print(d)

if __name__ == "__main__":
    asyncio.run(check())
