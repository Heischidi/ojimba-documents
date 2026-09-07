from typing import Optional
import httpx
from app.core.config import settings
from app.core.security import verify_paystack_signature
from app.core.exceptions import (
    PaymentInitError,
    PaymentAmountMismatch,
    PaymentNotVerifiedError,
    OrderNotFoundError,
)
from app.core.logging import get_logger
from app.models.order import Order, OrderStatus

logger = get_logger(__name__)

PAYSTACK_HEADERS = {
    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    "Content-Type": "application/json",
}


async def initialize_payment(
    order: Order,
    callback_url: str,
    subaccount_code: Optional[str] = None,
) -> str:
    """
    Initializes a Paystack transaction.
    Returns the Paystack authorization_url to redirect the customer.
    Amount is in kobo (smallest NGN unit).
    """
    payload = {
        "email": order.customer_email,
        "amount": order.amount,  # kobo
        "reference": order.reference,
        "callback_url": callback_url,
        "currency": order.currency,
        "metadata": {
            "order_id": str(order.id),
            "product_id": str(order.product_id),
            "custom_fields": [
                {
                    "display_name": "Order Reference",
                    "variable_name": "order_reference",
                    "value": order.reference,
                }
            ],
        },
    }

    if subaccount_code:
        payload["subaccount"] = subaccount_code
        payload["transaction_charge"] = 0 # 100% of amount minus paystack fees goes to vendor

    logger.info("paystack_init_start", reference=order.reference, amount=order.amount, subaccount=subaccount_code)

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{settings.PAYSTACK_BASE_URL}/transaction/initialize",
                json=payload,
                headers=PAYSTACK_HEADERS,
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as e:
            logger.error("paystack_init_http_error", status=e.response.status_code, body=e.response.text)
            raise PaymentInitError(f"Paystack returned {e.response.status_code}.")
        except httpx.RequestError as e:
            logger.error("paystack_init_network_error", error=str(e))
            raise PaymentInitError("Could not reach Paystack. Please try again.")

    if not data.get("status"):
        logger.error("paystack_init_failed", message=data.get("message"), reference=order.reference)
        raise PaymentInitError(data.get("message", "Payment initialization failed."))

    auth_url = data["data"]["authorization_url"]
    logger.info("paystack_init_success", reference=order.reference, url=auth_url[:50])
    return auth_url


async def verify_transaction(reference: str) -> dict:
    """
    Verifies a Paystack transaction by reference.
    Returns the full transaction data dict.
    """
    logger.info("paystack_verify_start", reference=reference)

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                f"{settings.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers=PAYSTACK_HEADERS,
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as e:
            logger.error("paystack_verify_http_error", status=e.response.status_code)
            raise PaymentNotVerifiedError()
        except httpx.RequestError as e:
            logger.error("paystack_verify_network_error", error=str(e))
            raise PaymentNotVerifiedError()

    if not data.get("status") or data["data"]["status"] != "success":
        logger.warning("paystack_verify_not_success", reference=reference, data=data.get("data", {}).get("status"))
        raise PaymentNotVerifiedError()

    logger.info("paystack_verify_success", reference=reference)
    return data["data"]


def validate_webhook_signature(payload: bytes, signature: str) -> bool:
    """Returns True if the webhook signature is valid."""
    return verify_paystack_signature(payload, signature)


def extract_webhook_event(body: dict) -> tuple[str, dict]:
    """Returns (event_type, event_data) from webhook body."""
    return body.get("event", ""), body.get("data", {})


async def process_charge_success(
    event_data: dict,
    order: Order,
) -> bool:
    """
    Validates the webhook charge.success event against the order.
    Returns True if everything is valid.
    Raises exceptions for any mismatch.
    """
    # 1. Verify amounts match (in kobo)
    paid_amount = event_data.get("amount", 0)
    if paid_amount != order.amount:
        logger.error(
            "webhook_amount_mismatch",
            expected=order.amount,
            received=paid_amount,
            reference=order.reference,
        )
        raise PaymentAmountMismatch()

    # 2. Verify currency
    paid_currency = event_data.get("currency", "").upper()
    if paid_currency and paid_currency != order.currency.upper():
        logger.error(
            "webhook_currency_mismatch",
            expected=order.currency,
            received=paid_currency,
        )
        raise PaymentAmountMismatch()

    # 3. Verify status from Paystack
    if event_data.get("status") != "success":
        logger.warning("webhook_status_not_success", status=event_data.get("status"))
        return False

    return True
