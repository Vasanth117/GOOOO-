import asyncio
import os
import sys
sys.path.append(os.getcwd())

from app.database import connect_db
from app.models.mission import Mission
from app.models.mission_progress import MissionProgress
from app.controllers import mission_controller
from app.models.user import User
from bson import ObjectId

async def test():
    print("Connecting...")
    await connect_db()
    print("Connected.")
    
    # Try to fetch something
    try:
        user = await User.find_one()
        if not user:
            print("No users found.")
            return

        print(f"Testing for user: {user.id}")
        
        print("Getting active missions...")
        res = await mission_controller.get_active_missions(user)
        print("Success active missions.")
        
        print("Done.")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
