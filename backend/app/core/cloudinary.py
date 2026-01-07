from typing import Any, Dict, Optional

import cloudinary
from cloudinary.uploader import upload as cloudinary_upload

from .config import settings


def configure() -> None:

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

    options: Dict[str, Any] = {}
    if folder:
        options["folder"] = folder
    if public_id:
        options["public_id"] = public_id
    if extra_options:
        options.update(extra_options)

    return cloudinary_upload(file_path, **options)


def secure_url_from_result(result: Dict[str, Any]) -> Optional[str]:
 
    return result.get("secure_url") if isinstance(result, dict) else None
