import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_payment_initialize_success(client: AsyncClient, sample_product):
    """Payment init should create pending order and return Paystack URL."""
    mock_url = "https://checkout.paystack.com/test_url"

    with patch("app.api.v1.payments.initialize_payment", return_value=mock_url):
        response = await client.post("/api/payments/initialize", json={
            "product_id": str(sample_product.id),
            "customer_email": "buyer@example.com",
            "customer_name": "Test Buyer",
        })

    assert response.status_code == 200
    data = response.json()
    assert data["authorization_url"] == mock_url
    assert data["order_reference"].startswith("ORD-")


@pytest.mark.asyncio
async def test_payment_initialize_inactive_product(client: AsyncClient, db_session, sample_product):
    """Cannot initialize payment for inactive product."""
    sample_product.is_active = False
    await db_session.commit()

    response = await client.post("/api/payments/initialize", json={
        "product_id": str(sample_product.id),
        "customer_email": "buyer@example.com",
    })
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "PRODUCT_INACTIVE"

    # Restore
    sample_product.is_active = True
    await db_session.commit()


@pytest.mark.asyncio
async def test_payment_initialize_nonexistent_product(client: AsyncClient):
    """Cannot initialize payment for product that doesn't exist."""
    import uuid
    response = await client.post("/api/payments/initialize", json={
        "product_id": str(uuid.uuid4()),
        "customer_email": "buyer@example.com",
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_payment_verify_pending(client: AsyncClient, sample_product, db_session):
    """Verify returns pending status for pending order."""
    from app.models.order import Order
    order = Order(
        reference="ORD-TESTREF",
        product_id=sample_product.id,
        customer_email="test@example.com",
        amount=sample_product.price,
        currency="NGN",
    )
    db_session.add(order)
    await db_session.commit()

    response = await client.get("/api/payments/verify/ORD-TESTREF")
    assert response.status_code == 200
    assert response.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_webhook_invalid_signature(client: AsyncClient):
    """Webhook with invalid signature should return ignored."""
    import json
    response = await client.post(
        "/api/payments/webhook",
        content=json.dumps({"event": "charge.success", "data": {}}),
        headers={
            "Content-Type": "application/json",
            "x-paystack-signature": "invalidsignature",
        },
    )
    # Returns 200 but ignored (don't return 400 to prevent Paystack retrying with bad requests)
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"
