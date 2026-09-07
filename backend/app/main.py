from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.exceptions import MarketplaceException
from app.api.router import api_router

# Configure structured logging before anything else
configure_logging()
logger = get_logger(__name__)


app = FastAPI(
    title="Digital Marketplace API",
    description="Secure digital product sales platform",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# ── Exception Handlers ────────────────────────────────────────────────────────
@app.exception_handler(MarketplaceException)
async def marketplace_exception_handler(request: Request, exc: MarketplaceException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred." if settings.is_production else str(exc),
            },
        },
    )


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "digital-marketplace-api"}


@app.on_event("startup")
async def startup_event():
    logger.info(
        "app_startup",
        environment=settings.ENVIRONMENT,
        cors_origins=settings.cors_origins_list,
    )
