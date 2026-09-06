import json
from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import (
    ProductInactiveError,
    PaymentInitError,
    PaymentNotVerifiedError,
    OrderNotFoundError,
)
from app.core.logging import get_logger
from app.schemas.auth import PaymentInitRequest, PaymentInitResponse, PaymentVerifyResponse
from app.services.product_service import ProductService
from app.services.order_service import OrderService
from app.services.payment_service import (
    initialize_payment,
    verify_transaction,
    validate_webhook_signature,
    extract_webhook_event,
    process_charge_success,
)
from app.services.download_service import DownloadService
from app.services.email_service import EmailService
from app.models.order import Order, OrderStatus

logger = get_logger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initialize", response_model=PaymentInitResponse)
async def initialize(
    body: PaymentInitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a pending order and returns Paystack authorization URL.
    Price is ALWAYS read from the database — never from the frontend.
    """
    product_service = ProductService(db)
    order_service = OrderService(db)

    # Validate product exists and is active
    product = await product_service.get_active_product_for_purchase(body.product_id)

    # Create pending order with DB price
    order = await order_service.create_pending_order(
        product_id=product.id,
        customer_email=body.customer_email,
        amount=product.price,  # ← always from DB
        currency=product.currency,
        customer_name=body.customer_name,
    )

    callback_url = f"{settings.APP_URL}/payment/success?reference={order.reference}"

    auth_url = await initialize_payment(order=order, callback_url=callback_url)

    return PaymentInitResponse(
        authorization_url=auth_url,
        order_reference=order.reference,
        order_id=str(order.id),
    )


@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives Paystack webhook events.
    HMAC-SHA512 signature verified before any processing.
    Idempotent — duplicate webhooks do not re-process paid orders.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    # 1. Verify signature
    if not validate_webhook_signature(raw_body, signature):
        logger.warning("webhook_invalid_signature", sig_prefix=signature[:16])
        # Return 200 to prevent Paystack retrying bad requests
        return {"status": "ignored", "reason": "invalid_signature"}

    body = json.loads(raw_body)
    event_type, event_data = extract_webhook_event(body)

    logger.info("webhook_received", event=event_type)

    if event_type == "charge.success":
        await _handle_charge_success(event_data, db)

    return {"status": "ok"}


async def _handle_charge_success(event_data: dict, db: AsyncSession) -> None:
    """Processes a successful charge event."""
    reference = event_data.get("reference")
    if not reference:
        logger.warning("webhook_no_reference")
        return

    order_service = OrderService(db)

    # Find order by reference
    result = await db.execute(select(Order).where(Order.reference == reference))
    order = result.scalar_one_or_none()

    if not order:
        logger.warning("webhook_order_not_found", reference=reference)
        return

    # IDEMPOTENCY: If already paid, do nothing
    if order.status == OrderStatus.PAID:
        logger.info("webhook_already_paid_idempotent", reference=reference)
        return

    # Validate amounts match
    try:
        valid = await process_charge_success(event_data, order)
    except Exception as e:
        logger.error("webhook_validation_failed", error=str(e), reference=reference)
        return

    if not valid:
        await order_service.mark_failed(order)
        return

    # Mark order as PAID
    payment_reference = str(event_data.get("id") or event_data.get("reference"))
    await order_service.mark_paid(order, payment_reference=payment_reference)

    # Generate download token
    download_service = DownloadService(db)
    raw_token = await download_service.create_token(order.id)
    download_url = f"{settings.APP_URL}/download/{raw_token}"

    # Load product for email
    result = await db.execute(
        select(Order).options(selectinload(Order.product)).where(Order.id == order.id)
    )
    order_with_product = result.scalar_one()

    # Send confirmation email (failure does NOT roll back the order)
    email_service = EmailService(db)
    await email_service.send_purchase_confirmation(
        order_id=order.id,
        recipient_email=order.customer_email,
        customer_name=order.customer_name,
        product_name=order_with_product.product.name,
        order_reference=order.reference,
        amount=order.amount,
        currency=order.currency,
        download_url=download_url,
        expiry_date=datetime.now(timezone.utc) + timedelta(hours=settings.DOWNLOAD_TOKEN_EXPIRY_HOURS),
        max_downloads=settings.MAX_DOWNLOADS,
    )


@router.get("/verify/{reference}", response_model=PaymentVerifyResponse)
async def verify_payment(
    reference: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Server-side verification endpoint.
    Frontend calls this after redirect to confirm payment status from DB.
    Does NOT mark order as paid — that is done exclusively by the webhook.
    """
    order_service = OrderService(db)
    order = await order_service.get_order_by_reference(reference)

    return PaymentVerifyResponse(
        status=order.status.value,
        order_reference=order.reference,
        amount=order.amount,
        currency=order.currency,
    )
