import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..genai_utils import ContactToolHandler, gemini_stream_chat_with_tools
from ..models import User
from ..schemas import ChatRequest, ChatStreamChunk, ImageContent

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/siri")
async def chat_endpoint(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    智能聊天助手端點 - 支援聯絡人管理工具功能 (Server-Sent Events)

    這個端點提供了一個智能助手，可以幫助用戶：
    - 進行一般對話
    - 查看聯絡人列表和詳細資訊
    - 創建新聯絡人
    - 更新現有聯絡人資訊
    - 刪除不需要的聯絡人

    在執行任何創建、更新或刪除操作前，助手會先請求用戶確認。

    支援的訊息格式：
    1. 純文字：content 為字串
    2. 多媒體：content 為包含 TextContent 和 ImageContent 的列表

    圖片格式要求：
    - 支援 base64 編碼的圖片資料或 data URL
    - 支援的格式：JPEG、PNG、WebP、HEIC、HEIF
    - 建議圖片大小不超過 20MB

    回應格式 (SSE):
    使用 Server-Sent Events 格式串流回應：
    - 文字內容事件：event: message\\ndata: {...}\\n\\n
    - 工具調用事件：event: tool_call\\ndata: {...}\\n\\n
    - 錯誤事件：event: error\\ndata: {...}\\n\\n
    - 完成事件：event: done\\ndata: {"status": "completed"}\\n\\n

    客戶端可以使用 EventSource API 來處理這些事件。
    """
    # 定義系統提示
    SYSTEM_PROMPT = """你是一個專業的智能聊天助手 Siri，具備以下特性：

🎯 **主要功能**：
- 協助用戶管理聯絡人（查看、創建、更新、刪除）
- 提供友善、專業的對話體驗
- 在執行重要操作前必須請求用戶確認

📋 **行為準則**：
- 使用繁體中文回應
- 保持友善、專業的語調
- 提供清晰、準確的資訊
- 對於敏感操作（創建、更新、刪除）要謹慎處理

🔧 **工具使用**：
- 優先使用可用的工具功能
- 在執行資料異動前先請求確認
- 提供詳細的操作結果說明

請根據用戶需求提供最適合的協助！"""

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

    # 創建聯絡人工具處理器
    tool_handler = ContactToolHandler(db, current_user)

    async def sse_generator():
        try:
            # 發送連接建立事件
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'message': '連接已建立'}, ensure_ascii=False)}\n\n"

            async for chunk in gemini_stream_chat_with_tools(
                chat_request.history_messages,
                chat_request.messages,
                tool_handler,
                SYSTEM_PROMPT,
            ):
                # 根據 chunk 類型發送不同的 SSE 事件
                if isinstance(chunk, ChatStreamChunk):
                    # 使用 Pydantic 的 JSON 序列化，支援 datetime 轉換
                    chunk_json = chunk.model_dump_json()

                    if chunk.type == "tool_call":
                        # 工具調用事件
                        yield f"event: tool_call\ndata: {chunk_json}\n\n"
                    else:
                        # 文字訊息事件
                        yield f"event: message\ndata: {chunk_json}\n\n"
                else:
                    # 如果是字串，包裝為文字訊息事件
                    text_chunk = ChatStreamChunk(
                        type="text", content=str(chunk), tool_call=None
                    )
                    yield f"event: message\ndata: {text_chunk.model_dump_json()}\n\n"

            # 發送完成事件
            yield f"event: done\ndata: {json.dumps({'status': 'completed', 'message': '對話完成'}, ensure_ascii=False)}\n\n"

        except Exception as e:
            # 發送錯誤事件
            error_data = {
                "status": "error",
                "message": f"處理您的請求時發生錯誤：{str(e)}",
                "error_type": type(e).__name__,
            }
            yield "event: error\n"
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
            "X-Accel-Buffering": "no",  # 關閉 nginx 緩衝
        },
    )
