from datetime import datetime
from typing import Optional

from app.models.user import User, UserRole, UserStatus
from app.models.farm_profile import FarmProfile
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.proof_submission import ProofSubmission, ProofStatus
from app.models.fraud_flag import FraudFlag, FraudStatus, FraudSeverity
from app.models.grc_member import GRCMember
from app.models.badge import BadgeDefinition, FarmerBadge
from app.models.reward import Reward, RewardType
from app.models.score import ScoreLog, ScoreChangeReason
from app.models.post import Post
from app.models.notification import Notification, NotificationType
from app.models.product import Product
from app.schemas.admin_schema import (
    UpdateUserRoleRequest, BanUserRequest, FraudFlagReviewRequest,
    AdjustPointsRequest, AdminVoucherRequest, AdminBadgeRequest,
    GRCApplicationActionRequest, AdminLoginRequest
)
from app.utils.response_utils import error_response, not_found
from app.utils.jwt_utils import create_access_token
import logging

logger = logging.getLogger(__name__)


# ─── HARDCODED ADMIN CREDENTIALS ─────────────────────────────
ADMIN_EMAIL = "admin@goo.farm"
ADMIN_PASSWORD = "GOO@Admin2024!"


# ─── AUTH ─────────────────────────────────────────────────────

async def admin_login(data: AdminLoginRequest) -> dict:
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        error_response("Invalid admin credentials", 401)

    # Find or create admin user in DB
    admin = await User.find_one(User.email == ADMIN_EMAIL)
    if not admin:
        from app.utils.password_utils import hash_password
        admin = User(
            name="GOO Admin",
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
        )
        await admin.save()

    token = create_access_token({"sub": str(admin.id), "role": "admin"})
    return {"access_token": token, "token_type": "bearer", "admin": {"name": admin.name, "email": admin.email}}


# ─── STATS ───────────────────────────────────────────────────

async def get_platform_stats() -> dict:
    total_users = await User.find_all().count()
    total_farmers = await User.find(User.role == UserRole.FARMER).count()
    total_experts = await User.find(User.role == UserRole.EXPERT).count()
    total_sellers = await User.find(User.role == UserRole.SELLER).count()
    total_grc = await GRCMember.find_all().count()
    total_farms = await FarmProfile.find_all().count()
    completed = await MissionProgress.find(MissionProgress.status == MissionStatus.COMPLETED).count()
    proofs = await ProofSubmission.find_all().count()
    open_flags = await FraudFlag.find(FraudFlag.status == "open").count()
    pending_proofs = await ProofSubmission.find(ProofSubmission.status == ProofStatus.PENDING_REVIEW).count()

    farms = await FarmProfile.find_all().to_list()
    avg_score = round(sum(f.sustainability_score for f in farms) / len(farms), 2) if farms else 0

    return {
        "total_users": total_users, "total_farmers": total_farmers,
        "total_experts": total_experts, "total_sellers": total_sellers,
        "total_grc_members": total_grc, "total_farms": total_farms,
        "total_missions_completed": completed, "total_proofs_submitted": proofs,
        "open_fraud_flags": open_flags, "pending_proofs": pending_proofs,
        "average_sustainability_score": avg_score,
    }


# ─── USER MANAGEMENT ─────────────────────────────────────────

async def get_all_users(page: int = 1, limit: int = 20, role: Optional[str] = None, search: Optional[str] = None) -> dict:
    query = {}
    if role:
        query["role"] = role

    skip = (page - 1) * limit
    all_users = await User.find(query).sort(-User.created_at).to_list()

    if search:
        s = search.lower()
        all_users = [u for u in all_users if s in u.name.lower() or s in u.email.lower()]

    total = len(all_users)
    paged = all_users[skip: skip + limit]

    result = []
    for u in paged:
        farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(u.id))
        badges = await FarmerBadge.find(FarmerBadge.farmer_id == str(u.id)).count()
        missions = await MissionProgress.find(MissionProgress.farmer_id == str(u.id), MissionProgress.status == MissionStatus.COMPLETED).count()
        result.append({
            "id": str(u.id), "name": u.name, "email": u.email,
            "role": u.role.value, "status": u.status.value,
            "is_active": u.is_active, "created_at": u.created_at.isoformat(),
            "profile_picture": u.profile_picture,
            "sustainability_score": farm.sustainability_score if farm else 0,
            "badges_count": badges, "missions_completed": missions,
        })

    return {"page": page, "limit": limit, "total": total, "users": result}


