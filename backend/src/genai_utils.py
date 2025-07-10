import os
from typing import AsyncGenerator, List, Optional

from google import genai
from google.genai import types

from src.schemas import ChatMessage

# 初始化 Gemini client
client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
)

MODEL_ID = "gemini-2.0-flash"


def build_contents(history: List[ChatMessage], messages: List[ChatMessage]):
    """
    將歷史訊息與當前訊息轉換為 Gemini API 所需格式
    """
    contents = []
    for msg in history + messages:
        contents.append(
            types.Content(role=msg.role, parts=[types.Part.from_text(text=msg.content)])
        )
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
