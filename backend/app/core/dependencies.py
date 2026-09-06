from typing import Optional
from fastapi import Depends, Cookie, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedError
from app.core.logging import get_logger

logger = get_logger(__name__)


async def get_current_admin(
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(default=None),
):
    """
    Dependency that validates the HTTP-only cookie JWT and returns the admin user.
    Raises UnauthorizedError if the token is missing, invalid, or the admin is inactive.
    """
    from app.repositories.admin_repo import AdminRepository

    if not access_token:
        raise UnauthorizedError("Authentication required.")

    admin_id = decode_access_token(access_token)
    if not admin_id:
        raise UnauthorizedError("Invalid or expired session.")

    repo = AdminRepository(db)
    admin = await repo.get_by_id(admin_id)

    if not admin:
        raise UnauthorizedError("Admin account not found.")

    if not admin.is_active:
        raise UnauthorizedError("Admin account is disabled.")

    logger.debug("admin_authenticated", admin_id=str(admin.id))
    return admin
