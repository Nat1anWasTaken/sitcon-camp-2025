from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..genai_utils import gemini_stream_chat
from ..models import User
from ..schemas import ChatRequest, ChatResponse

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
    聊天端點 - 接收歷史訊息和當前訊息
    需要用戶認證才能使用此端點。
    """
    if not chat_request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="訊息不能為空"
        )

    return StreamingResponse(
        stream_response(chat_request.history_messages, chat_request.messages)(),
        media_type="text/plain",
    )
