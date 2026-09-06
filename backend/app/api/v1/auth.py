from datetime import timedelta
from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.dependencies import get_current_admin
from app.schemas.auth import LoginRequest, LoginResponse, AdminPublic
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.JWT_EXPIRE_MINUTES * 60


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    admin, token = await service.login(body.email, body.password)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )

    return LoginResponse(
        success=True,
        admin=AdminPublic(
            id=str(admin.id),
            email=admin.email,
            name=admin.name,
            is_active=admin.is_active,
        ),
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"success": True, "message": "Logged out successfully."}


@router.get("/me", response_model=AdminPublic)
async def get_me(admin=Depends(get_current_admin)):
    return AdminPublic(
        id=str(admin.id),
        email=admin.email,
        name=admin.name,
        is_active=admin.is_active,
    )
