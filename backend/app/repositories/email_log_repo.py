from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.email_log import EmailLog


class EmailLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        order_id: UUID,
        recipient_email: str,
        email_type: str,
        status: str,
        provider_id: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> EmailLog:
        log = EmailLog(
            order_id=order_id,
            recipient_email=recipient_email,
            email_type=email_type,
            status=status,
            provider_id=provider_id,
            sent_at=datetime.now(timezone.utc) if status == "sent" else None,
            error_message=error_message,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_for_order(self, order_id: UUID) -> List[EmailLog]:
        result = await self.db.execute(
            select(EmailLog)
            .where(EmailLog.order_id == order_id)
            .order_by(EmailLog.sent_at.desc())
        )
        return list(result.scalars().all())
