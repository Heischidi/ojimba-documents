from fastapi import APIRouter
from app.api.v1 import auth, products, payments, downloads
from app.api.v1.admin import products as admin_products
from app.api.v1.admin import orders as admin_orders
from app.api.v1.admin import customers as admin_customers
from app.api.v1.admin import dashboard as admin_dashboard

api_router = APIRouter(prefix="/api")

# Public routes
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(payments.router)
api_router.include_router(downloads.router)

# Admin-protected routes
api_router.include_router(admin_products.router)
api_router.include_router(admin_orders.router)
api_router.include_router(admin_customers.router)
api_router.include_router(admin_dashboard.router)
