from fastapi import APIRouter, Depends, Query, File, UploadFile
from typing import List
from app.schemas.mission_schema import CreateMissionRequest, ReviewProofRequest
from app.controllers import mission_controller, periodic_report_controller
from app.middleware.auth_middleware import get_current_user, require_farmer, require_admin
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/missions", tags=["Missions"])


# ─── FARMER ROUTES ───────────────────────────────────────────

@router.get("/active", summary="Get all active missions for current farmer")
async def get_active_missions(current_user: User = Depends(require_farmer)):
    try:
        result = await mission_controller.get_active_missions(current_user)
        return success_response(result)
    except Exception as e:
        import traceback
        error_msg = f"ROUTE ERROR: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return {"success": False, "message": "Debug crash", "detail": str(e), "traceback": error_msg}


@router.get("/history", summary="Get mission completion history")
async def get_mission_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_farmer),
):
    try:
        result = await mission_controller.get_mission_history(current_user, page=page, limit=limit)
        return success_response(result)
    except Exception as e:
        import logging
        logging.error(f"Error in get_mission_history: {e}", exc_info=True)
        return success_response({"missions": [], "total": 0, "completed": 0, "expired": 0, "total_points": 0})


@router.post("/{mission_progress_id}/start", summary="Start a mission")
async def start_mission(
    mission_progress_id: str,
    current_user: User = Depends(require_farmer),
):
    result = await mission_controller.start_mission(mission_progress_id, current_user)
    return success_response(result, "Mission started!")


@router.get("/ai-assign", summary="Trigger AI to assign personalized missions")
async def ai_assign_missions(current_user: User = Depends(require_farmer)):
    result = await mission_controller.auto_assign_ai_missions(current_user)
    return success_response(result, "AI missions assigned successfully")


# ─── PERIODIC VERIFICATION VERIFICATION (3-Day Cycle) ────

@router.post("/periodic-reports", summary="Submit a 3rdrd day periodic verification report")
async def submit_periodic_report(
    tasks_summary: str = Query(...),
    organic_materials: str = Query(...), # Receive as comma-sep string for safety
    latitude: float = Query(...),
    longitude: float = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_farmer),
):
    # Convert string to list if needed
    materials_list = [m.strip() for m in organic_materials.split(",") if m.strip()]
    result = await periodic_report_controller.submit_periodic_report(
        current_user, tasks_summary, materials_list, file, latitude, longitude
    )
    return success_response(result)

@router.get("/periodic-reports/my", summary="Get my periodic reports")
async def get_my_reports(current_user: User = Depends(require_farmer)):
    items = await periodic_report_controller.get_my_reports(current_user)
    
    # Explicitly serialize for stability
    reports = []
    for r in items:
        reports.append({
            "id": str(r.id),
            "farmer_id": r.farmer_id,
            "submission_date": r.submission_date.isoformat() if r.submission_date else None,
            "tasks_completed_summary": r.tasks_completed_summary,
            "organic_materials_used": r.organic_materials_used,
            "ai_status": r.ai_status,
            "abnormal_growth_flag": r.abnormal_growth_flag,
            "growth_health_score": r.growth_health_score,
            "ai_analysis_summary": r.ai_analysis_summary,
            "image_proof_url": r.image_proof_url
        })
    return success_response(reports)


# ─── COMMUNITY MISSIONS ──────────────────────────────────────

@router.get("/community-active", summary="Get active community missions")
async def get_community_active(current_user: User = Depends(require_farmer)):
    # Explicitly fetch and serialize for stability
    from app.models.community_mission import CommunityMission
    items = await CommunityMission.find(CommunityMission.is_active == True).to_list()
    
    # Manually serialize documents to JSON-safe dicts for Beanie stability
    missions = []
    for m in items:
        missions.append({
            "id": str(m.id),
            "title": m.title,
            "description": m.description,
            "mission_type": m.mission_type.value if hasattr(m.mission_type, 'value') else str(m.mission_type),
            "difficulty": m.difficulty.value if hasattr(m.difficulty, 'value') else str(m.difficulty),
            "reward_points": m.reward_points,
            "duration_hours": m.duration_hours,
            "participant_count": m.participant_count,
            "goal_value": m.goal_value,
            "current_value": m.current_value
        })
    return success_response(missions)


# ─── ADMIN ROUTES ────────────────────────────────────────────

@router.get("/admin/all", summary="Admin: List all mission templates")
async def admin_list_missions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await mission_controller.admin_list_missions(page=page, limit=limit)
    return success_response(result)


@router.post("/admin/create", summary="Admin: Create a mission template")
async def admin_create_mission(
    data: CreateMissionRequest,
    current_user: User = Depends(require_admin),
):
    result = await mission_controller.admin_create_mission(data, current_user)
    return success_response(result, "Mission template created")


@router.post("/admin/{mission_id}/assign-all", summary="Admin: Assign mission to all farmers")
async def admin_assign_mission(
    mission_id: str,
    current_user: User = Depends(require_admin),
):
    result = await mission_controller.admin_assign_mission_to_all(mission_id)
    return success_response(result, "Mission assigned to all eligible farmers")
