from typing import Any, Dict, Optional

import cloudinary
from cloudinary.uploader import upload as cloudinary_upload

from .config import settings


def configure() -> None:
    """Configure the Cloudinary client from project settings."""
    cloudinary.config(
        cloud_name=getattr(settings, "CLOUDINARY_CLOUD_NAME", ""),
        api_key=getattr(settings, "CLOUDINARY_API_KEY", ""),
        api_secret=getattr(settings, "CLOUDINARY_API_SECRET", ""),
        secure=True,
    )


configure()


def upload_file(
    file_path: str,
    folder: Optional[str] = None,
    public_id: Optional[str] = None,
    extra_options: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Upload a file to Cloudinary and return the upload response.

    Args:
        file_path: Local path to the file to upload (or a remote URL).
        folder: Optional Cloudinary folder to place the file under.
        public_id: Optional public id to assign to the uploaded resource.
        extra_options: Additional options passed to `cloudinary.uploader.upload`.

    Returns:
        The Cloudinary response dictionary.
    """
    options: Dict[str, Any] = {}
    if folder:
        options["folder"] = folder
    if public_id:
        options["public_id"] = public_id
    if extra_options:
        options.update(extra_options)

    return cloudinary_upload(file_path, **options)


def secure_url_from_result(result: Dict[str, Any]) -> Optional[str]:
    """Return the secure URL from a Cloudinary upload response, if present."""
    return result.get("secure_url") if isinstance(result, dict) else None
