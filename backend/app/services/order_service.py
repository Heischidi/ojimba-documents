from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import generate_order_reference
from app.core.exceptions import OrderNotFoundError, DuplicateError
from app.core.logging import get_logger
from app.repositories.order_repo import OrderRepository
from app.models.order import Order, OrderStatus

logger = get_logger(__name__)


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OrderRepository(db)

    async def create_pending_order(
        self,
        product_id: UUID,
        customer_email: str,
        amount: int,
        currency: str = "NGN",
        customer_name: Optional[str] = None,
    ) -> Order:
        reference = generate_order_reference()
        # Ensure reference is unique (extremely unlikely to collide, but safe)
        max_attempts = 5
        for _ in range(max_attempts):
            existing = await self.repo.get_by_reference(reference)
            if not existing:
                break
            reference = generate_order_reference()

        order = await self.repo.create(
            reference=reference,
            product_id=product_id,
            customer_email=customer_email,
            amount=amount,
            currency=currency,
            customer_name=customer_name,
        )
        logger.info(
            "order_created",
            order_id=str(order.id),
            reference=reference,
            email=customer_email,
            amount=amount,
        )
        return order

    async def get_order_by_id(self, order_id: str | UUID) -> Order:
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise OrderNotFoundError()
        return order

    async def get_order_by_reference(self, reference: str) -> Order:
        order = await self.repo.get_by_reference(reference)
        if not order:
            raise OrderNotFoundError()
        return order

    async def mark_paid(self, order: Order, payment_reference: str) -> Order:
        updated = await self.repo.update_status(
            order, OrderStatus.PAID, payment_reference=payment_reference
        )
        logger.info(
            "order_paid",
            order_id=str(order.id),
            reference=order.reference,
            payment_reference=payment_reference,
        )
        return updated

    async def mark_failed(self, order: Order) -> Order:
        updated = await self.repo.update_status(order, OrderStatus.FAILED)
        logger.warning("order_failed", order_id=str(order.id))
        return updated

    async def list_all(self, skip: int = 0, limit: int = 50, search: Optional[str] = None, status: Optional[str] = None):
        status_enum = OrderStatus(status) if status else None
        return await self.repo.list_all(skip=skip, limit=limit, search=search, status=status_enum)

    async def get_dashboard_stats(self) -> dict:
        return {
            "total_revenue": await self.repo.total_revenue(),
            "paid_orders": await self.repo.count_by_status(OrderStatus.PAID),
            "pending_orders": await self.repo.count_by_status(OrderStatus.PENDING),
            "failed_orders": await self.repo.count_by_status(OrderStatus.FAILED),
            "recent_orders": await self.repo.recent(limit=5),
        }
