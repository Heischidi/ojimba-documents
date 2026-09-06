from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.order import OrderPublic, OrderDetail, PaginatedOrders
from app.services.order_service import OrderService
from app.services.download_service import DownloadService
from app.services.email_service import EmailService
from app.repositories.audit_log_repo import AuditLogRepository
from app.repositories.order_repo import OrderRepository
from app.core.exceptions import OrderNotFoundError
from app.models.order import OrderStatus
from datetime import datetime, timezone, timedelta

logger = get_logger(__name__)
router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


@router.get("", response_model=PaginatedOrders)
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = OrderService(db)
    orders, total = await service.list_all(skip=skip, limit=limit, search=search, status=status)
    return PaginatedOrders(items=orders, total=total, skip=skip, limit=limit)


@router.get("/{order_id}", response_model=OrderDetail)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = OrderService(db)
    return await service.get_order_by_id(order_id)


@router.post("/{order_id}/resend-email")
async def resend_download_email(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Revokes existing download tokens, generates a fresh one,
    and resends the purchase confirmation email.
    Only works for PAID orders.
    """
    order_service = OrderService(db)
    order = await order_service.get_order_by_id(order_id)

    if order.status != OrderStatus.PAID:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail={"code": "ORDER_NOT_PAID", "message": "Cannot resend email for an unpaid order."},
        )

    download_service = DownloadService(db)
    raw_token = await download_service.create_fresh_token(order.id)
    download_url = f"{settings.APP_URL}/download/{raw_token}"

    email_service = EmailService(db)
    sent = await email_service.send_purchase_confirmation(
        order_id=order.id,
        recipient_email=order.customer_email,
        customer_name=order.customer_name,
        product_name=order.product.name,
        order_reference=order.reference,
        amount=order.amount,
        currency=order.currency,
        download_url=download_url,
        expiry_date=datetime.now(timezone.utc) + timedelta(hours=settings.DOWNLOAD_TOKEN_EXPIRY_HOURS),
        max_downloads=settings.MAX_DOWNLOADS,
    )

    audit = AuditLogRepository(db)
    await audit.create(
        action="order.email_resent",
        admin_id=admin.id,
        entity_type="order",
        entity_id=order_id,
        metadata={"email": order.customer_email, "email_sent": sent},
    )

    logger.info("admin_resend_email", admin=str(admin.id), order=order_id, sent=sent)
    return {"success": True, "email_sent": sent}


@router.post("/{order_id}/revoke-access")
async def revoke_download_access(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Revokes all download tokens for an order."""
    download_service = DownloadService(db)
    await download_service.revoke_token_by_order(order_id)

    audit = AuditLogRepository(db)
    await audit.create(
        action="order.access_revoked",
        admin_id=admin.id,
        entity_type="order",
        entity_id=order_id,
    )
    return {"success": True, "message": "Download access revoked."}
