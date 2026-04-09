import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.farm_profile import FarmProfile, Location, FertilizerUsage, PesticideUsage, HistoryLog
from app.models.mission import Mission
from app.models.mission_progress import MissionProgress
from app.models.community_mission import CommunityMission
from app.models.proof_submission import ProofSubmission
from app.schemas.farm_schema import UpdateFarmRequest
from app.controllers.farm_controller import update_farm
from app.config import settings

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(
        database=client.goo_db,
        document_models=[User, FarmProfile, Mission, MissionProgress, CommunityMission, ProofSubmission]
    )
    
    # Get first farmer user
    user = await User.find_one(User.role == "farmer")
    if not user:
        print("No farmer user found.")
        return
        
    print(f"Triggering update_farm for user {user.email}")
    try:
        req = UpdateFarmRequest(location=Location(latitude=10.0, longitude=20.0))
        res = await update_farm(user, req)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
