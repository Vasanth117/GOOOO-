from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── AUTH ─────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: str
    password: str


# ─── USER MANAGEMENT ─────────────────────────────────────────

class UpdateUserRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(farmer|expert|seller|admin|grc)$")


class BanUserRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None


class AdjustPointsRequest(BaseModel):
    delta: int  # positive = add, negative = deduct
    reason: str


# ─── FRAUD MANAGEMENT ─────────────────────────────────────────

class FraudFlagReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(resolved|dismissed)$")
    admin_notes: str


# ─── GRC ─────────────────────────────────────────────────────

class GRCApplicationActionRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None


# ─── REWARDS ─────────────────────────────────────────────────

class AdminVoucherRequest(BaseModel):
    title: str
    description: str
    discount_percent: Optional[int] = None
    fixed_amount: Optional[float] = None
    points_cost: int
    expiry_days: int = 30
    category: Optional[str] = "general"


class AdminBadgeRequest(BaseModel):
    name: str
    description: str
    icon: Optional[str] = "🏅"
    tier: Optional[str] = "bronze"
    condition_type: Optional[str] = None
    condition_value: Optional[int] = None


# ─── RESPONSE SCHEMAS ────────────────────────────────────────

class AdminUserOverview(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: str


class AdminDashboardStats(BaseModel):
    total_users: int
    total_farmers: int
    total_experts: int
    total_sellers: int
    total_grc_members: int
    total_farms: int
    total_missions_completed: int
    total_proofs_submitted: int
    open_fraud_flags: int
    average_sustainability_score: float
