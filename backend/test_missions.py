import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.farm_profile import FarmProfile, Location, FertilizerUsage, PesticideUsage
from app.models.mission import Mission
from app.models.mission_progress import MissionProgress
from app.models.community_mission import CommunityMission
from app.models.proof_submission import ProofSubmission
from app.controllers.mission_controller import auto_assign_ai_missions
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
        
    print(f"Triggering auto_assign_ai_missions for user {user.email}")
    try:
        active_missions = await auto_assign_ai_missions(user)
        print("Active Missions:")
        for k, v in active_missions.items():
            print(f"- {k}: {len(v)} missions")
            for mission in v:
                print(f"  > {mission.get('title')}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
