from pymongo import MongoClient

def fix():
    client = MongoClient("mongodb://localhost:27017")
    collection = client.goo_db.farm_profiles
    res = collection.update_many({"soil_type": "peaty"}, {"$set": {"soil_type": "peat"}})
    print(f"Fixed {res.modified_count} peaty soils.")

if __name__ == "__main__":
    fix()
