from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminPublic(BaseModel):
    id: str
    email: str
    name: str
    is_active: bool


class LoginResponse(BaseModel):
    success: bool
    admin: AdminPublic


class PaymentInitRequest(BaseModel):
    product_id: str
    customer_email: EmailStr
    customer_name: str | None = None


class PaymentInitResponse(BaseModel):
    authorization_url: str
    order_reference: str
    order_id: str


class PaymentVerifyResponse(BaseModel):
    status: str
    order_reference: str
    amount: int
    currency: str
