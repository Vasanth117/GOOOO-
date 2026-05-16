"""
Admin Seeder — ensures the single admin account always exists in the DB.
Credentials: admin@goo.farm / GOO@Admin2024!
"""
import logging
from app.models.user import User, UserRole, UserStatus
from app.utils.password_utils import hash_password, verify_password

logger = logging.getLogger(__name__)

ADMIN_EMAIL = "admin@goo.farm"
ADMIN_PASSWORD = "GOO@Admin2024!"


async def seed_admin_user():
    """Create the admin user if it doesn't already exist."""
    try:
        existing = await User.find_one(User.email == ADMIN_EMAIL)

        if existing:
            # Ensure role is still ADMIN (safety check)
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                await existing.save()
                logger.info("🔧 Admin role restored for existing admin account.")
            else:
                logger.info("✅ Admin account already exists — skipping seed.")
            return

        # Create fresh admin account
        admin = User(
            name="GOO Admin",
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_verified=True,
            email_verified=True,
        )
        await admin.save()
        logger.info(f"🌿 Admin account seeded: {ADMIN_EMAIL}")

    except Exception as e:
        logger.error(f"❌ Failed to seed admin user: {e}")
