import io
from pathlib import Path
from typing import Tuple, List, Optional
from fastapi import HTTPException, UploadFile
from PIL import Image

import sys
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from models import UploadedImageMetadata

MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PIL_FORMATS = {"jpeg", "png", "webp"}
VALID_PANEL_TAGS = {"front", "back", "side", "panel"}


def validate_panel_tag(panel: Optional[str], default_panel: str = "front") -> str:
    """
    Validates and normalizes panel tag to 'front', 'back', 'side', or 'panel'.
    Raises HTTPException(400) on invalid tags.
    """
    if not panel or not str(panel).strip():
        return default_panel

    clean_tag = str(panel).strip().lower()
    if clean_tag not in VALID_PANEL_TAGS:
        allowed_str = ", ".join(sorted(VALID_PANEL_TAGS))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid panel tag '{panel}'. Allowed panel tags are: {allowed_str}."
        )
    return clean_tag


async def validate_and_inspect_image(
    upload_file: UploadFile,
    panel: str = "front"
) -> Tuple[bytes, UploadedImageMetadata]:
    """
    Validates upload against size, MIME type, and image integrity.
    Returns (raw_bytes, UploadedImageMetadata).
    Raises HTTPException(status_code=400) with clean error descriptions.
    """
    filename = upload_file.filename or "uploaded_image.jpg"
    content_type = (upload_file.content_type or "").lower().strip()

    # 1. Read bytes
    try:
        content = await upload_file.read()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file '{filename}'."
        )

    # 2. Check empty
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file '{filename}' is empty."
        )

    # 3. Check file size limit (15 MB)
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' exceeds the 15 MB limit (received {size_mb:.2f} MB)."
        )

    # 4. Check Content-Type header if provided
    # (Allow octet-stream only if image content is verified by PIL below)
    if content_type and content_type != "application/octet-stream" and content_type not in ALLOWED_MIME_TYPES:
        allowed_types_str = ", ".join(sorted(ALLOWED_MIME_TYPES))
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' has invalid MIME type '{content_type}'. Allowed types: {allowed_types_str}."
        )

    # 5. Deep PIL image verification (detects disguised PDFs, executables, or corrupted files)
    try:
        img_buffer = io.BytesIO(content)
        img = Image.open(img_buffer)
        pil_format = (img.format or "").lower()
        if pil_format not in ALLOWED_PIL_FORMATS:
            allowed_fmts_str = ", ".join(sorted(ALLOWED_PIL_FORMATS))
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' has unsupported format '{pil_format}'. Allowed image formats: {allowed_fmts_str}."
            )
        width, height = img.size
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' is corrupted or not a valid image file."
        )

    normalized_mime = f"image/{pil_format}"
    if pil_format == "jpeg":
        normalized_mime = "image/jpeg"

    metadata = UploadedImageMetadata(
        filename=filename,
        panel=panel,
        mime_type=normalized_mime,
        size_bytes=len(content),
        width=width,
        height=height
    )

    return content, metadata
