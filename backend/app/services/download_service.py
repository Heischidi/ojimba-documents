from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import generate_download_token, hash_token
from app.core.exceptions import (
    TokenNotFoundError,
    TokenExpiredError,
    TokenRevokedError,
    DownloadLimitError,
    PaymentNotVerifiedError,
)
from app.core.logging import get_logger
from app.repositories.download_repo import DownloadRepository
from app.models.order import OrderStatus
from app.services.s3_service import generate_presigned_url

logger = get_logger(__name__)


class DownloadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DownloadRepository(db)

    async def create_token(self, order_id: UUID) -> str:
        """
        Creates a new download token for a paid order.
        Returns the raw token (to be sent to customer).
        The hash is stored in the database.
        """
        raw_token, token_hash = generate_download_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            hours=settings.DOWNLOAD_TOKEN_EXPIRY_HOURS
        )

        await self.repo.create(
            order_id=order_id,
            token_hash=token_hash,
            expires_at=expires_at,
            max_downloads=settings.MAX_DOWNLOADS,
        )

        logger.info(
            "download_token_created",
            order_id=str(order_id),
            expires_at=expires_at.isoformat(),
            max_downloads=settings.MAX_DOWNLOADS,
        )
        return raw_token

    async def create_fresh_token(self, order_id: UUID) -> str:
        """Revokes existing tokens and creates a fresh one (for admin resend)."""
        await self.repo.revoke_all_for_order(order_id)
        return await self.create_token(order_id)

    async def validate_and_get_download_url(self, raw_token: str, file_key: str) -> str:
        """
        Full validation pipeline:
        1. Hash the raw token
        2. Look up in DB
        3. Check expiry
        4. Check revocation
        5. Check download limit
        6. Verify order is PAID
        7. Increment download count
        8. Generate and return short-lived S3 presigned URL
        """
        token_hash = hash_token(raw_token)

        token = await self.repo.get_by_token_hash(token_hash)

        if not token:
            logger.warning("download_token_not_found", hash_prefix=token_hash[:8])
            raise TokenNotFoundError()

        # Load order to check status
        await self.db.refresh(token, ["order"])

        if token.is_expired:
            logger.warning(
                "download_token_expired",
                token_id=str(token.id),
                expired_at=token.expires_at.isoformat(),
            )
            raise TokenExpiredError()

        if token.is_revoked:
            logger.warning("download_token_revoked", token_id=str(token.id))
            raise TokenRevokedError()

        if token.is_limit_reached:
            logger.warning(
                "download_limit_reached",
                token_id=str(token.id),
                count=token.download_count,
                max=token.max_downloads,
            )
            raise DownloadLimitError()

        if token.order.status != OrderStatus.PAID:
            logger.warning(
                "download_order_not_paid",
                order_id=str(token.order_id),
                status=token.order.status,
            )
            raise PaymentNotVerifiedError()

        # All checks passed — increment count and generate URL
        await self.repo.increment_download_count(token)

        signed_url = generate_presigned_url(file_key, expiry_seconds=settings.S3_SIGNED_URL_EXPIRY)

        logger.info(
            "download_served",
            token_id=str(token.id),
            order_id=str(token.order_id),
            count=token.download_count,
        )
        return signed_url

    async def revoke_token_by_order(self, order_id: UUID) -> None:
        await self.repo.revoke_all_for_order(order_id)
        logger.info("download_tokens_revoked", order_id=str(order_id))
