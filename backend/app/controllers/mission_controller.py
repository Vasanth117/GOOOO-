from app.models.mission import Mission, MissionType
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.schemas.mission_schema import CreateMissionRequest
from app.utils.response_utils import error_response, not_found
from app.services import ai_service, weather_service
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


# ─── HELPERS ─────────────────────────────────────────────────

async def _enrich_progress(mp: MissionProgress) -> dict:
    """Attach mission template details to a MissionProgress record."""
    mission = await Mission.get(mp.mission_id)
    base_dict = {
        "progress_id": str(mp.id),
        "mission_id": mp.mission_id,
        "title": mission.title if mission else "Unknown",
        "description": mission.description if mission else "",
        "mission_type": mission.mission_type.value if mission else "",
        "difficulty": mission.difficulty.value if mission else "easy",
        "reward_points": mission.reward_points if mission else 0,
        "eco_benefit": mission.eco_benefit if mission else "",
        "next_step": mission.next_step if mission else "",
        "personalization_tag": mission.personalization_tag if mission else None,
        "requires_photo": mission.proof_requirement.requires_photo if mission else True,
        "proof_description": mission.proof_requirement.description if mission else "",
        "status": mp.status.value,
        "progress_percentage": mp.progress_percentage,
        "current_step": mp.current_step,
        "proof_submission_id": mp.proof_submission_id,
        "points_earned": mp.points_earned,
        "assigned_at": mp.assigned_at.isoformat(),
        "started_at": mp.started_at.isoformat() if mp.started_at else None,
        "expires_at": mp.expires_at.isoformat(),
        "completed_at": mp.completed_at.isoformat() if mp.completed_at else None,
    }
    
    # Include AI analysis details if there is a pending proof
    if mp.proof_submission_id:
        try:
            from app.models.proof_submission import ProofSubmission
            proof = await ProofSubmission.get(mp.proof_submission_id)
            if proof and getattr(proof, "ai_result", None):
                base_dict["ai_analysis"] = proof.ai_result
        except Exception as e:
            logger.error(f"Error fetching proof for mission progress {mp.id}: {e}")

    return base_dict


# ─── FARMER ACTIONS ──────────────────────────────────────────

async def get_active_missions(user: User) -> dict:
    """Return all active/in-progress missions for a farmer, grouped by type."""
    try:
        progress_items = await MissionProgress.find(
            {
                "farmer_id": str(user.id),
                "status": {"$in": [MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS, MissionStatus.PENDING_REVIEW]}
            }
        ).to_list()

        result = []
        for mp in progress_items:
            try:
                enriched = await _enrich_progress(mp)
                result.append(enriched)
            except Exception as e:
                logger.error(f"Error enriching mission {mp.id}: {e}")
                continue

        # Group by type
        grouped = {"daily": [], "weekly": [], "monthly": [], "community": [], "long_term": [], "surprise": []}
        for item in result:
            t = item.get("mission_type", "daily")
            if t in grouped:
                grouped[t].append(item)
            else:
                grouped["daily"].append(item)

        return grouped
    except Exception as e:
        logger.error(f"FATAL error in get_active_missions: {e}", exc_info=True)
        return {"daily": [], "weekly": [], "monthly": [], "community": [], "long_term": [], "surprise": []}


async def get_mission_detail(mission_progress_id: str, user: User) -> dict:
    """Get full detail of a single mission progress item."""
    mp = await MissionProgress.get(mission_progress_id)
    if not mp or mp.farmer_id != str(user.id):
        not_found("Mission")
    return await _enrich_progress(mp)


async def start_mission(mission_progress_id: str, user: User) -> dict:
    """Mark a mission as in-progress."""
    mp = await MissionProgress.get(mission_progress_id)
    if not mp or mp.farmer_id != str(user.id):
        not_found("Mission")

    if mp.status != MissionStatus.ACTIVE:
        error_response(f"Mission cannot be started (current status: {mp.status.value})", 400)

    if mp.expires_at < datetime.utcnow():
        error_response("Mission has already expired", 400)

    mp.status = MissionStatus.IN_PROGRESS
    mp.started_at = datetime.utcnow()
    await mp.save()

    return await _enrich_progress(mp)


