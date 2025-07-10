from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..genai_utils import gemini_stream_chat
from ..models import User
from ..schemas import ChatRequest, ImageContent

router = APIRouter(prefix="/chat", tags=["chat"])


def stream_response(history, messages):
    async def generator():
        async for chunk in gemini_stream_chat(history, messages):
            yield chunk

    return generator


@router.post("/")
async def chat_endpoint(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    聊天端點 - 接收歷史訊息和當前訊息，支援多張圖片
    需要用戶認證才能使用此端點。

    支援的訊息格式：
    1. 純文字：content 為字串
    2. 多媒體：content 為包含 TextContent 和 ImageContent 的列表

    圖片格式要求：
    - 支援 base64 編碼的圖片資料或 data URL
    - 支援的格式：JPEG、PNG、WebP、HEIC、HEIF
    - 建議圖片大小不超過 20MB
    """
    if not chat_request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="訊息不能為空"
        )

    # 驗證訊息內容
    for message in chat_request.messages + chat_request.history_messages:
        if isinstance(message.content, list):
            for content_item in message.content:
                if isinstance(content_item, ImageContent):
                    # 驗證支援的圖片格式
                    supported_types = [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/heic",
                        "image/heif",
                    ]
                    if content_item.mime_type not in supported_types:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"不支援的圖片格式: {content_item.mime_type}。支援的格式: {', '.join(supported_types)}",
                        )

    return StreamingResponse(
        stream_response(chat_request.history_messages, chat_request.messages)(),
        media_type="text/plain",
    )
