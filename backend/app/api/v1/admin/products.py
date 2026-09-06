from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.logging import get_logger
from app.schemas.product import ProductAdmin, ProductCreate, ProductUpdate, PaginatedProducts
from app.services.product_service import ProductService
from app.services.s3_service import (
    validate_file,
    upload_file_to_s3,
    upload_thumbnail_to_s3,
    delete_file_from_s3,
)
from app.repositories.audit_log_repo import AuditLogRepository

logger = get_logger(__name__)
router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@router.get("", response_model=PaginatedProducts)
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = ProductService(db)
    products, total = await service.list_all(
        skip=skip, limit=limit, search=search, is_active=is_active
    )
    return PaginatedProducts(items=products, total=total, skip=skip, limit=limit)


@router.post("", response_model=ProductAdmin, status_code=201)
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = ProductService(db)
    product = await service.create_product(
        name=body.name,
        description=body.description,
        price=body.price,
        currency=body.currency,
    )
    audit = AuditLogRepository(db)
    await audit.create(
        action="product.created",
        admin_id=admin.id,
        entity_type="product",
        entity_id=str(product.id),
        metadata={"name": product.name, "price": product.price},
    )
    logger.info("admin_product_created", admin=str(admin.id), product=str(product.id))
    return product


@router.get("/{product_id}", response_model=ProductAdmin)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = ProductService(db)
    return await service.get_product_by_id(product_id)


@router.patch("/{product_id}", response_model=ProductAdmin)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = ProductService(db)
    updates = body.model_dump(exclude_none=True)
    product = await service.update_product(product_id, **updates)

    audit = AuditLogRepository(db)
    await audit.create(
        action="product.updated",
        admin_id=admin.id,
        entity_type="product",
        entity_id=str(product.id),
        metadata=updates,
    )
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = ProductService(db)
    old_file_key = await service.delete_product(product_id)
    if old_file_key:
        await delete_file_from_s3(old_file_key)

    audit = AuditLogRepository(db)
    await audit.create(
        action="product.deleted",
        admin_id=admin.id,
        entity_type="product",
        entity_id=product_id,
    )


@router.post("/{product_id}/upload-file", response_model=ProductAdmin)
async def upload_product_file(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Upload or replace the digital file for a product.
    File goes directly to S3 — stored as private object with UUID-based key.
    """
    content = await file.read()
    file_size = len(content)
    original_name = file.filename or "upload"
    content_type = file.content_type or "application/octet-stream"

    # Validate extension, MIME type, and size
    ext = validate_file(original_name, content_type, file_size)

    # Upload to private S3
    s3_key = await upload_file_to_s3(
        file_data=content,
        original_filename=original_name,
        content_type=content_type,
    )

    # Update product metadata
    service = ProductService(db)
    product = await service.set_file_metadata(
        product_id=product_id,
        file_key=s3_key,
        file_name=original_name,
        file_size=file_size,
        mime_type=content_type,
    )

    audit = AuditLogRepository(db)
    await audit.create(
        action="product.file_uploaded",
        admin_id=admin.id,
        entity_type="product",
        entity_id=product_id,
        metadata={"file_name": original_name, "s3_key": s3_key, "size": file_size},
    )
    return product


@router.post("/{product_id}/upload-thumbnail", response_model=ProductAdmin)
async def upload_product_thumbnail(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    content = await file.read()
    content_type = file.content_type or "image/jpeg"

    if not content_type.startswith("image/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail={"code": "INVALID_IMAGE", "message": "Only image files allowed for thumbnails."})

    thumbnail_url = await upload_thumbnail_to_s3(content, content_type)

    service = ProductService(db)
    product = await service.set_thumbnail(product_id, thumbnail_url)
    return product