async def get_user_full_detail(user_id: str) -> dict:
    user = await User.get(user_id)
    if not user:
        not_found("User")

    farm = await FarmProfile.find_one(FarmProfile.farmer_id == user_id)
    badges = await FarmerBadge.find(FarmerBadge.farmer_id == user_id).to_list()
    missions = await MissionProgress.find(MissionProgress.farmer_id == user_id).sort(-MissionProgress.updated_at).limit(10).to_list()
    proofs = await ProofSubmission.find(ProofSubmission.farmer_id == user_id).sort(-ProofSubmission.submitted_at).limit(10).to_list()
    score_logs = await ScoreLog.find(ScoreLog.farmer_id == user_id).sort(-ScoreLog.logged_at).limit(20).to_list()
    grc = await GRCMember.find_one(GRCMember.farmer_id == user_id)

    return {
        "user": {
            "id": str(user.id), "name": user.name, "email": user.email,
            "role": user.role.value, "status": user.status.value,
            "bio": user.bio, "phone": user.phone,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at.isoformat(),
        },
        "farm": {
            "location": farm.location if farm else None,
            "size_acres": farm.size_acres if farm else 0,
            "crops": farm.crops if farm else [],
            "sustainability_score": farm.sustainability_score if farm else 0,
        } if farm else None,
        "grc_member": bool(grc),
        "badges": [{"name": b.badge_name, "icon": b.badge_icon, "tier": b.badge_tier, "earned_at": b.earned_at.isoformat()} for b in badges],
        "recent_missions": [{"id": str(m.id), "status": m.status.value, "started_at": m.started_at.isoformat() if m.started_at else None} for m in missions],
        "recent_proofs": [{"id": str(p.id), "status": p.status.value, "submitted_at": p.submitted_at.isoformat(), "file_url": p.file_url} for p in proofs],
        "score_history": [{"delta": s.delta, "reason": s.reason.value, "description": s.description, "score_after": s.score_after, "logged_at": s.logged_at.isoformat()} for s in score_logs],
    }


async def update_user_role(user_id: str, data: UpdateUserRoleRequest) -> dict:
    user = await User.get(user_id)
    if not user: not_found("User")
    user.role = UserRole(data.role)
    await user.save()
    return {"message": f"Role updated to {data.role}", "user_id": user_id}


async def toggle_user_status(user_id: str, data: BanUserRequest) -> dict:
    user = await User.get(user_id)
    if not user: not_found("User")
    user.status = UserStatus.ACTIVE if data.is_active else UserStatus.BANNED
    await user.save()
    status_text = "activated" if data.is_active else "banned"
    return {"message": f"User {status_text}", "user_id": user_id}


async def adjust_user_points(user_id: str, data: AdjustPointsRequest, admin: User) -> dict:
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == user_id)
    if not farm: not_found("Farm profile")

    score_before = farm.sustainability_score
    farm.sustainability_score = max(0, farm.sustainability_score + data.delta)
    await farm.save()

    log = ScoreLog(
        farmer_id=user_id, delta=data.delta,
        reason=ScoreChangeReason.FRAUD_PENALTY if data.delta < 0 else ScoreChangeReason.EXPERT_APPROVED,
        description=f"Admin adjustment: {data.reason}",
        score_before=score_before, score_after=farm.sustainability_score,
    )
    await log.save()

    # Notify user
    notif = Notification(
        user_id=user_id,
        title="Points Adjusted by Admin",
        message=f"{'Deducted' if data.delta < 0 else 'Added'} {abs(data.delta)} points. Reason: {data.reason}",
        type=NotificationType.SYSTEM,
    )
    await notif.save()

    return {"message": "Points adjusted", "new_score": farm.sustainability_score}