async def get_mission_history(user: User, page: int = 1, limit: int = 20) -> dict:
    """Paginated mission history (completed + expired)."""
    skip = (page - 1) * limit
    missions = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        {"status": {"$in": [MissionStatus.COMPLETED, MissionStatus.EXPIRED, MissionStatus.REJECTED]}},
    ).sort(-MissionProgress.assigned_at).skip(skip).limit(limit).to_list()

    total = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        {"status": {"$in": [MissionStatus.COMPLETED, MissionStatus.EXPIRED, MissionStatus.REJECTED]}},
    ).count()

    completed = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.COMPLETED,
    ).count()

    expired = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.EXPIRED,
    ).count()

    # Total points earned
    completed_missions = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.COMPLETED,
    ).to_list()
    total_points = sum(m.points_earned for m in completed_missions)

    enriched = [await _enrich_progress(mp) for mp in missions]

    return {
        "total_completed": completed,
        "total_expired": expired,
        "total_points_earned": total_points,
        "page": page,
        "limit": limit,
        "total": total,
        "has_next": (skip + limit) < total,
        "missions": enriched,
    }

async def admin_list_missions(page: int = 1, limit: int = 20) -> dict:
    """Admin lists all mission templates."""
    skip = (page - 1) * limit
    missions = await Mission.find_all().skip(skip).limit(limit).to_list()
    total = await Mission.find_all().count()

    return {
        "page": page, "limit": limit, "total": total,
        "missions": [
            {
                "id": str(m.id),
                "title": m.title,
                "type": m.mission_type.value,
                "difficulty": m.difficulty.value,
                "reward_points": m.reward_points,
                "duration_hours": m.duration_hours,
                "is_active": m.is_active,
                "created_by": m.created_by,
            }
            for m in missions
        ]
    }

