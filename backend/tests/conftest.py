import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db_session):
    from app.models.admin_user import AdminUser
    admin = AdminUser(
        email="test@admin.com",
        password_hash=hash_password("testpassword123"),
        name="Test Admin",
    )
    db_session.add(admin)
    await db_session.commit()
    return admin


@pytest_asyncio.fixture
async def auth_client(client, admin_user):
    """Client with admin session cookie."""
    response = await client.post("/api/auth/login", json={
        "email": "test@admin.com",
        "password": "testpassword123",
    })
    assert response.status_code == 200
    return client


@pytest_asyncio.fixture
async def sample_product(db_session):
    from app.models.product import Product
    product = Product(
        name="Test PDF Guide",
        slug="test-pdf-guide",
        description="A test digital product",
        price=150000,  # ₦1,500 in kobo
        currency="NGN",
        file_key="products/test/test.pdf",
        file_name="test.pdf",
        file_size=1024,
        mime_type="application/pdf",
        is_active=True,
    )
    db_session.add(product)
    await db_session.commit()
    return product
