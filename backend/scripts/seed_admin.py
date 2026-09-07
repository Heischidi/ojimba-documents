"""
One-time admin seed script — runs non-interactively.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import AsyncSessionLocal
from app.services.auth_service import AuthService

EMAIL    = "admin@ojimba.com"
NAME     = "Ojimba age grade"
PASSWORD = "DigiStore@2026!"

async def seed():
    async with AsyncSessionLocal() as db:
        try:
            service = AuthService(db)
            admin = await service.create_admin(email=EMAIL, password=PASSWORD, name=NAME)
            await db.commit()
            print(f"\n✅ Admin created!")
            print(f"   Email:    {admin.email}")
            print(f"   Name:     {admin.name}")
            print(f"   Password: {PASSWORD}")
            print(f"\nLogin at /admin/login\n")
        except ValueError as e:
            print(f"\n❌ {e}\n")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(seed())
