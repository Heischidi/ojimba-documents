from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import UnauthorizedError
from app.core.config import settings
from app.core.logging import get_logger
from app.repositories.admin_repo import AdminRepository
from app.models.admin_user import AdminUser

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AdminRepository(db)

    async def login(self, email: str, password: str) -> tuple[AdminUser, str]:
        """Validates credentials and returns (admin, jwt_token)."""
        admin = await self.repo.get_by_email(email)

        # Use constant-time check even when admin not found to prevent timing attacks
        dummy_hash = "$argon2id$v=19$m=65536,t=3,p=4$dummy"
        stored_hash = admin.password_hash if admin else dummy_hash

        if not verify_password(password, stored_hash) or not admin:
            logger.warning("login_failed", email=email)
            raise UnauthorizedError("Invalid email or password.")

        if not admin.is_active:
            logger.warning("login_inactive_admin", email=email)
            raise UnauthorizedError("Admin account is disabled.")

        token = create_access_token(
            subject=str(admin.id),
            expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        )

        logger.info("admin_logged_in", admin_id=str(admin.id))
        return admin, token

    async def create_admin(self, email: str, password: str, name: str) -> AdminUser:
        """Creates a new admin user (used by seed script)."""
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ValueError(f"Admin with email {email} already exists.")
        password_hash = hash_password(password)
        admin = await self.repo.create(email=email, password_hash=password_hash, name=name)
        logger.info("admin_created", email=email)
        return admin
