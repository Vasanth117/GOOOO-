from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from typing import Optional
import aiofiles
import os
from uuid import uuid4
import logging

from app.models.user import User
from app.models.periodic_report import PeriodicReport
from app.middleware.auth_middleware import get_current_user
from app.services import ai_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "reports") if hasattr(settings, 'UPLOAD_DIR') else "uploads/reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/submit")
async def submit_organic_report(
    report_text: str = Form(...),
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Save photo
        file_ext = photo.filename.split('.')[-1]
        unique_filename = f"{uuid4().hex}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await photo.read()
            await out_file.write(content)
            
        file_url = f"/api/v1/uploads/reports/{unique_filename}"
        
        # Analyze with AI
        ai_result = await ai_service.analyze_periodic_report(content, report_text)
        
        if ai_result.get("api_failure"):
            raise HTTPException(status_code=503, detail="AI Verification system is currently overwhelmed. Please try submitting your organic report again.")
            
        penalty_applied = 0
        ai_status = "approved"
        
        # Penalties:
        abnormal = ai_result.get("abnormal_growth", False)
        organic_score = ai_result.get("organic_consistency_score", 100)
        
        message = "Organic report successfully verified by AI! Keep up the good work."
        
        if abnormal or organic_score < 60:
            penalty_applied = 50
            ai_status = "abnormal_detected"
            message = f"AI Audit Warning: Abnormal growth or non-organic activity detected. -50 Penalty Applied. AI Notes: {ai_result.get('analysis_notes', 'N/A')}"
            
            # Decrease farm score
            from app.models.farm_profile import FarmProfile
            from app.services import score_service
            farm = await FarmProfile.find_one({"user_id": str(current_user.id)})
            if farm:
                await score_service.update_farm_score(farm, score_service.ScoreChangeReason.FRAUD_PENALTY)
        
        report = PeriodicReport(
            farmer_id=str(current_user.id),
            tasks_completed_summary=report_text,
            organic_materials_used=[],
            live_photo_url=file_url,
            gps_latitude=0.0,
            gps_longitude=0.0,
            ai_status=ai_status,
            ai_confidence=ai_result.get("confidence", 100.0),
            growth_health_score=ai_result.get("health_score", 100.0),
            abnormal_growth_flag=abnormal,
            ai_notes=ai_result.get("analysis_notes", ""),
        )
        await report.save()
        
        return {
            "status": ai_status,
            "message": message,
            "ai_notes": ai_result.get("analysis_notes", ""),
            "penalty": penalty_applied,
            "abnormal_growth": abnormal,
            "organic_consistency_score": organic_score,
            "health_score": ai_result.get("health_score", 100)
        }
        
    except Exception as e:
        logger.error(f"Failed to submit organic report: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Failed to process report.")
