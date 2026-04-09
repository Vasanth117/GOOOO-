import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.farm_profile import FarmProfile, Location as LocationModel, FertilizerUsage, PesticideUsage, HistoryLog, SoilType, IrrigationType, FarmingPractice
from app.models.mission import Mission
from app.models.mission_progress import MissionProgress
from app.models.community_mission import CommunityMission
from app.models.proof_submission import ProofSubmission
from app.schemas.farm_schema import UpdateFarmRequest, CreateFarmRequest, Location
from app.config import settings

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # Must import EVERYTHING so Beanie doesn't complain about unresolved forward refs
    from app.models.streak import Streak
    from app.models.badge import BadgeDefinition, FarmerBadge
    from app.models.score import ScoreLog
    from app.models.post import Post
    from app.models.follow import Follow
    
    await init_beanie(
        database=client.goo_db,
        document_models=[
            User, FarmProfile, Mission, MissionProgress, CommunityMission, 
            ProofSubmission, Streak, BadgeDefinition, FarmerBadge, ScoreLog,
            Post, Follow
        ]
    )
    
    user = await User.find_one()
    
    farm = await FarmProfile.find_one()
    if not farm:
        print("No farm found.")
        return
        
    print(f"Testing location update on farm: {farm.farm_name}")
    data = UpdateFarmRequest(location=Location(latitude=10.0, longitude=20.0))
    update_data = data.model_dump(exclude_none=True)
    
    try:
        for key, value in update_data.items():
            if key == "location" and isinstance(value, dict):
                setattr(farm, key, LocationModel(**value))
            else:
                setattr(farm, key, value)
                
        print("Set attributes successfully.")
        await farm.save()
        print("Saved successfully.")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
