from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from app.schemas.order import OrderPublic
from app.schemas.product import ProductPublic

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    order_service = OrderService(db)
    product_service = ProductService(db)

    stats = await order_service.get_dashboard_stats()
    total_products = await product_service.list_all(limit=1)

    recent_orders = [
        {
            "id": str(o.id),
            "reference": o.reference,
            "customer_email": o.customer_email,
            "product_name": o.product.name if o.product else "Unknown",
            "amount": o.amount,
            "currency": o.currency,
            "status": o.status.value,
            "created_at": o.created_at.isoformat(),
        }
        for o in stats["recent_orders"]
    ]

    return {
        "total_products": total_products[1],
        "total_revenue_kobo": stats["total_revenue"],
        "total_revenue_naira": stats["total_revenue"] / 100,
        "paid_orders": stats["paid_orders"],
        "pending_orders": stats["pending_orders"],
        "failed_orders": stats["failed_orders"],
        "recent_orders": recent_orders,
    }
