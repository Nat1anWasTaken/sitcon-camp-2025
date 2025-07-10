import os
import uuid
from io import BytesIO
from typing import Optional, Tuple

from fastapi import HTTPException, UploadFile, status
from minio import Minio
from minio.error import S3Error
from PIL import Image


def get_minio_client() -> Minio:
    """
    獲取 MinIO 客戶端
    """
    endpoint = (
        os.getenv("S3_ENDPOINT", "http://localhost:9000")
        .replace("http://", "")
        .replace("https://", "")
    )
    access_key = os.getenv("S3_ACCESS_KEY", "minioadmin")
    secret_key = os.getenv("S3_SECRET_KEY", "minioadmin")
    secure = os.getenv("S3_ENDPOINT", "http://localhost:9000").startswith("https://")

    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)


def ensure_bucket_exists(bucket_name: str) -> None:
    """
    確保 bucket 存在，如果不存在則創建
    """
    client = get_minio_client()

    try:
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)

            # 設置 bucket 為公開讀取權限
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                    }
                ],
            }
            import json

            client.set_bucket_policy(bucket_name, json.dumps(policy))
    except S3Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MinIO bucket 操作失敗: {str(e)}",
        )


def validate_image_file(file: UploadFile) -> None:
    """
    驗證上傳的圖片文件
    """
    # 檢查文件類型
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支援的文件類型: {file.content_type}。僅支援: {', '.join(allowed_types)}",
        )

    # 檢查文件大小 (最大 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件過大: {file.size} bytes。最大允許: {max_size} bytes",
        )


def process_avatar_image(
    file_content: bytes, max_size: Tuple[int, int] = (512, 512)
) -> bytes:
    """
    處理頭像圖片：調整大小和優化
    """
    try:
        image = Image.open(BytesIO(file_content))

        # 轉換為 RGB 模式（如果需要）
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # 調整大小，保持比例
        image.thumbnail(max_size, Image.Resampling.LANCZOS)

        # 保存為 JPEG 格式
        output = BytesIO()
        image.save(output, format="JPEG", quality=85, optimize=True)
        output.seek(0)

        return output.getvalue()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"圖片處理失敗: {str(e)}"
        )


async def upload_avatar(
    file: UploadFile, user_id: int, contact_id: Optional[int] = None
) -> str:
    """
    上傳頭像文件到 MinIO

    Args:
        file: 上傳的文件
        user_id: 用戶 ID
        contact_id: 聯絡人 ID（可選）

    Returns:
        str: MinIO 中的對象鍵 (object key)
    """
    # 驗證文件
    validate_image_file(file)

    # 獲取配置
    bucket_name = os.getenv("S3_BUCKET", "my-bucket")
    public_url = os.getenv("S3_ENDPOINT", "http://localhost:9000")

    # 確保 bucket 存在
    ensure_bucket_exists(bucket_name)

    try:
        # 讀取文件內容
        file_content = await file.read()

        # 處理圖片
        processed_content = process_avatar_image(file_content)

        # 生成文件名
        file_extension = "jpg"  # 處理後都轉換為 JPEG
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        # 構建對象路徑
        if contact_id:
            object_name = (
                f"avatars/users/{user_id}/contacts/{contact_id}/{unique_filename}"
            )
        else:
            object_name = f"avatars/users/{user_id}/{unique_filename}"

        # 上傳到 MinIO
        client = get_minio_client()
        client.put_object(
            bucket_name,
            object_name,
            BytesIO(processed_content),
            length=len(processed_content),
            content_type="image/jpeg",
        )

        # 返回 object key 而不是完整 URL
        return object_name

    except S3Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件上傳失敗: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"處理文件時發生錯誤: {str(e)}",
        )


def get_avatar_url(avatar_key: str) -> str:
    """
    從 avatar_key 生成完整的 URL

    Args:
        avatar_key: MinIO 中的對象鍵

    Returns:
        str: 完整的頭像 URL
    """
    if not avatar_key:
        return ""

    bucket_name = os.getenv("S3_BUCKET", "my-bucket")
    public_url = os.getenv("S3_ENDPOINT", "http://localhost:9000")

    return f"{public_url}/{bucket_name}/{avatar_key}"


def delete_avatar(avatar_key: str) -> None:
    """
    從 MinIO 刪除頭像文件

    Args:
        avatar_key: MinIO 中的對象鍵
    """
    if not avatar_key:
        return

    try:
        # 獲取配置
        bucket_name = os.getenv("S3_BUCKET", "my-bucket")

        # 從 MinIO 刪除
        client = get_minio_client()
        client.remove_object(bucket_name, avatar_key)

    except S3Error:
        # 如果文件不存在或刪除失敗，忽略錯誤
        pass
    except Exception:
        # 忽略其他錯誤，不影響主要業務邏輯
        pass


def get_avatar_file(avatar_key: str) -> Tuple[bytes, str]:
    """
    從 MinIO 獲取頭像文件內容

    Args:
        avatar_key: MinIO 中的對象鍵

    Returns:
        Tuple[bytes, str]: (文件內容, 內容類型)

    Raises:
        HTTPException: 當文件不存在或獲取失敗時
    """
    if not avatar_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="頭像不存在")

    try:
        # 獲取配置
        bucket_name = os.getenv("S3_BUCKET", "my-bucket")

        # 從 MinIO 獲取文件
        client = get_minio_client()
        response = client.get_object(bucket_name, avatar_key)

        # 讀取文件內容
        file_content = response.read()

        # 確定內容類型
        content_type = "image/jpeg"  # 因為我們所有頭像都轉換為 JPEG
        if avatar_key.lower().endswith(".png"):
            content_type = "image/png"
        elif avatar_key.lower().endswith(".gif"):
            content_type = "image/gif"
        elif avatar_key.lower().endswith(".webp"):
            content_type = "image/webp"

        return file_content, content_type

    except S3Error as e:
        if e.code == "NoSuchKey":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="頭像文件不存在"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"獲取頭像失敗: {str(e)}",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"處理頭像時發生錯誤: {str(e)}",
        )
