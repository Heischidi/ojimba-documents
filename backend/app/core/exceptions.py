from fastapi import HTTPException, status


class MarketplaceException(HTTPException):
    """Base application exception with structured error format."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message},
        )


# ── 400 Bad Request ────────────────────────────────────────────────────────────
class ValidationError(MarketplaceException):
    def __init__(self, message: str = "Invalid input."):
        super().__init__(400, "VALIDATION_ERROR", message)


class DuplicateError(MarketplaceException):
    def __init__(self, message: str = "Resource already exists."):
        super().__init__(400, "DUPLICATE_ERROR", message)


class PaymentAmountMismatch(MarketplaceException):
    def __init__(self):
        super().__init__(400, "PAYMENT_AMOUNT_MISMATCH", "Payment amount does not match product price.")


# ── 401 Unauthorised ───────────────────────────────────────────────────────────
class UnauthorizedError(MarketplaceException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(401, "UNAUTHORIZED", message)


# ── 403 Forbidden ─────────────────────────────────────────────────────────────
class ForbiddenError(MarketplaceException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(403, "FORBIDDEN", message)


# ── 404 Not Found ─────────────────────────────────────────────────────────────
class NotFoundError(MarketplaceException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(404, "NOT_FOUND", f"{resource} not found.")


class ProductNotFoundError(MarketplaceException):
    def __init__(self):
        super().__init__(404, "PRODUCT_NOT_FOUND", "The requested product does not exist.")


class OrderNotFoundError(MarketplaceException):
    def __init__(self):
        super().__init__(404, "ORDER_NOT_FOUND", "The requested order does not exist.")


class TokenNotFoundError(MarketplaceException):
    def __init__(self):
        super().__init__(404, "TOKEN_NOT_FOUND", "Download token is invalid.")


# ── 410 Gone ──────────────────────────────────────────────────────────────────
class TokenExpiredError(MarketplaceException):
    def __init__(self):
        super().__init__(410, "TOKEN_EXPIRED", "This download link has expired.")


class TokenRevokedError(MarketplaceException):
    def __init__(self):
        super().__init__(410, "TOKEN_REVOKED", "This download link has been revoked.")


class DownloadLimitError(MarketplaceException):
    def __init__(self):
        super().__init__(410, "DOWNLOAD_LIMIT_REACHED", "Maximum download limit for this link has been reached.")


# ── 422 Unprocessable ─────────────────────────────────────────────────────────
class ProductInactiveError(MarketplaceException):
    def __init__(self):
        super().__init__(422, "PRODUCT_INACTIVE", "This product is not currently available for purchase.")


# ── 402 Payment Required ──────────────────────────────────────────────────────
class PaymentNotVerifiedError(MarketplaceException):
    def __init__(self):
        super().__init__(402, "PAYMENT_NOT_VERIFIED", "Payment has not been verified.")


# ── 500 Server Error ──────────────────────────────────────────────────────────
class PaymentInitError(MarketplaceException):
    def __init__(self, message: str = "Failed to initialize payment."):
        super().__init__(502, "PAYMENT_INIT_FAILED", message)


class EmailSendError(MarketplaceException):
    def __init__(self, message: str = "Failed to send email."):
        super().__init__(502, "EMAIL_SEND_FAILED", message)


class S3UploadError(MarketplaceException):
    def __init__(self, message: str = "Failed to upload file."):
        super().__init__(502, "S3_UPLOAD_FAILED", message)
