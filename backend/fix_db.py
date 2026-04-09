import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_farm_profiles():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.goo_db
    collection = db.farm_profiles

    # Define mappings from old to new valid values
    soil_mapping = {
        "Alluvial Soil": "alluvial",
        "Black Soil": "black",
        "Red Soil": "red",
        "Laterite Soil": "laterite",
        "Other": "other",
        "Sandy Soil": "sandy",
        "Loam Soil": "loam"
    }

    irrigation_mapping = {
        "Drip Irrigation": "drip",
        "Flood Irrigation": "flood",
        "Rain-fed": "rain_fed",
        "Sprinkler System": "sprinkler"
    }
    
    farming_practice_mapping = {
        "Conventional Farming": "conventional",
        "Organic Farming": "organic",
        "Mixed Farming": "mixed"
    }

    count_soil = 0
    count_irrigation = 0
    count_practice = 0

    async for farm in collection.find():
        updates = {}
        
        soil_type = farm.get("soil_type")
        if soil_type in soil_mapping:
            updates["soil_type"] = soil_mapping[soil_type]
            count_soil += 1
        elif isinstance(soil_type, str) and soil_type.lower() != soil_type:
             updates["soil_type"] = soil_type.lower()
             count_soil += 1

        irrigation = farm.get("irrigation_type")
        if irrigation in irrigation_mapping:
            updates["irrigation_type"] = irrigation_mapping[irrigation]
            count_irrigation += 1
        elif isinstance(irrigation, str) and irrigation.lower() != irrigation:
            updates["irrigation_type"] = irrigation.lower()
            count_irrigation += 1
            
        practice = farm.get("farming_practices")
        if practice in farming_practice_mapping:
            updates["farming_practices"] = farming_practice_mapping[practice]
            count_practice += 1
        elif isinstance(practice, str) and practice.lower() != practice:
            updates["farming_practices"] = practice.lower()
            count_practice += 1

        if updates:
            await collection.update_one({"_id": farm["_id"]}, {"$set": updates})

    print(f"Fixed {count_soil} soil_types, {count_irrigation} irrigation_types, {count_practice} farming_practices")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_farm_profiles())
