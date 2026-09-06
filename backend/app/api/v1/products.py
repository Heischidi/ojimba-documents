from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.product import ProductPublic, PaginatedProducts
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductPublic])
async def list_products(db: AsyncSession = Depends(get_db)):
    """Returns all active products for the public storefront."""
    service = ProductService(db)
    products = await service.get_active_products()
    return products


@router.get("/slug/{slug}", response_model=ProductPublic)
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Returns a single active product by slug."""
    service = ProductService(db)
    return await service.get_product_by_slug(slug)


@router.get("/{product_id}", response_model=ProductPublic)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Returns a single active product by ID."""
    service = ProductService(db)
    return await service.get_product_by_id(product_id)
