"""Gemini API 客戶端和基本工具"""

import base64
import os
from typing import List, Optional

from google import genai
from google.genai import types

from ..schemas import ChatMessage, ImageContent, TextContent

_client = None
MODEL_ID = "gemini-2.5-flash"


def get_gemini_client() -> genai.Client:
    """初始化 Gemini Client"""
    global _client

    if _client:
        return _client

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY 環境變數未設定！\n"
            "請設定環境變數或從 https://aistudio.google.com/app/apikey 取得 API 金鑰"
        )

    _client = genai.Client(api_key=api_key)
    return _client


def build_message_contents(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    system_prompt: Optional[str] = None,
) -> List[types.Content]:
    """將訊息轉換為 Gemini API 格式"""
    contents = []

    # The system prompt is added as user message because the model doesn't support system message
    if system_prompt:
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)])
        )

    for msg in history + messages:
        parts = []

        if isinstance(msg.content, str):
            parts.append(types.Part.from_text(text=msg.content))
        elif isinstance(msg.content, list):
            for content_item in msg.content:
                if isinstance(content_item, TextContent):
                    parts.append(types.Part.from_text(text=content_item.text))
                elif isinstance(content_item, ImageContent):
                    image_data = _process_image_data(content_item.data)
                    parts.append(
                        types.Part.from_bytes(
                            data=image_data, mime_type=content_item.mime_type
                        )
                    )

        contents.append(types.Content(role=msg.role, parts=parts))

    return contents


def _process_image_data(data: str) -> bytes:
    """處理圖片資料"""
    if data.startswith("data:"):
        base64_data = data.split(",")[1]
    else:
        base64_data = data
    return base64.b64decode(base64_data)
