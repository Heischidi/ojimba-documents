from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.order import Order, OrderStatus
from app.repositories.order_repo import OrderRepository

router = APIRouter(prefix="/admin/customers", tags=["admin-customers"])


@router.get("")
async def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Lists unique customers (by email) with their purchase stats.
    Customers don't have accounts — they are identified by email.
    """
    # Aggregate by email
    query = (
        select(
            Order.customer_email,
            Order.customer_name,
            func.count(Order.id).label("total_orders"),
            func.sum(
                __import__("sqlalchemy", fromlist=["case"]).case(
                    (Order.status == OrderStatus.PAID, Order.amount), else_=0
                )
            ).label("total_spent"),
            func.max(Order.created_at).label("last_purchase"),
        )
        .group_by(Order.customer_email, Order.customer_name)
        .order_by(func.max(Order.created_at).desc())
    )

    if search:
        query = query.where(Order.customer_email.ilike(f"%{search}%"))

    count_query = select(func.count(func.distinct(Order.customer_email)))
    if search:
        count_query = count_query.where(Order.customer_email.ilike(f"%{search}%"))

    total = (await db.execute(count_query)).scalar_one()
    rows = (await db.execute(query.offset(skip).limit(limit))).all()

    customers = [
        {
            "email": row.customer_email,
            "name": row.customer_name,
            "total_orders": row.total_orders,
            "total_spent_kobo": row.total_spent or 0,
            "total_spent_naira": (row.total_spent or 0) / 100,
            "last_purchase": row.last_purchase.isoformat() if row.last_purchase else None,
        }
        for row in rows
    ]

    return {"items": customers, "total": total, "skip": skip, "limit": limit}