async def remove_user_mission(user_id: str, mission_id: str, admin: User) -> dict:
    mp = await MissionProgress.get(mission_id)
    if not mp or mp.farmer_id != user_id: not_found("Mission progress")
    await mp.delete()
    return {"message": "Mission removed from user"}


async def remove_user_post(user_id: str, post_id: str, admin: User) -> dict:
    post = await Post.get(post_id)
    if not post: not_found("Post")
    await post.delete()
    return {"message": "Post removed"}


# ─── PROOFS ──────────────────────────────────────────────────

async def get_all_proofs(status: Optional[str] = None, page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    query = {}
    if status:
        query["status"] = status

    proofs = await ProofSubmission.find(query).sort(-ProofSubmission.submitted_at).skip(skip).limit(limit).to_list()
    total = await ProofSubmission.find(query).count()

    result = []
    for p in proofs:
        user = await User.get(p.farmer_id)
        result.append({
            "id": str(p.id), "farmer_id": p.farmer_id,
            "farmer_name": user.name if user else "Unknown",
            "file_url": p.file_url, "file_type": p.file_type,
            "status": p.status.value, "submitted_at": p.submitted_at.isoformat(),
            "ai_result": p.ai_result.dict() if p.ai_result else None,
        })
    return {"page": page, "limit": limit, "total": total, "proofs": result}


async def handle_proof_action(proof_id: str, action: str, reason: Optional[str], deduct_points: int, admin: User) -> dict:
    proof = await ProofSubmission.get(proof_id)
    if not proof: not_found("Proof")

    proof.status = ProofStatus.APPROVED if action == "approve" else ProofStatus.REJECTED
    proof.reviewer_id = str(admin.id)
    proof.reviewer_notes = reason
    proof.reviewed_at = datetime.utcnow()
    await proof.save()

    if action == "reject" and deduct_points > 0:
        farm = await FarmProfile.find_one(FarmProfile.farmer_id == proof.farmer_id)
        if farm:
            before = farm.sustainability_score
            farm.sustainability_score = max(0, before - deduct_points)
            await farm.save()
            log = ScoreLog(farmer_id=proof.farmer_id, delta=-deduct_points,
                reason=ScoreChangeReason.FRAUD_PENALTY,
                description=f"Fake/invalid proof rejected. {reason or ''}",
                score_before=before, score_after=farm.sustainability_score)
            await log.save()

        flag = FraudFlag(farmer_id=proof.farmer_id, anomaly_type="fake_proof",
            severity=FraudSeverity.HIGH, status=FraudStatus.OPEN,
            description=reason or "Fake proof detected by admin")
        await flag.save()

        notif = Notification(user_id=proof.farmer_id,
            title="⚠️ Proof Rejected & Points Deducted",
            message=f"Your proof was rejected. Reason: {reason or 'Invalid content'}. {deduct_points} points deducted.",
            type=NotificationType.PROOF_REJECTED)
        await notif.save()

    return {"message": f"Proof {action}d", "proof_id": proof_id}


# ─── FRAUD FLAGS ─────────────────────────────────────────────

async def get_fraud_flags(status: str = "open", page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    flags = await FraudFlag.find(FraudFlag.status == status).sort(-FraudFlag.created_at).skip(skip).limit(limit).to_list()
    total = await FraudFlag.find(FraudFlag.status == status).count()
    result = []
    for f in flags:
        user = await User.get(f.farmer_id)
        result.append({
            "id": str(f.id), "farmer_id": f.farmer_id,
            "farmer_name": user.name if user else "Unknown",
            "reason": f.anomaly_type, "severity": f.severity,
            "description": getattr(f, "description", ""),
            "status": f.status, "created_at": f.created_at.isoformat(),
        })
    return {"page": page, "limit": limit, "total": total, "flags": result}


async def resolve_fraud_flag(flag_id: str, admin: User, data: FraudFlagReviewRequest) -> dict:
    flag = await FraudFlag.get(flag_id)
    if not flag: not_found("Fraud flag")
    flag.status = data.status
    flag.resolved_by = str(admin.id)
    flag.resolved_at = datetime.utcnow()
    await flag.save()
    return {"message": f"Flag {data.status}", "flag_id": flag_id}


# ─── GRC ─────────────────────────────────────────────────────

async def get_grc_applications(status: Optional[str] = None, page: int = 1, limit: int = 20) -> dict:
    """GRC applications come from GRCMember records with is_active=False (pending)"""
    skip = (page - 1) * limit
    if status == "pending":
        members = await GRCMember.find(GRCMember.is_active == False).skip(skip).limit(limit).to_list()
        total = await GRCMember.find(GRCMember.is_active == False).count()
    else:
        members = await GRCMember.find_all().skip(skip).limit(limit).to_list()
        total = await GRCMember.find_all().count()

    result = []
    for m in members:
        user = await User.get(m.farmer_id)
        farm = await FarmProfile.find_one(FarmProfile.farmer_id == m.farmer_id)
        result.append({
            "id": str(m.id), "farmer_id": m.farmer_id,
            "farmer_name": user.name if user else "Unknown",
            "farmer_email": user.email if user else "",
            "score": farm.sustainability_score if farm else 0,
            "is_active": m.is_active,
            "applied_at": m.accepted_at.isoformat(),
        })
    return {"page": page, "limit": limit, "total": total, "applications": result}


async def handle_grc_application(application_id: str, data: GRCApplicationActionRequest, admin: User) -> dict:
    member = await GRCMember.get(application_id)
    if not member: not_found("GRC Application")

    if data.action == "approve":
        member.is_active = True
        member.accepted_at = datetime.utcnow()
        await member.save()
        user = await User.get(member.farmer_id)
        if user:
            user.role = UserRole.GRC
            await user.save()
        notif = Notification(user_id=member.farmer_id, title="🎉 GRC Membership Approved!",
            message="Congratulations! You are now a Green Revolution Club member.",
            type=NotificationType.GRC_INVITATION)
        await notif.save()
    else:
        await member.delete()
        notif = Notification(user_id=member.farmer_id, title="GRC Application Update",
            message=f"Your GRC application was not approved. {data.notes or ''}",
            type=NotificationType.SYSTEM)
        await notif.save()

    return {"message": f"GRC application {data.action}d"}


async def get_all_grc_members(page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    members = await GRCMember.find(GRCMember.is_active == True).skip(skip).limit(limit).to_list()
    total = await GRCMember.find(GRCMember.is_active == True).count()
    result = []
    for m in members:
        user = await User.get(m.farmer_id)
        result.append({
            "id": str(m.id), "farmer_id": m.farmer_id,
            "name": user.name if user else "Unknown",
            "verifications_count": m.verifications_count,
            "joined_at": m.accepted_at.isoformat(),
        })
    return {"page": page, "limit": limit, "total": total, "members": result}


async def remove_grc_member(user_id: str, admin: User) -> dict:
    member = await GRCMember.find_one(GRCMember.farmer_id == user_id)
    if not member: not_found("GRC Member")
    await member.delete()
    user = await User.get(user_id)
    if user and user.role == UserRole.GRC:
        user.role = UserRole.FARMER
        await user.save()
    return {"message": "GRC member removed"}


# ─── REWARDS / VOUCHERS / BADGES ─────────────────────────────

async def get_all_vouchers(page: int = 1, limit: int = 30) -> dict:
    skip = (page - 1) * limit
    vouchers = await Reward.find(Reward.reward_type == RewardType.VOUCHER).sort(-Reward.created_at).skip(skip).limit(limit).to_list()
    total = await Reward.find(Reward.reward_type == RewardType.VOUCHER).count()
    result = [{"id": str(v.id), "description": v.description, "points_cost": v.points_cost,
               "is_redeemed": v.is_redeemed, "created_at": v.created_at.isoformat(),
               "metadata": v.metadata} for v in vouchers]
    return {"page": page, "limit": limit, "total": total, "vouchers": result}


async def create_voucher(data: AdminVoucherRequest, admin: User) -> dict:
    voucher = Reward(
        farmer_id="admin_pool",
        reward_type=RewardType.VOUCHER,
        points_cost=data.points_cost,
        description=data.title,
        metadata={"title": data.title, "description": data.description,
                  "discount_percent": data.discount_percent,
                  "fixed_amount": data.fixed_amount,
                  "category": data.category,
                  "expiry_days": data.expiry_days},
    )
    await voucher.save()
    return {"message": "Voucher created", "id": str(voucher.id)}


async def delete_voucher(voucher_id: str, admin: User) -> dict:
    v = await Reward.get(voucher_id)
    if not v: not_found("Voucher")
    await v.delete()
    return {"message": "Voucher deleted"}


async def get_all_badges() -> dict:
    badges = await BadgeDefinition.find_all().to_list()
    return {"badges": [{"id": str(b.id), "code": b.code, "name": b.name,
                        "icon": b.icon, "tier": b.tier.value, "description": b.description,
                        "condition_type": b.condition_type, "condition_value": b.condition_value,
                        "is_active": b.is_active} for b in badges]}


async def create_badge(data: AdminBadgeRequest, admin: User) -> dict:
    import random, string
    code = "".join(random.choices(string.ascii_lowercase, k=8))
    from app.models.badge import BadgeTier
    badge = BadgeDefinition(
        code=code, name=data.name, description=data.description,
        icon=data.icon or "🏅",
        tier=BadgeTier(data.tier) if data.tier else BadgeTier.BEGINNER,
        condition_type=data.condition_type or "manual",
        condition_value=data.condition_value or 0,
    )
    await badge.save()
    return {"message": "Badge created", "id": str(badge.id)}


async def delete_badge(badge_id: str, admin: User) -> dict:
    b = await BadgeDefinition.get(badge_id)
    if not b: not_found("Badge")
    await b.delete()
    return {"message": "Badge deleted"}


# ─── LEADERBOARD ─────────────────────────────────────────────

async def get_admin_leaderboard(scope: str = "national", page: int = 1, limit: int = 50) -> dict:
    skip = (page - 1) * limit
    farms = await FarmProfile.find_all().sort(-FarmProfile.sustainability_score).skip(skip).limit(limit).to_list()
    total = await FarmProfile.find_all().count()
    result = []
    for i, farm in enumerate(farms):
        user = await User.get(farm.farmer_id)
        badges = await FarmerBadge.find(FarmerBadge.farmer_id == farm.farmer_id).count()
        result.append({
            "rank": skip + i + 1,
            "farmer_id": farm.farmer_id,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "role": user.role.value if user else "",
            "score": farm.sustainability_score,
            "badges_count": badges,
            "location": farm.location,
        })
    return {"page": page, "limit": limit, "total": total, "leaderboard": result}


# ─── NOTIFICATIONS ────────────────────────────────────────────

async def get_admin_notifications(page: int = 1, limit: int = 30) -> dict:
    skip = (page - 1) * limit
    # Show fraud flags + pending proofs as admin notifications
    flags = await FraudFlag.find(FraudFlag.status == "open").sort(-FraudFlag.created_at).limit(10).to_list()
    pending = await ProofSubmission.find(ProofSubmission.status == ProofStatus.PENDING_REVIEW).sort(-ProofSubmission.submitted_at).limit(10).to_list()

    alerts = []
    for f in flags:
        user = await User.get(f.farmer_id)
        alerts.append({"type": "fraud_flag", "severity": f.severity,
            "message": f"🚨 Fraud flag: {f.anomaly_type} by {user.name if user else f.farmer_id}",
            "created_at": f.created_at.isoformat(), "ref_id": str(f.id)})

    for p in pending:
        user = await User.get(p.farmer_id)
        alerts.append({"type": "pending_proof", "severity": "medium",
            "message": f"📋 Proof pending review from {user.name if user else p.farmer_id}",
            "created_at": p.submitted_at.isoformat(), "ref_id": str(p.id)})

    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    return {"total": len(alerts), "alerts": alerts[skip: skip + limit]}
