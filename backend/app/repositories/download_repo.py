from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.download_token import DownloadToken


class DownloadRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_token_hash(self, token_hash: str) -> Optional[DownloadToken]:
        result = await self.db.execute(
            select(DownloadToken).where(DownloadToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def get_active_for_order(self, order_id: UUID) -> List[DownloadToken]:
        result = await self.db.execute(
            select(DownloadToken).where(
                DownloadToken.order_id == order_id,
                DownloadToken.revoked_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def create(
        self,
        order_id: UUID,
        token_hash: str,
        expires_at: datetime,
        max_downloads: int,
    ) -> DownloadToken:
        token = DownloadToken(
            order_id=order_id,
            token_hash=token_hash,
            expires_at=expires_at,
            max_downloads=max_downloads,
        )
        self.db.add(token)
        await self.db.flush()
        return token

    async def increment_download_count(self, token: DownloadToken) -> DownloadToken:
        token.download_count += 1
        token.last_downloaded_at = datetime.now(timezone.utc)
        await self.db.flush()
        return token

    async def revoke(self, token: DownloadToken) -> DownloadToken:
        token.revoked_at = datetime.now(timezone.utc)
        await self.db.flush()
        return token

    async def revoke_all_for_order(self, order_id: UUID) -> None:
        tokens = await self.get_active_for_order(order_id)
        now = datetime.now(timezone.utc)
        for token in tokens:
            token.revoked_at = now
        await self.db.flush()
