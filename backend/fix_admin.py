import asyncio
from app.database import connect_db
from app.models.user import User, UserRole, UserStatus
from app.utils.password_utils import hash_password

async def fix_admin():
    await connect_db()
    
    admin_email = "admin@goo.farm"
    admin_pass = "GOO@Admin2024!"
    
    admin = await User.find_one(User.email == admin_email)
    
    if admin:
        print(f"Found admin account. Current role: {admin.role.value}")
        admin.role = UserRole.ADMIN
        admin.password_hash = hash_password(admin_pass)
        admin.status = UserStatus.ACTIVE
        await admin.save()
        print("Updated admin account role and password.")
    else:
        print("Admin account not found. Creating...")
        admin = User(
            name="GOO Admin",
            email=admin_email,
            password_hash=hash_password(admin_pass),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_verified=True,
            email_verified=True,
        )
        await admin.insert()
        print("Created admin account.")

if __name__ == "__main__":
    asyncio.run(fix_admin())
