import pytest
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient


async def create_paid_order_with_token(db_session, sample_product):
    """Helper: create a PAID order and valid download token."""
    from app.models.order import Order, OrderStatus
    from app.models.download_token import DownloadToken

    order = Order(
        reference=f"ORD-{secrets.token_hex(4).upper()}",
        product_id=sample_product.id,
        customer_email="buyer@example.com",
        amount=sample_product.price,
        currency="NGN",
        status=OrderStatus.PAID,
        payment_reference="pay_test_123",
    )
    db_session.add(order)
    await db_session.flush()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    token = DownloadToken(
        order_id=order.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48),
        max_downloads=5,
    )
    db_session.add(token)
    await db_session.commit()

    return order, raw_token, token


@pytest.mark.asyncio
async def test_download_invalid_token(client: AsyncClient):
    """Random tokens should return 404."""
    response = await client.get("/api/download/completely-invalid-token-xyz")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "TOKEN_NOT_FOUND"


@pytest.mark.asyncio
async def test_download_expired_token(client: AsyncClient, db_session, sample_product):
    """Expired tokens should return 410 Gone."""
    from app.models.order import Order, OrderStatus
    from app.models.download_token import DownloadToken

    order = Order(
        reference=f"ORD-EXP{secrets.token_hex(2).upper()}",
        product_id=sample_product.id,
        customer_email="buyer@example.com",
        amount=sample_product.price,
        currency="NGN",
        status=OrderStatus.PAID,
    )
    db_session.add(order)
    await db_session.flush()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    token = DownloadToken(
        order_id=order.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),  # already expired
        max_downloads=5,
    )
    db_session.add(token)
    await db_session.commit()

    response = await client.get(f"/api/download/{raw_token}")
    assert response.status_code == 410
    assert response.json()["error"]["code"] == "TOKEN_EXPIRED"


@pytest.mark.asyncio
async def test_download_revoked_token(client: AsyncClient, db_session, sample_product):
    """Revoked tokens should return 410."""
    from app.models.order import Order, OrderStatus
    from app.models.download_token import DownloadToken

    order = Order(
        reference=f"ORD-REV{secrets.token_hex(2).upper()}",
        product_id=sample_product.id,
        customer_email="buyer@example.com",
        amount=sample_product.price,
        currency="NGN",
        status=OrderStatus.PAID,
    )
    db_session.add(order)
    await db_session.flush()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    token = DownloadToken(
        order_id=order.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48),
        max_downloads=5,
        revoked_at=datetime.now(timezone.utc),  # revoked
    )
    db_session.add(token)
    await db_session.commit()

    response = await client.get(f"/api/download/{raw_token}")
    assert response.status_code == 410
    assert response.json()["error"]["code"] == "TOKEN_REVOKED"


@pytest.mark.asyncio
async def test_download_limit_reached(client: AsyncClient, db_session, sample_product):
    """Tokens at max download count should return 410."""
    from app.models.order import Order, OrderStatus
    from app.models.download_token import DownloadToken

    order = Order(
        reference=f"ORD-LIM{secrets.token_hex(2).upper()}",
        product_id=sample_product.id,
        customer_email="buyer@example.com",
        amount=sample_product.price,
        currency="NGN",
        status=OrderStatus.PAID,
    )
    db_session.add(order)
    await db_session.flush()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    token = DownloadToken(
        order_id=order.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48),
        max_downloads=3,
        download_count=3,  # already at limit
    )
    db_session.add(token)
    await db_session.commit()

    response = await client.get(f"/api/download/{raw_token}")
    assert response.status_code == 410
    assert response.json()["error"]["code"] == "DOWNLOAD_LIMIT_REACHED"
