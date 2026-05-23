import os
import uuid
import logging
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
if settings.CLOUDINARY_URL:
    try:
        cloudinary.config(
            cloudinary_url=settings.CLOUDINARY_URL
        )
    except Exception as e:
        logger.warning(f"Failed to configure Cloudinary with CLOUDINARY_URL: {e}")

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "goo_platform") -> str:
    """
    Uploads an image to Cloudinary and returns the secure URL.
    Falls back to local file storage if Cloudinary is not configured or fails.
    """
    if not file:
        return None

    # Try Cloudinary upload if URL is configured
    if settings.CLOUDINARY_URL:
        try:
            # Read the file content
            file_content = await file.read()
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_content,
                folder=folder,
                resource_type="auto"
            )
            
            # Reset file cursor just in case it needs to be read again
            await file.seek(0)
            
            secure_url = result.get("secure_url")
            if secure_url:
                logger.info(f"Successfully uploaded image to Cloudinary: {secure_url}")
                return secure_url
        except Exception as e:
            logger.warning(f"Cloudinary upload failed: {e}. Falling back to local storage.")
            # Reset cursor after read attempt to allow local upload to read it again
            await file.seek(0)

    # --- LOCAL FALLBACK ---
    try:
        logger.info("Initializing local file storage fallback...")
        
        # Sanitize the folder name (e.g. "goo_products" -> "products")
        clean_folder = folder.replace("goo_", "").strip("/")
        
        # Build local directory path
        local_dir = os.path.join(settings.UPLOAD_DIR, clean_folder)
        os.makedirs(local_dir, exist_ok=True)
        
        # Generate a unique file name
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
        if not ext:
            ext = ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(local_dir, filename)
        
        # Read the file content
        file_content = await file.read()
        
        # Write to local file
        with open(filepath, "wb") as buffer:
            buffer.write(file_content)
            
        # Reset file cursor
        await file.seek(0)
        
        # Generate relative URL (e.g., "/uploads/products/filename.jpg")
        relative_url = f"/uploads/{clean_folder}/{filename}".replace("\\", "/").replace("//", "/")
        if not relative_url.startswith("/"):
            relative_url = "/" + relative_url
            
        logger.info(f"Local storage fallback successful! File saved to: {filepath} -> URL: {relative_url}")
        return relative_url

    except Exception as e:
        logger.error(f"Local storage fallback failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image. Cloudinary and local fallback both failed. Error: {str(e)}"
        )

async def delete_image_from_cloudinary(public_id: str):
    """
    Deletes an image from Cloudinary using its public ID.
    """
    if not public_id:
        return
        
    try:
        if settings.CLOUDINARY_URL:
            cloudinary.uploader.destroy(public_id)
    except Exception as e:
        logger.error(f"Cloudinary delete error: {str(e)}")
