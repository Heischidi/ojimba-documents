from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.services.download_service import DownloadService
from app.services.product_service import ProductService
from app.repositories.order_repo import OrderRepository
from app.models.order import OrderStatus
from app.core.exceptions import PaymentNotVerifiedError, ProductNotFoundError

logger = get_logger(__name__)
router = APIRouter(prefix="/download", tags=["downloads"])


@router.get("/{token}")
async def download_file(token: str, db: AsyncSession = Depends(get_db)):
    """
    Secure download endpoint.
    Validates token → checks expiry → checks revocation → checks download limit
    → confirms order is PAID → increments count → generates short-lived S3 URL
    → redirects customer.
    
    The S3 object key is NEVER exposed to the customer.
    """
    download_service = DownloadService(db)
    order_repo = OrderRepository(db)

    # Validate token and get the order
    from app.core.security import hash_token
    from app.repositories.download_repo import DownloadRepository
    download_repo = DownloadRepository(db)

    from app.core.security import hash_token as ht
    token_hash = ht(token)
    db_token = await download_repo.get_by_token_hash(token_hash)

    if not db_token:
        from app.core.exceptions import TokenNotFoundError
        raise TokenNotFoundError()

    # Load order with product
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.order import Order

    result = await db.execute(
        select(Order).options(selectinload(Order.product)).where(Order.id == db_token.order_id)
    )
    order = result.scalar_one_or_none()

    if not order or not order.product or not order.product.file_key:
        raise ProductNotFoundError()

    # Run full validation pipeline and get S3 presigned URL
    signed_url = await download_service.validate_and_get_download_url(
        raw_token=token,
        file_key=order.product.file_key,
    )

    logger.info(
        "download_redirect",
        order_id=str(order.id),
        product=order.product.name,
    )

    # Redirect to short-lived S3 URL — customer never sees the actual S3 key
    return RedirectResponse(url=signed_url, status_code=302)
