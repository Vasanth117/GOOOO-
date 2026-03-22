from fastapi import APIRouter
from app.controllers.report_controller import submit_organic_report

router = APIRouter(prefix="/reports", tags=["Reports"])

router.post("/submit")(submit_organic_report)
