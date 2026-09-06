from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    product_id: UUID
    customer_email: EmailStr
    customer_name: Optional[str] = None

    @field_validator("customer_name")
    @classmethod
    def name_strip(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else None


class DownloadTokenPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    expires_at: datetime
    max_downloads: int
    download_count: int
    last_downloaded_at: Optional[datetime]
    revoked_at: Optional[datetime]
    created_at: datetime


class EmailLogPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email_type: str
    status: str
    sent_at: Optional[datetime]
    error_message: Optional[str]


class OrderPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    reference: str
    product_id: UUID
    customer_email: str
    customer_name: Optional[str]
    amount: int
    currency: str
    status: OrderStatus
    payment_provider: str
    payment_reference: Optional[str]
    created_at: datetime
    updated_at: datetime


class OrderDetail(OrderPublic):
    download_tokens: list[DownloadTokenPublic] = []
    email_logs: list[EmailLogPublic] = []


class PaginatedOrders(BaseModel):
    items: list[OrderPublic]
    total: int
    skip: int
    limit: int
