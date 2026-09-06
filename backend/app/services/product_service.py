from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from python_slugify import slugify
from app.core.exceptions import ProductNotFoundError, DuplicateError
from app.core.logging import get_logger
from app.repositories.product_repo import ProductRepository
from app.models.product import Product

logger = get_logger(__name__)


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProductRepository(db)

    async def get_active_products(self) -> List[Product]:
        return await self.repo.list_active()

    async def get_product_by_id(self, product_id: str | UUID) -> Product:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundError()
        return product

    async def get_product_by_slug(self, slug: str) -> Product:
        product = await self.repo.get_by_slug(slug)
        if not product:
            raise ProductNotFoundError()
        return product

    async def get_active_product_for_purchase(self, product_id: str | UUID) -> Product:
        from app.core.exceptions import ProductInactiveError
        product = await self.get_product_by_id(product_id)
        if not product.is_active:
            raise ProductInactiveError()
        return product

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[Product], int]:
        return await self.repo.list_all(skip=skip, limit=limit, search=search, is_active=is_active)

    async def _generate_unique_slug(self, name: str, exclude_id: Optional[UUID] = None) -> str:
        base_slug = slugify(name)
        slug = base_slug
        counter = 1
        while await self.repo.slug_exists(slug, exclude_id=exclude_id):
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    async def create_product(
        self,
        name: str,
        description: Optional[str],
        price: int,
        currency: str = "NGN",
    ) -> Product:
        slug = await self._generate_unique_slug(name)
        product = await self.repo.create(
            name=name,
            slug=slug,
            description=description,
            price=price,
            currency=currency,
            is_active=False,
        )
        logger.info("product_created", product_id=str(product.id), name=name)
        return product

    async def update_product(self, product_id: str | UUID, **kwargs) -> Product:
        product = await self.get_product_by_id(product_id)

        # Regenerate slug if name changed
        if "name" in kwargs and kwargs["name"] != product.name:
            kwargs["slug"] = await self._generate_unique_slug(
                kwargs["name"], exclude_id=product.id
            )

        updated = await self.repo.update(product, **kwargs)
        logger.info("product_updated", product_id=str(product_id))
        return updated

    async def set_file_metadata(
        self,
        product_id: str | UUID,
        file_key: str,
        file_name: str,
        file_size: int,
        mime_type: str,
    ) -> Product:
        product = await self.get_product_by_id(product_id)
        updated = await self.repo.update(
            product,
            file_key=file_key,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
        )
        logger.info("product_file_updated", product_id=str(product_id), file_key=file_key)
        return updated

    async def set_thumbnail(self, product_id: str | UUID, thumbnail_url: str) -> Product:
        product = await self.get_product_by_id(product_id)
        return await self.repo.update(product, thumbnail_url=thumbnail_url)

    async def delete_product(self, product_id: str | UUID) -> None:
        product = await self.get_product_by_id(product_id)
        old_file_key = product.file_key
        await self.repo.delete(product)
        logger.info("product_deleted", product_id=str(product_id))
        return old_file_key  # caller can delete from S3
