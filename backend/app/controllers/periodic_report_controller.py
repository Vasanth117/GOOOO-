import os
from fastapi import UploadFile
from datetime import datetime, timedelta
from typing import List, Optional

from app.models.periodic_report import PeriodicReport
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.services import ai_service
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.response_utils import error_response, not_found
from app.config import settings
import aiofiles
import hashlib

async def submit_periodic_report(
    user: User,
    tasks_summary: str,
    organic_materials: List[str],
    file: UploadFile,
    latitude: float,
    longitude: float
) -> dict:
    # 1. Check if user already submitted a report in the last 2 days (3-day cycle)
    three_days_ago = datetime.utcnow() - timedelta(days=2)
    recent_report = await PeriodicReport.find_one(
        PeriodicReport.farmer_id == str(user.id),
        PeriodicReport.submission_date > three_days_ago
    )
    # if recent_report:
    #     error_response("You already submitted a verification report recently. Next report due in 3 days.", 400)

    # 2. Save live photo
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    upload_dir = os.path.join(settings.UPLOAD_DIR, "reports", str(user.id))
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.content_type.split("/")[1] if file.content_type else "jpg"
    filename = f"report_{file_hash}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    file_url = f"/uploads/reports/{user.id}/{filename}"

    # 3. AI Analysis for abnormal growth
    materials_str = ", ".join(organic_materials) if isinstance(organic_materials, list) else str(organic_materials)
    ai_result = await ai_service.analyze_periodic_report(content, f"Tasks: {tasks_summary}. Materials: {materials_str}")
    
    # 4. Create record
    report = PeriodicReport(
        farmer_id=str(user.id),
        tasks_completed_summary=tasks_summary,
        organic_materials_used=organic_materials,
        live_photo_url=file_url,
        gps_latitude=latitude,
        gps_longitude=longitude,
        ai_status="approved" if not ai_result.get("abnormal_growth") else "abnormal_detected",
        ai_confidence=ai_result.get("organic_consistency_score", 0) / 100,
        growth_health_score=ai_result.get("health_score", 0),
        abnormal_growth_flag=ai_result.get("abnormal_growth", False),
        ai_notes=ai_result.get("analysis_notes")
    )
    await report.insert()

    # 5. If abnormal growth, notify admin
    if report.abnormal_growth_flag:
        # In a real app, send to admin. For now, system notification.
        await send_notification(
            user_id=str(user.id), # notify user they are flagged? Or just admin?
            notif_type=NotificationType.SYSTEM,
            title="⚠️ Abnormal Growth Detected",
            message="Our AI detected unusual growth patterns. An expert will review your farm's health shortly.",
        )

    return {
        "id": str(report.id),
        "status": report.ai_status,
        "abnormal_detected": report.abnormal_growth_flag,
        "health_score": report.growth_health_score,
        "message": "Report submitted and analyzed by AI successfully."
    }

async def get_my_reports(user: User):
    return await PeriodicReport.find(PeriodicReport.farmer_id == str(user.id)).sort(-PeriodicReport.submission_date).to_list()
