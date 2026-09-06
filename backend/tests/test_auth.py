import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user):
    response = await client.post("/api/auth/login", json={
        "email": "test@admin.com",
        "password": "testpassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["admin"]["email"] == "test@admin.com"
    # Should set HTTP-only cookie
    assert "access_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user):
    response = await client.post("/api/auth/login", json={
        "email": "test@admin.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "anything",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(auth_client: AsyncClient):
    response = await auth_client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@admin.com"


@pytest.mark.asyncio
async def test_logout(auth_client: AsyncClient):
    response = await auth_client.post("/api/auth/logout")
    assert response.status_code == 200
    # Cookie should be cleared
    assert response.json()["success"] is True
