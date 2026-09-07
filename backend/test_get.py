import asyncio
from app.models.farm_profile import FarmProfile
from app.database import connect_db, close_db

async def test():
    client = await connect_db()
    try:
        farm = await FarmProfile.get("000000000000000000000000")
        print("FarmProfile get returned:", farm)
    except Exception as e:
        print("Error:", type(e), e)
    await close_db(client)

if __name__ == "__main__":
    asyncio.run(test())
