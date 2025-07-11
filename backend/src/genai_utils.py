import base64
import json
import os
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from src.models import Contact, User
from src.schemas import (
    ChatMessage,
    ChatStreamChunk,
    ImageContent,
    TextContent,
    ToolCall,
)

_client = None


MODEL_ID = "gemini-2.0-flash"


def get_gemini_client() -> genai.Client:
    """
    初始化 Gemini Client，請確定 GEMINI_API_KEY 環境變數已設定
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not gemini_api_key:
        raise ValueError(
            "GEMINI_API_KEY 環境變數未設定！"
            "\n請在 .env 檔案中設定 GEMINI_API_KEY=your-api-key"
            "\n或者從 https://aistudio.google.com/app/apikey 取得 API 金鑰"
        )

    global _client

    if not _client:
        _client = genai.Client(
            api_key=gemini_api_key,
        )

    return _client


def create_contact_tools():
    """
    定義聊天機器人可用的聯絡人管理工具
    """
    tools = [
        # 獲取聯絡人列表
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_contacts",
                    description="獲取用戶的聯絡人列表，支援搜索功能",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "search": types.Schema(
                                type=types.Type.STRING, description="搜索關鍵字，可選"
                            ),
                            "limit": types.Schema(
                                type=types.Type.INTEGER,
                                description="返回結果數量限制，預設為10",
                            ),
                        },
                    ),
                )
            ]
        ),
        # 獲取單個聯絡人詳情
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_contact",
                    description="獲取指定聯絡人的詳細資訊",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="聯絡人ID"
                            )
                        },
                        required=["contact_id"],
                    ),
                )
            ]
        ),
        # 創建新聯絡人
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="create_contact",
                    description="創建新聯絡人。在執行此操作前必須先向用戶確認。",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "name": types.Schema(
                                type=types.Type.STRING, description="聯絡人姓名"
                            ),
                            "description": types.Schema(
                                type=types.Type.STRING, description="聯絡人描述，可選"
                            ),
                        },
                        required=["name"],
                    ),
                )
            ]
        ),
        # 更新聯絡人
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="update_contact",
                    description="更新指定聯絡人的資訊。在執行此操作前必須先向用戶確認。",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="要更新的聯絡人ID"
                            ),
                            "name": types.Schema(
                                type=types.Type.STRING,
                                description="新的聯絡人姓名，可選",
                            ),
                            "description": types.Schema(
                                type=types.Type.STRING,
                                description="新的聯絡人描述，可選",
                            ),
                        },
                        required=["contact_id"],
                    ),
                )
            ]
        ),
        # 刪除聯絡人
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="delete_contact",
                    description="刪除指定的聯絡人。在執行此操作前必須先向用戶確認。",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="要刪除的聯絡人ID"
                            )
                        },
                        required=["contact_id"],
                    ),
                )
            ]
        ),
        # 請求用戶確認操作
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="request_user_confirmation",
                    description="向用戶請求確認執行某個操作",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "action": types.Schema(
                                type=types.Type.STRING, description="要執行的操作描述"
                            ),
                            "details": types.Schema(
                                type=types.Type.STRING, description="操作的詳細資訊"
                            ),
                        },
                        required=["action", "details"],
                    ),
                )
            ]
        ),
    ]
    return tools


class ContactToolHandler:
    """
    處理聊天機器人的聯絡人工具調用
    """

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user
        self.pending_confirmations: Dict[str, Dict[str, Any]] = {}

    async def handle_tool_call(self, tool_call: types.FunctionCall) -> tuple[str, dict]:
        """
        處理工具調用，返回結果和工具調用資訊
        """
        function_name = tool_call.name
        args = tool_call.args or {}

        if function_name == "get_contacts":
            result = await self._get_contacts(args)
        elif function_name == "get_contact":
            result = await self._get_contact(args)
        elif function_name == "create_contact":
            result = await self._create_contact(args)
        elif function_name == "update_contact":
            result = await self._update_contact(args)
        elif function_name == "delete_contact":
            result = await self._delete_contact(args)
        elif function_name == "request_user_confirmation":
            result = await self._request_user_confirmation(args)
        else:
            result = f"未知的工具功能: {function_name}"

        tool_info = {"name": function_name, "arguments": args, "result": result}

        return result, tool_info

    async def _get_contacts(self, args: Dict[str, Any]) -> str:
        """獲取聯絡人列表"""
        search = args.get("search")
        limit = args.get("limit", 10)

        query = self.db.query(Contact).filter(Contact.user_id == self.current_user.id)

        if search:
            query = query.filter(Contact.name.contains(search))

        contacts = query.limit(limit).all()

        if not contacts:
            return "您目前沒有任何聯絡人。"

        result = "您的聯絡人列表：\n"
        for contact in contacts:
            result += f"• [{contact.id}] {contact.name}"
            if getattr(contact, "description", None):
                result += f" - {contact.description}"
            result += "\n"

        return result

    async def _get_contact(self, args: Dict[str, Any]) -> str:
        """獲取單個聯絡人詳情"""
        contact_id = args.get("contact_id")

        contact = (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not contact:
            return f"找不到 ID 為 {contact_id} 的聯絡人。"

        result = f"聯絡人詳情：\n"
        result += f"• ID: {contact.id}\n"
        result += f"• 姓名: {contact.name}\n"
        if getattr(contact, "description", None):
            result += f"• 描述: {contact.description}\n"
        result += f"• 創建時間: {contact.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        if getattr(contact, "updated_at", None):
            result += (
                f"• 更新時間: {contact.updated_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            )

        return result

    async def _create_contact(self, args: Dict[str, Any]) -> str:
        """創建新聯絡人"""
        name = args.get("name")
        description = args.get("description")

        new_contact = Contact(
            name=name, description=description, user_id=self.current_user.id
        )

        self.db.add(new_contact)
        self.db.commit()
        self.db.refresh(new_contact)

        result = f"✅ 已成功創建聯絡人：\n"
        result += f"• ID: {new_contact.id}\n"
        result += f"• 姓名: {new_contact.name}\n"
        if description:
            result += f"• 描述: {description}\n"

        return result

    async def _update_contact(self, args: Dict[str, Any]) -> str:
        """更新聯絡人"""
        contact_id = args.get("contact_id")
        name = args.get("name")
        description = args.get("description")

        contact = (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not contact:
            return f"找不到 ID 為 {contact_id} 的聯絡人。"

        updated_fields = []
        if name and name != getattr(contact, "name", None):
            contact.name = name
            updated_fields.append(f"姓名: {name}")

        if description is not None and description != getattr(
            contact, "description", None
        ):
            contact.description = description
            updated_fields.append(f"描述: {description}")

        if not updated_fields:
            return "沒有需要更新的欄位。"

        self.db.commit()
        self.db.refresh(contact)

        result = f"✅ 已成功更新聯絡人 [{contact_id}] {contact.name}：\n"
        for field in updated_fields:
            result += f"• {field}\n"

        return result

    async def _delete_contact(self, args: Dict[str, Any]) -> str:
        """刪除聯絡人"""
        contact_id = args.get("contact_id")

        contact = (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not contact:
            return f"找不到 ID 為 {contact_id} 的聯絡人。"

        contact_name = contact.name
        self.db.delete(contact)
        self.db.commit()

        return f"✅ 已成功刪除聯絡人 [{contact_id}] {contact_name}。"

    async def _request_user_confirmation(self, args: Dict[str, Any]) -> str:
        """請求用戶確認"""
        action = args.get("action")
        details = args.get("details")

        return f"🤖 我想要執行以下操作，請確認是否同意：\n\n📋 **操作**：{action}\n📝 **詳情**：{details}\n\n請回答「是」或「同意」來確認，或「否」或「取消」來取消操作。"


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
    串流 Gemini Flash 2.5 回應（純文字）
    """
    contents = build_contents(history, messages)

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
        )

    stream = await get_gemini_client().aio.models.generate_content_stream(
        model=MODEL_ID, contents=contents, config=config
    )

    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def gemini_stream_chat_with_tools(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    tool_handler: ContactToolHandler,
    config: Optional[types.GenerateContentConfig] = None,
) -> AsyncGenerator[Union[str, ChatStreamChunk], None]:
    """
    帶有工具功能的 Gemini 聊天串流，返回結構化資料
    """
    contents = build_contents(history, messages)
    tools = create_contact_tools()

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
            tools=tools,
        )

    # 系統提示詞，指導 AI 如何使用工具
    system_content = types.Content(
        role="system",
        parts=[
            types.Part.from_text(
                text="""
你是一個智能的聊天助手，可以幫助用戶管理他們的聯絡人。你擁有以下能力：

1. **查看聯絡人**：可以顯示用戶的聯絡人列表或特定聯絡人的詳細資訊
2. **創建聯絡人**：可以幫用戶添加新的聯絡人
3. **更新聯絡人**：可以修改現有聯絡人的資訊
4. **刪除聯絡人**：可以移除不需要的聯絡人

**重要規則**：
- 在執行任何「創建」、「更新」或「刪除」操作前，必須先使用 request_user_confirmation 工具向用戶請求確認
- 只有在用戶明確同意後，才能執行相應的操作
- 始終以友善、禮貌的語調與用戶互動
- 提供清楚、詳細的操作說明和結果

請以繁體中文回應用戶。
        """
            )
        ],
    )

    all_contents = [system_content] + contents

    try:
        stream = await get_gemini_client().aio.models.generate_content_stream(
            model=MODEL_ID, contents=all_contents, config=config
        )

        async for chunk in stream:
            # 處理工具調用
            if (
                hasattr(chunk, "candidates")
                and chunk.candidates
                and len(chunk.candidates) > 0
            ):
                candidate = chunk.candidates[0]
                if (
                    hasattr(candidate, "content")
                    and candidate.content
                    and hasattr(candidate.content, "parts")
                ):
                    for part in candidate.content.parts:
                        if hasattr(part, "function_call") and part.function_call:
                            # 執行工具調用
                            (
                                tool_result,
                                tool_info,
                            ) = await tool_handler.handle_tool_call(part.function_call)

                            # 返回工具調用結構化資料
                            yield ChatStreamChunk(
                                type="tool_call",
                                content=tool_result,
                                tool_call=ToolCall(**tool_info),
                            )
                        elif hasattr(part, "text") and part.text:
                            # 返回文字內容
                            yield ChatStreamChunk(
                                type="text", content=part.text, tool_call=None
                            )
            elif hasattr(chunk, "text") and chunk.text:
                # 返回文字內容
                yield ChatStreamChunk(type="text", content=chunk.text, tool_call=None)
    except Exception as e:
        # 如果工具功能出錯，回退到普通聊天
        async for chunk in gemini_stream_chat(history, messages, config):
            yield ChatStreamChunk(type="text", content=chunk, tool_call=None)
