from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: str | UUID) -> Optional[Product]:
        result = await self.db.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        result = await self.db.execute(
            select(Product).where(Product.slug == slug)
        )
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str, exclude_id: Optional[UUID] = None) -> bool:
        query = select(Product.id).where(Product.slug == slug)
        if exclude_id:
            query = query.where(Product.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def list_active(self) -> List[Product]:
        result = await self.db.execute(
            select(Product).where(Product.is_active == True).order_by(Product.created_at.desc())  # noqa: E712
        )
        return list(result.scalars().all())

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Product], int]:
        query = select(Product)
        count_query = select(func.count(Product.id))

        if search:
            query = query.where(Product.name.ilike(f"%{search}%"))
            count_query = count_query.where(Product.name.ilike(f"%{search}%"))
        if is_active is not None:
            query = query.where(Product.is_active == is_active)
            count_query = count_query.where(Product.is_active == is_active)

        total = (await self.db.execute(count_query)).scalar_one()
        products = (
            await self.db.execute(query.order_by(Product.created_at.desc()).offset(skip).limit(limit))
        ).scalars().all()

        return list(products), total

    async def create(self, **kwargs) -> Product:
        product = Product(**kwargs)
        self.db.add(product)
        await self.db.flush()
        return product

    async def update(self, product: Product, **kwargs) -> Product:
        for key, value in kwargs.items():
            setattr(product, key, value)
        await self.db.flush()
        return product

    async def delete(self, product: Product) -> None:
        await self.db.delete(product)
        await self.db.flush()

    async def count_active(self) -> int:
        result = await self.db.execute(
            select(func.count(Product.id)).where(Product.is_active == True)  # noqa: E712
        )
        return result.scalar_one()
