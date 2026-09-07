import uuid
import mimetypes
from typing import Optional
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from app.core.config import settings
from app.core.exceptions import S3UploadError
from app.core.logging import get_logger

logger = get_logger(__name__)

ALLOWED_MIME_TYPES = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "zip": "application/zip",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "mp4": "video/mp4",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}


def _get_s3_client():
    kwargs = {
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        "region_name": settings.AWS_REGION,
        "config": Config(signature_version="s3v4"),
    }
    if settings.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
        
    return boto3.client("s3", **kwargs)


def validate_file(filename: str, content_type: str, file_size: int) -> str:
    """
    Validates file extension, MIME type, and size.
    Returns the file extension if valid, raises ValueError otherwise.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in settings.allowed_extensions_list:
        raise ValueError(f"File type '.{ext}' is not allowed.")

    expected_mime = ALLOWED_MIME_TYPES.get(ext)
    if expected_mime and content_type and content_type.split(";")[0].strip() != expected_mime:
        # Be lenient — browsers sometimes send slightly different MIME types
        if not content_type.startswith(expected_mime.split("/")[0]):
            logger.warning(
                "mime_mismatch",
                ext=ext,
                expected=expected_mime,
                received=content_type,
            )

    if file_size > settings.max_file_size_bytes:
        raise ValueError(
            f"File size {file_size / 1024 / 1024:.1f}MB exceeds maximum "
            f"of {settings.MAX_FILE_SIZE_MB}MB."
        )

    return ext


def generate_s3_key(original_filename: str, prefix: str = "products") -> str:
    """
    Generates a unique, safe S3 object key.
    Original filename is NOT used as the key to prevent path traversal.
    Example: products/9d3e7b1c-xxxx-xxxx/course.pdf
    """
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    unique_id = str(uuid.uuid4())
    return f"{prefix}/{unique_id[:8]}-{unique_id[9:13]}-{unique_id[14:18]}/{unique_id}.{ext}"


async def upload_file_to_s3(
    file_data: bytes,
    original_filename: str,
    content_type: str,
    prefix: str = "products",
) -> str:
    """
    Uploads a file to S3 and returns the object key.
    The bucket is PRIVATE — no public access.
    """
    s3_key = generate_s3_key(original_filename, prefix)

    try:
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=file_data,
            ContentType=content_type,
            # Ensure object is private
            ACL="private",
            # Content-Disposition for download
            ContentDisposition=f'attachment; filename="{original_filename}"',
        )
        logger.info("s3_upload_success", key=s3_key, size=len(file_data))
        return s3_key
    except ClientError as e:
        logger.error("s3_upload_failed", error=str(e), key=s3_key)
        raise S3UploadError(f"Failed to upload file: {e.response['Error']['Message']}")


def generate_presigned_url(s3_key: str, expiry_seconds: Optional[int] = None) -> str:
    """
    Generates a short-lived pre-signed S3 URL.
    Default expiry is from settings (60 seconds).
    This URL is passed to the customer — it expires quickly to prevent sharing.
    """
    expiry = expiry_seconds or settings.S3_SIGNED_URL_EXPIRY
    try:
        s3 = _get_s3_client()
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.AWS_S3_BUCKET, "Key": s3_key},
            ExpiresIn=expiry,
        )
        logger.info("presigned_url_generated", key=s3_key, expiry=expiry)
        return url
    except ClientError as e:
        logger.error("presigned_url_failed", error=str(e))
        raise S3UploadError("Failed to generate download URL.")


async def delete_file_from_s3(s3_key: str) -> None:
    """Deletes an object from S3."""
    try:
        s3 = _get_s3_client()
        s3.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
        logger.info("s3_delete_success", key=s3_key)
    except ClientError as e:
        logger.warning("s3_delete_failed", error=str(e), key=s3_key)


async def upload_thumbnail_to_s3(file_data: bytes, content_type: str) -> str:
    """Uploads a thumbnail image and returns a publicly accessible URL via presigned."""
    s3_key = generate_s3_key("thumbnail.jpg", prefix="thumbnails")
    try:
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=file_data,
            ContentType=content_type,
            # Thumbnails are publicly readable for display on product pages
            ACL="public-read",
        )
        if settings.PUBLIC_STORAGE_URL:
            # e.g., https://<project>.supabase.co/storage/v1/object/public/<bucket>
            url = f"{settings.PUBLIC_STORAGE_URL}/{s3_key}"
        else:
            url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
        return url
    except ClientError as e:
        raise S3UploadError(f"Failed to upload thumbnail: {e.response['Error']['Message']}")
