import asyncio
import os
import sys
sys.path.append(os.getcwd())

from app.database import connect_db
from app.models.user import User
from app.models.mission import Mission, MissionType
from app.models.mission_progress import MissionProgress
from app.controllers import mission_controller, periodic_report_controller
from fastapi import UploadFile
import io

async def test():
    print("Connecting...")
    await connect_db()
    print("Connected.")
    
    user = await User.find_one()
    if not user:
        print("No user found.")
        return
    
    print(f"User: {user.id}")
    
    try:
        print("Fetching active missions...")
        res = await mission_controller.get_active_missions(user)
        print("Active missions success.")
    except Exception as e:
        print(f"Active missions FAILED: {e}")
        import traceback
        traceback.print_exc()

    try:
        print("Testing periodic report submission...")
        # Mock a file
        f = UploadFile(filename="test.jpg", file=io.BytesIO(b"dummy image content"))
        f.content_type = "image/jpeg"
        
        res = await periodic_report_controller.submit_periodic_report(
            user=user,
            tasks_summary="Did some tasks",
            organic_materials=["Compost"],
            file=f,
            latitude=10.0,
            longitude=77.0
        )
        print("Periodic report success.")
    except Exception as e:
        print(f"Periodic report FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
