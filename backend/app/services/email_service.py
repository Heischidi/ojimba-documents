from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
import httpx
from jinja2 import Environment, BaseLoader

from app.core.config import settings
from app.core.logging import get_logger
from app.repositories.email_log_repo import EmailLogRepository
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

# ── Email HTML Template ───────────────────────────────────────────────────────
PURCHASE_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Purchase - {{ product_name }}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 40px 40px 32px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
  .checkmark { background: rgba(255,255,255,0.2); border-radius: 50%; width: 64px; height: 64px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
  .body { padding: 40px; }
  .greeting { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px; }
  .subtitle { color: #6b7280; font-size: 15px; margin-bottom: 32px; line-height: 1.6; }
  .order-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; margin-bottom: 32px; }
  .order-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
  .order-row:last-child { margin-bottom: 0; border-top: 1px solid #e5e7eb; padding-top: 12px; font-weight: 600; }
  .order-label { color: #6b7280; }
  .order-value { color: #111827; font-weight: 500; }
  .download-btn { display: block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .expiry-note { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
  .footer { text-align: center; color: #9ca3af; font-size: 13px; padding: 0 40px 40px; }
  .footer a { color: #7c3aed; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="checkmark">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1>Payment Successful! 🎉</h1>
    <p>Your digital product is ready to download</p>
  </div>

  <div class="body">
    <p class="greeting">Hi {{ customer_name }},</p>
    <p class="subtitle">
      Thank you for your purchase! Your payment for <strong>{{ product_name }}</strong> 
      was successful. Your secure download link is below.
    </p>

    <div class="order-card">
      <div class="order-row">
        <span class="order-label">Product</span>
        <span class="order-value">{{ product_name }}</span>
      </div>
      <div class="order-row">
        <span class="order-label">Order Reference</span>
        <span class="order-value">{{ order_reference }}</span>
      </div>
      <div class="order-row">
        <span class="order-label">Date</span>
        <span class="order-value">{{ purchase_date }}</span>
      </div>
      <div class="order-row">
        <span class="order-label">Amount Paid</span>
        <span class="order-value">{{ currency }} {{ amount_formatted }}</span>
      </div>
    </div>

    <a href="{{ download_url }}" class="download-btn">
      ⬇️ Download Your File
    </a>

    <p class="expiry-note">
      This download link expires on <strong>{{ expiry_date }}</strong> 
      and can be used up to <strong>{{ max_downloads }} times</strong>.
    </p>

    <hr class="divider">

    <p class="footer">
      Questions? Reply to this email or contact us at 
      <a href="mailto:{{ support_email }}">{{ support_email }}</a>.<br><br>
      This email was sent to {{ recipient_email }} because you made a purchase 
      on <a href="{{ app_url }}">{{ app_name }}</a>.
    </p>
  </div>
</div>
</body>
</html>
"""

jinja_env = Environment(loader=BaseLoader())


class EmailService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.log_repo = EmailLogRepository(db)

    async def send_purchase_confirmation(
        self,
        order_id: UUID,
        recipient_email: str,
        customer_name: Optional[str],
        product_name: str,
        order_reference: str,
        amount: int,  # in kobo
        currency: str,
        download_url: str,
        expiry_date: datetime,
        max_downloads: int,
    ) -> bool:
        """
        Sends purchase confirmation email with download link.
        Returns True on success, False on failure.
        Payment success NEVER depends on this returning True.
        """
        # Format values
        amount_formatted = f"{amount / 100:,.2f}"  # kobo → naira
        purchase_date = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")
        expiry_str = expiry_date.strftime("%B %d, %Y at %I:%M %p UTC")
        display_name = customer_name or recipient_email.split("@")[0].title()

        template = jinja_env.from_string(PURCHASE_EMAIL_TEMPLATE)
        html_body = template.render(
            customer_name=display_name,
            product_name=product_name,
            order_reference=order_reference,
            purchase_date=purchase_date,
            amount_formatted=amount_formatted,
            currency=currency,
            download_url=download_url,
            expiry_date=expiry_str,
            max_downloads=max_downloads,
            support_email=settings.EMAIL_FROM,
            recipient_email=recipient_email,
            app_name=settings.APP_NAME,
            app_url=settings.APP_URL,
        )

        return await self._send_email(
            order_id=order_id,
            to=recipient_email,
            subject=f"Your {product_name} download is ready 🎉",
            html=html_body,
            email_type="purchase_confirmation",
        )

    async def _send_email(
        self,
        order_id: UUID,
        to: str,
        subject: str,
        html: str,
        email_type: str,
    ) -> bool:
        """
        Sends email via Resend API. 
        Logs outcome regardless of success/failure.
        Returns True on success.
        """
        payload = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [to],
            "subject": subject,
            "html": html,
        }

        logger.info("email_send_attempt", type=email_type, to=to, order_id=str(order_id))

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    RESEND_API_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                provider_id = resp.json().get("id")

            await self.log_repo.create(
                order_id=order_id,
                recipient_email=to,
                email_type=email_type,
                status="sent",
                provider_id=provider_id,
            )
            logger.info("email_sent", type=email_type, to=to, provider_id=provider_id)
            return True

        except Exception as e:
            error_msg = str(e)
            logger.error("email_send_failed", type=email_type, to=to, error=error_msg)
            await self.log_repo.create(
                order_id=order_id,
                recipient_email=to,
                email_type=email_type,
                status="failed",
                error_message=error_msg,
            )
            return False
