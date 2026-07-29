from fastapi import APIRouter, Depends, Query, Body
from app.schemas.admin_schema import (
    UpdateUserRoleRequest, BanUserRequest, FraudFlagReviewRequest,
    AdjustPointsRequest, AdminVoucherRequest, AdminBadgeRequest,
    GRCApplicationActionRequest, AdminLoginRequest
)
from app.controllers import admin_controller
from app.middleware.auth_middleware import require_admin
from app.models.user import User
from app.utils.response_utils import success_response
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


# ─── ADMIN AUTH ───────────────────────────────────────────────

@router.post("/login", summary="Admin: Login with admin credentials")
async def admin_login(data: AdminLoginRequest):
    result = await admin_controller.admin_login(data)
    return success_response(result, "Admin login successful")


# ─── PLATFORM STATS ──────────────────────────────────────────

@router.get("/stats", summary="Admin: Platform-wide statistics")
async def get_stats(current_user: User = Depends(require_admin)):
    result = await admin_controller.get_platform_stats()
    return success_response(result)


# ─── USER MANAGEMENT ─────────────────────────────────────────

@router.get("/users", summary="Admin: List all users with full details")
async def list_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_all_users(page=page, limit=limit, role=role, search=search)
    return success_response(result)


@router.get("/users/{user_id}", summary="Admin: Get full user details")
async def get_user_detail(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_user_full_detail(user_id)
    return success_response(result)


@router.patch("/users/{user_id}/role", summary="Admin: Change user role")
async def update_role(
    user_id: str,
    data: UpdateUserRoleRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.update_user_role(user_id, data)
    return success_response(result)


@router.patch("/users/{user_id}/status", summary="Admin: Ban/Unban user")
async def update_status(
    user_id: str,
    data: BanUserRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.toggle_user_status(user_id, data)
    return success_response(result)


@router.post("/users/{user_id}/adjust-points", summary="Admin: Adjust user points")
async def adjust_points(
    user_id: str,
    data: AdjustPointsRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.adjust_user_points(user_id, data, current_user)
    return success_response(result)


@router.delete("/users/{user_id}/missions/{mission_id}", summary="Admin: Remove a mission from a user")
async def remove_user_mission(
    user_id: str,
    mission_id: str,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.remove_user_mission(user_id, mission_id, current_user)
    return success_response(result)


@router.delete("/users/{user_id}/posts/{post_id}", summary="Admin: Remove a user post")
async def remove_user_post(
    user_id: str,
    post_id: str,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.remove_user_post(user_id, post_id, current_user)
    return success_response(result)


# ─── PROOF / FRAUD MANAGEMENT ────────────────────────────────

@router.get("/proofs", summary="Admin: View all submitted proofs")
async def list_proofs(
    status: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_all_proofs(status=status, page=page, limit=limit)
    return success_response(result)


@router.post("/proofs/{proof_id}/action", summary="Admin: Approve/Reject proof & deduct points if fake")
async def proof_action(
    proof_id: str,
    action: str = Body(..., embed=True),  # 'approve' or 'reject'
    reason: Optional[str] = Body(None, embed=True),
    deduct_points: int = Body(0, embed=True),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.handle_proof_action(proof_id, action, reason, deduct_points, current_user)
    return success_response(result)


@router.get("/fraud-flags", summary="Admin: View fraud flags")
async def list_fraud_flags(
    status: str = Query("open"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_fraud_flags(status=status, page=page, limit=limit)
    return success_response(result)


@router.post("/fraud-flags/{flag_id}/resolve", summary="Admin: Resolve fraud flag")
async def resolve_flag(
    flag_id: str,
    data: FraudFlagReviewRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.resolve_fraud_flag(flag_id, current_user, data)
    return success_response(result)


# ─── GRC APPLICATIONS ────────────────────────────────────────

@router.get("/grc/applications", summary="Admin: View GRC membership applications")
async def get_grc_applications(
    status: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_grc_applications(status=status, page=page, limit=limit)
    return success_response(result)


@router.post("/grc/applications/{application_id}/action", summary="Admin: Approve/Reject GRC application")
async def grc_application_action(
    application_id: str,
    data: GRCApplicationActionRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.handle_grc_application(application_id, data, current_user)
    return success_response(result)


@router.get("/grc/members", summary="Admin: View all GRC members")
async def get_all_grc_members(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_all_grc_members(page=page, limit=limit)
    return success_response(result)


@router.delete("/grc/members/{user_id}", summary="Admin: Remove user from GRC")
async def remove_grc_member(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.remove_grc_member(user_id, current_user)
    return success_response(result)


# ─── REWARDS / BADGES / VOUCHERS ─────────────────────────────

@router.get("/rewards/vouchers", summary="Admin: List all vouchers")
async def list_vouchers(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_all_vouchers(page=page, limit=limit)
    return success_response(result)


@router.post("/rewards/vouchers", summary="Admin: Create a new voucher")
async def create_voucher(
    data: AdminVoucherRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.create_voucher(data, current_user)
    return success_response(result, "Voucher created")


@router.delete("/rewards/vouchers/{voucher_id}", summary="Admin: Delete a voucher")
async def delete_voucher(
    voucher_id: str,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.delete_voucher(voucher_id, current_user)
    return success_response(result)


@router.get("/rewards/badges", summary="Admin: List all badge definitions")
async def list_badges(current_user: User = Depends(require_admin)):
    result = await admin_controller.get_all_badges()
    return success_response(result)


@router.post("/rewards/badges", summary="Admin: Create a new badge")
async def create_badge(
    data: AdminBadgeRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.create_badge(data, current_user)
    return success_response(result, "Badge created")


@router.delete("/rewards/badges/{badge_id}", summary="Admin: Delete a badge")
async def delete_badge(
    badge_id: str,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.delete_badge(badge_id, current_user)
    return success_response(result)


# ─── LEADERBOARD MANAGEMENT ──────────────────────────────────

@router.get("/leaderboard", summary="Admin: Full leaderboard with all user details")
async def admin_leaderboard(
    scope: str = Query("national"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_admin_leaderboard(scope=scope, page=page, limit=limit)
    return success_response(result)


# ─── NOTIFICATIONS ────────────────────────────────────────────

@router.get("/notifications", summary="Admin: View system notifications & alerts")
async def admin_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_admin_notifications(page=page, limit=limit)
    return success_response(result)


# ─── MARKETPLACE ────────────────────────────────────────────

@router.get("/marketplace/stats", summary="Admin: Marketplace overview stats")
async def get_marketplace_stats(
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_marketplace_stats()
    return success_response(result)

@router.get("/marketplace/products", summary="Admin: List marketplace products")
async def get_marketplace_products(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    skip = (page - 1) * limit
    result = await admin_controller.get_marketplace_products(limit=limit, skip=skip)
    return success_response(result)

@router.patch("/marketplace/products/{product_id}/status", summary="Admin: Toggle product active status")
async def toggle_product_status(
    product_id: str,
    is_active: bool = Query(...),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.toggle_product_status(product_id, is_active)
    return success_response(result)
