import base64
import os
from typing import AsyncGenerator, List, Optional

from google import genai
from google.genai import types

from src.schemas import ChatMessage, ImageContent, TextContent

# 檢查 API 金鑰是否存在
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY 環境變數未設定！"
        "\n請在 .env 檔案中設定 GEMINI_API_KEY=your-api-key"
        "\n或者從 https://aistudio.google.com/app/apikey 取得 API 金鑰"
    )

# 初始化 Gemini client
client = genai.Client(
    api_key=GEMINI_API_KEY,
)

MODEL_ID = "gemini-2.0-flash"


def build_contents(history: List[ChatMessage], messages: List[ChatMessage]):
    """
    將歷史訊息與當前訊息轉換為 Gemini API 所需格式
    支援文字和圖片內容
    """
    contents = []
    for msg in history + messages:
        parts = []

        # 處理 content，可能是字串或複雜內容列表
        if isinstance(msg.content, str):
            # 純文字訊息
            parts.append(types.Part.from_text(text=msg.content))
        elif isinstance(msg.content, list):
            # 複雜內容（文字 + 圖片）
            for content_item in msg.content:
                if isinstance(content_item, TextContent):
                    parts.append(types.Part.from_text(text=content_item.text))
                elif isinstance(content_item, ImageContent):
                    # 處理 base64 編碼的圖片
                    if content_item.data.startswith("data:"):
                        # 移除 data URL 前綴
                        base64_data = content_item.data.split(",")[1]
                    else:
                        base64_data = content_item.data

                    # 解碼 base64 圖片
                    image_bytes = base64.b64decode(base64_data)
                    parts.append(
                        types.Part.from_bytes(
                            data=image_bytes, mime_type=content_item.mime_type
                        )
                    )

        contents.append(types.Content(role=msg.role, parts=parts))
    return contents


async def gemini_stream_chat(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    config: Optional[types.GenerateContentConfig] = None,  # noqa: F821
) -> AsyncGenerator[str, None]:
    """
    串流 Gemini Flash 2.5 回應
    """
    contents = build_contents(history, messages)

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
        )

    stream = await client.aio.models.generate_content_stream(
        model=MODEL_ID, contents=contents, config=config
    )

    async for chunk in stream:
        if chunk.text:
            yield chunk.text
