import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_products_empty(client: AsyncClient):
    response = await client.get("/api/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_products_includes_active(client: AsyncClient, sample_product):
    response = await client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    ids = [p["id"] for p in products]
    assert str(sample_product.id) in ids


@pytest.mark.asyncio
async def test_get_product_by_slug(client: AsyncClient, sample_product):
    response = await client.get(f"/api/products/slug/{sample_product.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_product.name
    # file_key MUST NOT be in public response
    assert "file_key" not in data


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient):
    response = await client.get("/api/products/slug/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PRODUCT_NOT_FOUND"


@pytest.mark.asyncio
async def test_admin_create_product(auth_client: AsyncClient):
    response = await auth_client.post("/api/admin/products", json={
        "name": "New Test Product",
        "description": "A brand new product",
        "price": 500000,
        "currency": "NGN",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Test Product"
    assert data["price"] == 500000
    assert data["is_active"] is False  # draft by default
    assert data["slug"] == "new-test-product"


@pytest.mark.asyncio
async def test_admin_create_product_unauthorized(client: AsyncClient):
    response = await client.post("/api/admin/products", json={
        "name": "Sneaky Product",
        "price": 1000,
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_update_product(auth_client: AsyncClient, sample_product):
    response = await auth_client.patch(f"/api/admin/products/{sample_product.id}", json={
        "is_active": True,
        "price": 200000,
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is True
    assert response.json()["price"] == 200000


@pytest.mark.asyncio
async def test_admin_product_file_key_visible(auth_client: AsyncClient, sample_product):
    response = await auth_client.get(f"/api/admin/products/{sample_product.id}")
    assert response.status_code == 200
    # file_key IS visible to admins
    assert "file_key" in response.json()
