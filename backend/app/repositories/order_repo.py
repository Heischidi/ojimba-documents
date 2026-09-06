from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderStatus
from app.models.product import Product


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, order_id: str | UUID) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.product), selectinload(Order.download_tokens), selectinload(Order.email_logs))
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_reference(self, reference: str) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.product))
            .where(Order.reference == reference)
        )
        return result.scalar_one_or_none()

    async def get_by_payment_reference(self, payment_reference: str) -> Optional[Order]:
        result = await self.db.execute(
            select(Order).where(Order.payment_reference == payment_reference)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        reference: str,
        product_id: UUID,
        customer_email: str,
        amount: int,
        currency: str = "NGN",
        customer_name: Optional[str] = None,
    ) -> Order:
        order = Order(
            reference=reference,
            product_id=product_id,
            customer_email=customer_email,
            customer_name=customer_name,
            amount=amount,
            currency=currency,
        )
        self.db.add(order)
        await self.db.flush()
        return order

    async def update_status(
        self,
        order: Order,
        status: OrderStatus,
        payment_reference: Optional[str] = None,
    ) -> Order:
        order.status = status
        if payment_reference:
            order.payment_reference = payment_reference
        order.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return order

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        status: Optional[OrderStatus] = None,
    ) -> tuple[List[Order], int]:
        query = select(Order).options(selectinload(Order.product))
        count_query = select(func.count(Order.id))

        if search:
            query = query.where(
                (Order.customer_email.ilike(f"%{search}%")) |
                (Order.reference.ilike(f"%{search}%"))
            )
            count_query = count_query.where(
                (Order.customer_email.ilike(f"%{search}%")) |
                (Order.reference.ilike(f"%{search}%"))
            )
        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        total = (await self.db.execute(count_query)).scalar_one()
        orders = (
            await self.db.execute(
                query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
            )
        ).scalars().all()

        return list(orders), total

    async def count_by_status(self, status: OrderStatus) -> int:
        result = await self.db.execute(
            select(func.count(Order.id)).where(Order.status == status)
        )
        return result.scalar_one()

    async def total_revenue(self) -> int:
        result = await self.db.execute(
            select(func.sum(Order.amount)).where(Order.status == OrderStatus.PAID)
        )
        return result.scalar_one() or 0

    async def list_by_email(self, email: str) -> List[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.product))
            .where(Order.customer_email == email)
            .order_by(Order.created_at.desc())
        )
        return list(result.scalars().all())

    async def recent(self, limit: int = 10) -> List[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.product))
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
