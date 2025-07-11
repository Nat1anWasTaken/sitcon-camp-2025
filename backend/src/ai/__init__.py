"""AI 模組 - 包含 Gemini API 相關功能"""

from .chat import gemini_stream_chat, gemini_stream_chat_with_tools
from .client import MODEL_ID, get_gemini_client
from .handlers.unified import UnifiedToolHandler

__all__ = [
    "get_gemini_client",
    "MODEL_ID",
    "gemini_stream_chat",
    "gemini_stream_chat_with_tools",
    "UnifiedToolHandler",
]
