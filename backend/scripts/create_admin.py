"""
Admin seed script.
Run this once to create the initial admin user.

Usage:
    python scripts/create_admin.py

Environment variables required:
    DATABASE_URL
    JWT_SECRET
    (all other settings from .env)
"""
import asyncio
import os
import sys
import getpass

# Add backend/ to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import AsyncSessionLocal
from app.services.auth_service import AuthService


async def create_admin():
    print("\n=== Digital Marketplace — Create Admin User ===\n")

    email = input("Admin email: ").strip()
    name = input("Admin name: ").strip()
    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm password: ")

    if not email or not name:
        print("Email and name are required.")
        sys.exit(1)

    if password != confirm:
        print("Passwords do not match.")
        sys.exit(1)

    if len(password) < 8:
        print("Password must be at least 8 characters.")
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        try:
            service = AuthService(db)
            admin = await service.create_admin(email=email, password=password, name=name)
            await db.commit()
            print(f"\n✅ Admin created successfully!")
            print(f"   Email: {admin.email}")
            print(f"   Name:  {admin.name}")
            print(f"   ID:    {admin.id}")
            print(f"\nYou can now log in at /admin/login\n")
        except ValueError as e:
            print(f"\n❌ Error: {e}\n")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_admin())
