import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.config import settings

# Configure Cloudinary
if settings.CLOUDINARY_URL:
    cloudinary.config(
        cloudinary_url=settings.CLOUDINARY_URL
    )

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "goo_platform") -> str:
    """
    Uploads an image to Cloudinary and returns the secure URL.
    Raises HTTPException if the upload fails.
    """
    if not file:
        return None
        
    try:
        # Read the file content
        file_content = await file.read()
        
        # Upload to Cloudinary
        # We use a synchronous call here, but since it's an IO operation, 
        # in a fully async app we might want to run this in a threadpool, 
        # but for simplicity and standard usage, this is fine.
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="auto"
        )
        
        # Reset file cursor just in case it needs to be read again
        await file.seek(0)
        
        return result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload image to Cloudinary.")

async def delete_image_from_cloudinary(public_id: str):
    """
    Deletes an image from Cloudinary using its public ID.
    """
    if not public_id:
        return
        
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"Cloudinary delete error: {str(e)}")
