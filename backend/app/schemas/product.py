from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict


# ── Product Schemas ───────────────────────────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int  # in kobo
    currency: str = "NGN"
    paystack_subaccount: Optional[str] = None


class ProductCreate(ProductBase):
    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Price must be greater than 0.")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name cannot be empty.")
        return v.strip()


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    paystack_subaccount: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0.")
        return v


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: Optional[str]
    price: int
    currency: str
    thumbnail_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    is_active: bool
    created_at: datetime


class ProductAdmin(ProductPublic):
    file_key: Optional[str] = None  # Only exposed to admins
    paystack_subaccount: Optional[str] = None
    updated_at: datetime


class PaginatedProducts(BaseModel):
    items: list[ProductPublic]
    total: int
    skip: int
    limit: int