async def auto_assign_ai_missions(user: User) -> dict:
    """Uses AI to generate and assign DAILY + WEEKLY + MONTHLY missions based on farmer's actual farm profile."""
    from app.models.farm_profile import FarmProfile
    from app.models.mission import Mission, MissionType
    from app.models.mission_progress import MissionProgress

    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))

    # ─── 1. FORCE ASSIGN COMMUNITY TASKS ───────────────────────────
    community_tasks = [
        {"title": "Plastic-Free Farm", "description": "Remove all non-biodegradable waste from farm paths.", "difficulty": "medium", "reward_points": 50},
        {"title": "Local Seed Bank", "description": "Trade or document 3 local heirloom seed varieties.", "difficulty": "hard", "reward_points": 100},
        {"title": "Beneficial Insect Hotel", "description": "Build a small habitat using twigs and straw.", "difficulty": "medium", "reward_points": 60},
        {"title": "Water Table Monitor", "description": "Measure and report the water level in your farm well.", "difficulty": "easy", "reward_points": 30},
        {"title": "Native Hedge Row", "description": "Plant 2 meters of native shrubs to prevent wind erosion.", "difficulty": "hard", "reward_points": 120},
        {"title": "Organic Pesticide Mix", "description": "Create a batch of neem oil spray for your crops.", "difficulty": "medium", "reward_points": 45},
        {"title": "Community Compost Share", "description": "Contribute 5kg of green waste to a shared pit.", "difficulty": "easy", "reward_points": 25},
        {"title": "Erosion Barrier", "description": "Place stones or logs along a slope to stop runoff.", "difficulty": "medium", "reward_points": 70},
        {"title": "Nitrogen Fixation Check", "description": "Verify root nodules on your legume crops.", "difficulty": "medium", "reward_points": 40},
        {"title": "Zero Tillage Zone", "description": "Maintain a 10sqm area without any tilling for a month.", "difficulty": "hard", "reward_points": 200}
    ]

    for ct in community_tasks:
        existing_t = await Mission.find_one(Mission.title == ct["title"])
        if not existing_t:
            existing_t = Mission(
                title=ct["title"],
                description=ct["description"],
                mission_type=MissionType.COMMUNITY,
                difficulty=ct["difficulty"],
                reward_points=ct["reward_points"],
                created_by="SYSTEM_AI_GENERATED",
                duration_hours=720
            )
            await existing_t.insert()
        
        m_id = str(existing_t.id)
        exists = await MissionProgress.find_one(
            MissionProgress.farmer_id == str(user.id),
            MissionProgress.mission_id == m_id,
            {"status": {"$in": [MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS, MissionStatus.PENDING_REVIEW, MissionStatus.COMPLETED]}}
        )
        if not exists:
            mp = MissionProgress(farmer_id=str(user.id), mission_id=m_id, expires_at=datetime.utcnow() + timedelta(days=30))
            await mp.insert()


    # ─── 2. BUILD FARM CONTEXT ──────────────────────────────────────
    crops_str = "general crops"
    soil_str = "loam"
    irrigation_str = "manual"
    practice_str = "conventional"
    farm_data = {}
    weather = {}

    if farm:
        crops_str = ", ".join(farm.crop_types) if farm.crop_types else "general crops"
        soil_str = farm.soil_type.value if hasattr(farm.soil_type, 'value') else str(farm.soil_type)
        irrigation_str = farm.irrigation_type.value if hasattr(farm.irrigation_type, 'value') else str(farm.irrigation_type)
        practice_str = farm.farming_practices.value if hasattr(farm.farming_practices, 'value') else str(farm.farming_practices)
        farm_data = {
            "farm_name": farm.farm_name,
            "crops": farm.crop_types if farm.crop_types else ["general crops"],
            "soil": soil_str,
            "irrigation": irrigation_str,
            "practices": practice_str,
            "fertilizer": farm.fertilizer_usage.type,
            "pesticide": farm.pesticide_usage.type,
            "farm_size_acres": farm.farm_size_acres,
            "score": farm.sustainability_score,
        }
        try:
            weather = await weather_service.get_weather_data(farm.location.latitude, farm.location.longitude)
        except Exception:
            weather = {}

    # ─── 3. FARM-AWARE FALLBACK MISSIONS ───────────────────────────
    fallback_missions = {
        MissionType.DAILY: [
            {"title": f"Morning Crop Inspection — {crops_str}", "description": f"Walk through your {crops_str} fields and check for pest activity, leaf discolouration, and soil moisture. Record all observations.", "difficulty": "easy", "reward_points": 10, "eco_benefit": "Early detection prevents large-scale chemical intervention.", "next_step": "Take a photo of your crops during inspection."},
            {"title": f"Water Conservation Check — {irrigation_str}", "description": f"Inspect your {irrigation_str} irrigation system for leaks or inefficiency. Adjust schedules to reduce water waste.", "difficulty": "easy", "reward_points": 10, "eco_benefit": "Saves up to 40% water per day.", "next_step": "Photograph your irrigation system in operation."},
            {"title": "Organic Compost Application", "description": f"Apply compost or vermicompost to one section of your {soil_str} soil farm today to boost microbial activity.", "difficulty": "easy", "reward_points": 10, "eco_benefit": "Improves soil health and reduces chemical fertilizer needs.", "next_step": "Photo of compost being applied to soil."},
        ],
        MissionType.WEEKLY: [
            {"title": f"7-Day No Chemical Pesticide — {crops_str}", "description": f"Complete a full week farming your {crops_str} without any chemical pesticides. Use neem oil or organic alternatives only.", "difficulty": "medium", "reward_points": 35, "eco_benefit": "Protects soil microbiome and beneficial insects.", "next_step": "Photo of your crops and organic spray products."},
            {"title": f"Weekly Soil Health Test — {soil_str} Soil", "description": f"Test your {soil_str} soil's pH and nutrient levels this week. Record results and plan organic amendments to improve fertility.", "difficulty": "medium", "reward_points": 30, "eco_benefit": "Optimal soil pH increases crop yield by up to 20%.", "next_step": "Photo of soil test kit with visible results."},
            {"title": f"Full Organic Week — {practice_str.title()} Practice", "description": f"Use only organic inputs (compost, vermicompost, neem cake) for all your {crops_str} this week. Track every input used.", "difficulty": "medium", "reward_points": 40, "eco_benefit": "Builds long-term soil fertility without chemical dependency.", "next_step": "Photo showing organic fertilizer bags and crops."},
        ],
        MissionType.MONTHLY: [
            {"title": f"30-Day Zero Chemical Month — {crops_str}", "description": f"Complete a full month farming your {crops_str} without any synthetic pesticides or chemical fertilizers. Transition fully to organic inputs.", "difficulty": "hard", "reward_points": 100, "eco_benefit": "Significantly reduces chemical runoff into groundwater.", "next_step": "End-of-month photo of healthy crops and organic inputs."},
            {"title": f"Monthly Soil Improvement — {soil_str.title()} Soil", "description": f"Implement a month-long soil improvement plan: add compost, plant cover crops, or reduce tillage in your {soil_str} soil farm.", "difficulty": "hard", "reward_points": 80, "eco_benefit": "Improved soil structure increases water retention by 30%.", "next_step": "Before and after photos of your soil or cover crops."},
            {"title": "Water Harvesting System Setup", "description": "Set up a rainwater harvesting or water storage system on your farm this month to reduce dependency on external water sources.", "difficulty": "hard", "reward_points": 90, "eco_benefit": "Harvests free rainwater, reduces groundwater extraction.", "next_step": "Photo of your rainwater harvesting or storage system."},
        ],
    }

    # ─── 4. TRY AI GENERATION ──────────────────────────────────────
    ai_missions_by_type = {}
    try:
        ai_raw = await ai_service.generate_personalized_missions(farm_data, weather)
        if ai_raw and len(ai_raw) >= 3:
            for am in ai_raw:
                m_type_str = str(am.get("type", am.get("mission_type", "daily"))).lower()
                if "weekly" in m_type_str or "week" in m_type_str:
                    t = MissionType.WEEKLY
                elif "monthly" in m_type_str or "month" in m_type_str:
                    t = MissionType.MONTHLY
                else:
                    t = MissionType.DAILY
                ai_missions_by_type.setdefault(t, []).append(am)
            logger.info(f"AI generated {len(ai_raw)} personalized missions for farmer {user.id}")
    except Exception as e:
        logger.error(f"AI mission generation failed, using farm-aware fallback: {e}")

    # ─── 5. ASSIGN DAILY + WEEKLY + MONTHLY (always all three) ─────
    assigned_count = 0
    for mission_type, duration in [(MissionType.DAILY, 24), (MissionType.WEEKLY, 168), (MissionType.MONTHLY, 720)]:
        # Count active missions of this type
        all_active = await MissionProgress.find(
            MissionProgress.farmer_id == str(user.id),
            {"status": {"$in": [MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS, MissionStatus.PENDING_REVIEW]}}
        ).to_list()
        active_of_type = []
        for p in all_active:
            m = await Mission.get(p.mission_id)
            if m and m.mission_type == mission_type:
                active_of_type.append(p)

        needed = 3 - len(active_of_type)
        if needed <= 0:
            continue

        source = ai_missions_by_type.get(mission_type, fallback_missions.get(mission_type, []))
        for am in source[:needed]:
            mission = Mission(
                title=am.get("title", f"AI {mission_type.value.title()} Task"),
                description=am.get("description", "Complete this farming task."),
                mission_type=mission_type,
                difficulty=am.get("difficulty", "medium"),
                reward_points=int(am.get("reward_points", 20)),
                eco_benefit=am.get("eco_benefit", "Supports sustainable farming."),
                next_step=am.get("next_step", "Follow instructions to complete."),
                personalization_tag=f"For your {soil_str} soil growing {crops_str}",
                duration_hours=duration,
                created_by="SYSTEM_AI_PERSONALIZED"
            )
            await mission.insert()
            mp = MissionProgress(
                farmer_id=str(user.id),
                mission_id=str(mission.id),
                expires_at=datetime.utcnow() + timedelta(hours=duration)
            )
            await mp.insert()
            assigned_count += 1

    logger.info(f"✅ AI assigned {assigned_count} new missions (Daily+Weekly+Monthly) to farmer {user.id}")
    return await get_active_missions(user)
