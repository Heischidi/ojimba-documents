from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.admin_user import AdminUser


class AdminRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, admin_id: str | UUID) -> Optional[AdminUser]:
        result = await self.db.execute(
            select(AdminUser).where(AdminUser.id == admin_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[AdminUser]:
        result = await self.db.execute(
            select(AdminUser).where(AdminUser.email == email)
        )
        return result.scalar_one_or_none()

    async def create(self, email: str, password_hash: str, name: str) -> AdminUser:
        admin = AdminUser(email=email, password_hash=password_hash, name=name)
        self.db.add(admin)
        await self.db.flush()
        return admin

    async def update_active(self, admin: AdminUser, is_active: bool) -> AdminUser:
        admin.is_active = is_active
        await self.db.flush()
        return admin
