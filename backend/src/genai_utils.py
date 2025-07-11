import base64
import os
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from src.models import Contact, Record, RecordCategory, User
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
):
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


async def gemini_stream_chat(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    system_prompt: Optional[str] = None,
    config: Optional[types.GenerateContentConfig] = None,
) -> AsyncGenerator[str, None]:
    """基本的 Gemini 聊天串流"""
    contents = build_message_contents(history, messages, system_prompt)

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
        )

    try:
        stream = await get_gemini_client().aio.models.generate_content_stream(
            model=MODEL_ID, contents=contents, config=config
        )

        async for chunk in stream:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        print(f"聊天串流錯誤: {e}")
        yield "抱歉，發生錯誤，請稍後再試。"


async def gemini_stream_chat_with_tools(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    tool_handler: "UnifiedToolHandler",
    system_prompt: Optional[str] = None,
    config: Optional[types.GenerateContentConfig] = None,
) -> AsyncGenerator[Union[str, ChatStreamChunk], None]:
    """帶工具功能的 Gemini 聊天"""
    contents = build_message_contents(history, messages, system_prompt)
    tools = UnifiedToolHandler.create_all_tools()

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
            tools=tools,
        )

    try:
        response = await get_gemini_client().aio.models.generate_content(
            model=MODEL_ID, contents=contents, config=config
        )

        async for chunk in _process_tool_response(response, tool_handler, contents):
            yield chunk

    except Exception as e:
        print(f"工具聊天錯誤: {e}")
        # 降級到普通聊天
        async for chunk in gemini_stream_chat(history, messages, system_prompt):
            yield ChatStreamChunk(type="text", content=chunk, tool_call=None)


async def _process_tool_response(
    response, tool_handler: "UnifiedToolHandler", contents: List[types.Content]
) -> AsyncGenerator[ChatStreamChunk, None]:
    """處理工具回應"""
    if not response.candidates:
        yield ChatStreamChunk(type="text", content="無法產生回應", tool_call=None)
        return

    candidate = response.candidates[0]
    if not candidate.content or not candidate.content.parts:
        yield ChatStreamChunk(type="text", content="無法產生回應", tool_call=None)
        return

    function_responses = []
    has_function_calls = False

    # 處理每個部分
    for part in candidate.content.parts:
        if hasattr(part, "function_call") and part.function_call:
            has_function_calls = True
            tool_result, tool_info = await tool_handler.handle_tool_call(
                part.function_call
            )

            yield ChatStreamChunk(
                type="tool_call",
                content=tool_result,
                tool_call=ToolCall(**tool_info),
            )

            if part.function_call.name:
                function_responses.append(
                    types.Part.from_function_response(
                        name=part.function_call.name, response={"result": tool_result}
                    )
                )
        elif hasattr(part, "text") and part.text:
            yield ChatStreamChunk(type="text", content=part.text, tool_call=None)

    # 如果有工具調用，取得最終回應
    if has_function_calls and function_responses:
        async for chunk in _get_final_response(contents, candidate, function_responses):
            yield chunk


async def _get_final_response(
    contents: List[types.Content], candidate, function_responses: List[types.Part]
) -> AsyncGenerator[ChatStreamChunk, None]:
    """取得工具調用後的最終回應"""
    conversation_parts = list(contents)
    conversation_parts.append(
        types.Content(role="model", parts=list(candidate.content.parts))
    )
    conversation_parts.append(types.Content(role="function", parts=function_responses))

    try:
        final_response = await get_gemini_client().aio.models.generate_content(
            model=MODEL_ID,
            contents=conversation_parts,
            config=types.GenerateContentConfig(
                temperature=0.7,
                candidate_count=1,
                max_output_tokens=2048,
            ),
        )

        if (
            final_response.candidates
            and final_response.candidates[0].content
            and final_response.candidates[0].content.parts
        ):
            for part in final_response.candidates[0].content.parts:
                if hasattr(part, "text") and part.text:
                    yield ChatStreamChunk(
                        type="text", content=part.text, tool_call=None
                    )

    except Exception as e:
        print(f"取得最終回應錯誤: {e}")
        yield ChatStreamChunk(
            type="text", content="處理工具回應時發生錯誤", tool_call=None
        )


class ContactTools:
    """聯絡人工具定義"""

    @staticmethod
    def create_tools() -> List[types.Tool]:
        """創建聯絡人管理工具"""
        return [
            ContactTools._get_contacts_tool(),
            ContactTools._get_contact_tool(),
            ContactTools._create_contact_tool(),
            ContactTools._update_contact_tool(),
            ContactTools._delete_contact_tool(),
            ContactTools._request_confirmation_tool(),
        ]

    @staticmethod
    def _get_contacts_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_contacts",
                    description="獲取聯絡人列表",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "search": types.Schema(
                                type=types.Type.STRING, description="搜索關鍵字"
                            ),
                            "limit": types.Schema(
                                type=types.Type.INTEGER, description="結果數量限制"
                            ),
                        },
                    ),
                )
            ]
        )

    @staticmethod
    def _get_contact_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_contact",
                    description="獲取聯絡人詳情",
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
        )

    @staticmethod
    def _create_contact_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="create_contact",
                    description="創建新聯絡人（需要用戶確認）",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "name": types.Schema(
                                type=types.Type.STRING, description="聯絡人姓名"
                            ),
                            "description": types.Schema(
                                type=types.Type.STRING, description="聯絡人描述"
                            ),
                        },
                        required=["name"],
                    ),
                )
            ]
        )

    @staticmethod
    def _update_contact_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="update_contact",
                    description="更新聯絡人（需要用戶確認）",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="聯絡人ID"
                            ),
                            "name": types.Schema(
                                type=types.Type.STRING, description="新姓名"
                            ),
                            "description": types.Schema(
                                type=types.Type.STRING, description="新描述"
                            ),
                        },
                        required=["contact_id"],
                    ),
                )
            ]
        )

    @staticmethod
    def _delete_contact_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="delete_contact",
                    description="刪除聯絡人（需要用戶確認）",
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
        )

    @staticmethod
    def _request_confirmation_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="request_user_confirmation",
                    description="請求用戶確認",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "action": types.Schema(
                                type=types.Type.STRING, description="操作描述"
                            ),
                            "details": types.Schema(
                                type=types.Type.STRING, description="詳細資訊"
                            ),
                        },
                        required=["action", "details"],
                    ),
                )
            ]
        )


class ContactToolHandler:
    """聯絡人工具處理器"""

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user

    async def handle_tool_call(self, tool_call: types.FunctionCall) -> tuple[str, dict]:
        """處理工具調用"""
        function_name = tool_call.name
        args = tool_call.args or {}

        handlers = {
            "get_contacts": self._get_contacts,
            "get_contact": self._get_contact,
            "create_contact": self._create_contact,
            "update_contact": self._update_contact,
            "delete_contact": self._delete_contact,
            "request_user_confirmation": self._request_confirmation,
        }

        handler = handlers.get(function_name) if function_name else None
        if not handler:
            result = f"未知的工具功能: {function_name or 'None'}"
        else:
            try:
                result = await handler(args)
            except Exception as e:
                result = f"執行 {function_name} 時發生錯誤: {str(e)}"

        return result, {"name": function_name, "arguments": args, "result": result}

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
            if contact.description is not None:
                result += f" - {contact.description}"
            result += "\n"

        return result

    async def _get_contact(self, args: Dict[str, Any]) -> str:
        """獲取聯絡人詳情"""
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
        if contact.description is not None:
            result += f"• 描述: {contact.description}\n"
        result += f"• 創建時間: {contact.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"

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
        if name and name != contact.name:
            contact.name = name
            updated_fields.append(f"姓名: {name}")

        if description is not None and description != contact.description:
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

    async def _request_confirmation(self, args: Dict[str, Any]) -> str:
        """請求用戶確認"""
        action = args.get("action")
        details = args.get("details")

        return (
            f"🤖 我想要執行以下操作，請確認是否同意：\n\n"
            f"📋 **操作**：{action}\n"
            f"📝 **詳情**：{details}\n\n"
            f"請回答「是」或「同意」來確認，或「否」或「取消」來取消操作。"
        )


class RecordTools:
    """記錄工具定義"""

    @staticmethod
    def create_tools() -> List[types.Tool]:
        """創建記錄管理工具"""
        return [
            RecordTools._get_records_tool(),
            RecordTools._get_records_by_contact_tool(),
            RecordTools._get_record_tool(),
            RecordTools._create_record_tool(),
            RecordTools._update_record_tool(),
            RecordTools._delete_record_tool(),
            RecordTools._get_record_categories_tool(),
        ]

    @staticmethod
    def _get_records_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_records",
                    description="獲取記錄列表，支援搜索和過濾",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="按聯絡人ID過濾"
                            ),
                            "category": types.Schema(
                                type=types.Type.STRING,
                                description="按分類過濾（Communications, Nicknames, Memories, Preferences, Plan, Other）",
                            ),
                            "search": types.Schema(
                                type=types.Type.STRING, description="搜索記錄內容"
                            ),
                            "limit": types.Schema(
                                type=types.Type.INTEGER, description="結果數量限制"
                            ),
                        },
                    ),
                )
            ]
        )

    @staticmethod
    def _get_records_by_contact_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_records_by_contact",
                    description="獲取指定聯絡人的所有記錄",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="聯絡人ID"
                            ),
                            "category": types.Schema(
                                type=types.Type.STRING,
                                description="按分類過濾（Communications, Nicknames, Memories, Preferences, Plan, Other）",
                            ),
                            "limit": types.Schema(
                                type=types.Type.INTEGER, description="結果數量限制"
                            ),
                        },
                        required=["contact_id"],
                    ),
                )
            ]
        )

    @staticmethod
    def _get_record_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_record",
                    description="獲取指定記錄詳情",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "record_id": types.Schema(
                                type=types.Type.INTEGER, description="記錄ID"
                            )
                        },
                        required=["record_id"],
                    ),
                )
            ]
        )

    @staticmethod
    def _create_record_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="create_record",
                    description="為聯絡人創建新記錄（需要用戶確認）",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "contact_id": types.Schema(
                                type=types.Type.INTEGER, description="聯絡人ID"
                            ),
                            "category": types.Schema(
                                type=types.Type.STRING,
                                description="記錄分類（Communications, Nicknames, Memories, Preferences, Plan, Other）",
                            ),
                            "content": types.Schema(
                                type=types.Type.STRING, description="記錄內容"
                            ),
                        },
                        required=["contact_id", "category", "content"],
                    ),
                )
            ]
        )

    @staticmethod
    def _update_record_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="update_record",
                    description="更新記錄（需要用戶確認）",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "record_id": types.Schema(
                                type=types.Type.INTEGER, description="記錄ID"
                            ),
                            "category": types.Schema(
                                type=types.Type.STRING,
                                description="新的記錄分類（Communications, Nicknames, Memories, Preferences, Plan, Other）",
                            ),
                            "content": types.Schema(
                                type=types.Type.STRING, description="新的記錄內容"
                            ),
                        },
                        required=["record_id"],
                    ),
                )
            ]
        )

    @staticmethod
    def _delete_record_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="delete_record",
                    description="刪除記錄（需要用戶確認）",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "record_id": types.Schema(
                                type=types.Type.INTEGER, description="記錄ID"
                            )
                        },
                        required=["record_id"],
                    ),
                )
            ]
        )

    @staticmethod
    def _get_record_categories_tool() -> types.Tool:
        return types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_record_categories",
                    description="獲取所有可用的記錄分類",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={},
                    ),
                )
            ]
        )


class RecordToolHandler:
    """記錄工具處理器"""

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user

    async def handle_tool_call(self, tool_call: types.FunctionCall) -> tuple[str, dict]:
        """處理記錄工具調用"""
        function_name = tool_call.name
        args = tool_call.args or {}

        handlers = {
            "get_records": self._get_records,
            "get_records_by_contact": self._get_records_by_contact,
            "get_record": self._get_record,
            "create_record": self._create_record,
            "update_record": self._update_record,
            "delete_record": self._delete_record,
            "get_record_categories": self._get_record_categories,
        }

        handler = handlers.get(function_name) if function_name else None
        if not handler:
            result = f"未知的記錄工具功能: {function_name or 'None'}"
        else:
            try:
                result = await handler(args)
            except Exception as e:
                result = f"執行記錄工具 {function_name} 時發生錯誤: {str(e)}"

        return result, {"name": function_name, "arguments": args, "result": result}

    async def _get_records(self, args: Dict[str, Any]) -> str:
        """獲取記錄列表"""
        contact_id = args.get("contact_id")
        category = args.get("category")
        search = args.get("search")
        limit = args.get("limit", 10)

        # 基礎查詢：只能查看自己聯絡人的記錄
        query = (
            self.db.query(Record)
            .join(Contact)
            .filter(Contact.user_id == self.current_user.id)
        )

        # 按聯絡人過濾
        if contact_id:
            query = query.filter(Record.contact_id == contact_id)

        # 按分類過濾
        if category:
            try:
                category_enum = RecordCategory(category)
                query = query.filter(Record.category == category_enum)
            except ValueError:
                return f"無效的記錄分類: {category}。有效分類: {', '.join([c.value for c in RecordCategory])}"

        # 內容搜索
        if search:
            query = query.filter(Record.content.contains(search))

        records = query.limit(limit).all()

        if not records:
            filter_desc = []
            if contact_id:
                filter_desc.append(f"聯絡人ID {contact_id}")
            if category:
                filter_desc.append(f"分類 {category}")
            if search:
                filter_desc.append(f"內容包含 '{search}'")

            filter_str = "，".join(filter_desc) if filter_desc else ""
            return f"沒有找到記錄{f'（{filter_str}）' if filter_str else ''}。"

        result = "記錄列表：\n"
        for record in records:
            contact_name = record.contact.name if record.contact else "未知聯絡人"
            content_preview = (
                record.content[:50] + "..."
                if len(str(record.content)) > 50  # type: ignore
                else str(record.content)
            )
            result += f"• [{record.id}] {contact_name} - {record.category.value}: {content_preview}\n"

        return result

    async def _get_records_by_contact(self, args: Dict[str, Any]) -> str:
        """獲取指定聯絡人的記錄"""
        contact_id = args.get("contact_id")
        category = args.get("category")
        limit = args.get("limit", 20)

        # 檢查聯絡人是否存在且屬於當前用戶
        contact = (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not contact:
            return f"找不到 ID 為 {contact_id} 的聯絡人或您沒有權限查看。"

        # 查詢該聯絡人的記錄
        query = self.db.query(Record).filter(Record.contact_id == contact_id)

        # 按分類過濾
        if category:
            try:
                category_enum = RecordCategory(category)
                query = query.filter(Record.category == category_enum)
            except ValueError:
                return f"無效的記錄分類: {category}。有效分類: {', '.join([c.value for c in RecordCategory])}"

        records = query.limit(limit).all()

        if not records:
            category_desc = f"（分類: {category}）" if category else ""
            return f"聯絡人 {contact.name} 沒有記錄{category_desc}。"

        result = f"聯絡人 {contact.name} 的記錄：\n"

        # 按分類分組顯示
        records_by_category = {}
        for record in records:
            cat = record.category.value
            if cat not in records_by_category:
                records_by_category[cat] = []
            records_by_category[cat].append(record)

        for cat, cat_records in records_by_category.items():
            result += f"\n📂 {cat}:\n"
            for record in cat_records:
                created = record.created_at.strftime("%Y-%m-%d")
                content_preview = (
                    record.content[:100] + "..."
                    if len(str(record.content)) > 100  # type: ignore
                    else str(record.content)
                )
                result += f"  • [{record.id}] {content_preview} ({created})\n"

        return result

    async def _get_record(self, args: Dict[str, Any]) -> str:
        """獲取記錄詳情"""
        record_id = args.get("record_id")

        record = (
            self.db.query(Record)
            .join(Contact)
            .filter(Record.id == record_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not record:
            return f"找不到 ID 為 {record_id} 的記錄或您沒有權限查看。"

        contact_name = record.contact.name if record.contact else "未知聯絡人"

        result = f"記錄詳情：\n"
        result += f"• ID: {record.id}\n"
        result += f"• 聯絡人: {contact_name} (ID: {record.contact_id})\n"
        result += f"• 分類: {record.category.value}\n"
        result += f"• 內容: {record.content}\n"
        result += f"• 創建時間: {record.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        if record.updated_at is not None:
            result += f"• 更新時間: {record.updated_at.strftime('%Y-%m-%d %H:%M:%S')}\n"

        return result

    async def _create_record(self, args: Dict[str, Any]) -> str:
        """創建新記錄"""
        contact_id = args.get("contact_id")
        category = args.get("category")
        content = args.get("content")

        # 檢查聯絡人是否存在且屬於當前用戶
        contact = (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not contact:
            return f"找不到 ID 為 {contact_id} 的聯絡人或您沒有權限。"

        # 驗證分類
        try:
            category_enum = RecordCategory(category)
        except ValueError:
            return f"無效的記錄分類: {category}。有效分類: {', '.join([c.value for c in RecordCategory])}"

        new_record = Record(
            category=category_enum,
            content=content,
            contact_id=contact_id,
        )

        self.db.add(new_record)
        self.db.commit()
        self.db.refresh(new_record)

        result = f"✅ 已成功為聯絡人 {contact.name} 創建記錄：\n"
        result += f"• ID: {new_record.id}\n"
        result += f"• 分類: {category}\n"
        result += f"• 內容: {content}\n"

        return result

    async def _update_record(self, args: Dict[str, Any]) -> str:
        """更新記錄"""
        record_id = args.get("record_id")
        category = args.get("category")
        content = args.get("content")

        record = (
            self.db.query(Record)
            .join(Contact)
            .filter(Record.id == record_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not record:
            return f"找不到 ID 為 {record_id} 的記錄或您沒有權限。"

        updated_fields = []

        if category and category != record.category.value:
            try:
                category_enum = RecordCategory(category)
                setattr(record, "category", category_enum)  # type: ignore
                updated_fields.append(f"分類: {category}")
            except ValueError:
                return f"無效的記錄分類: {category}。有效分類: {', '.join([c.value for c in RecordCategory])}"

        if content and content != record.content:
            setattr(record, "content", content)  # type: ignore
            content_preview = content[:50] + "..." if len(content) > 50 else content
            updated_fields.append(f"內容: {content_preview}")

        if not updated_fields:
            return "沒有需要更新的欄位。"

        self.db.commit()
        self.db.refresh(record)

        contact_name = record.contact.name if record.contact else "未知聯絡人"
        result = f"✅ 已成功更新記錄 [{record_id}]（{contact_name}）：\n"
        for field in updated_fields:
            result += f"• {field}\n"

        return result

    async def _delete_record(self, args: Dict[str, Any]) -> str:
        """刪除記錄"""
        record_id = args.get("record_id")

        record = (
            self.db.query(Record)
            .join(Contact)
            .filter(Record.id == record_id, Contact.user_id == self.current_user.id)
            .first()
        )

        if not record:
            return f"找不到 ID 為 {record_id} 的記錄或您沒有權限。"

        contact_name = record.contact.name if record.contact else "未知聯絡人"
        record_category = record.category.value
        record_content = (
            str(record.content)[:30] + "..."
            if len(str(record.content)) > 30
            else str(record.content)  # type: ignore
        )

        self.db.delete(record)
        self.db.commit()

        return f"✅ 已成功刪除記錄 [{record_id}]：{contact_name} - {record_category}: {record_content}"

    async def _get_record_categories(self, args: Dict[str, Any]) -> str:
        """獲取記錄分類列表"""
        categories = [category.value for category in RecordCategory]

        result = "可用的記錄分類：\n"
        category_descriptions = {
            "Communications": "📞 通訊記錄 - 電話、訊息、郵件等聯絡記錄",
            "Nicknames": "🏷️ 暱稱 - 對聯絡人的稱呼或代號",
            "Memories": "💭 回憶 - 共同回憶、重要事件記錄",
            "Preferences": "❤️ 偏好 - 喜好、興趣、習慣等",
            "Plan": "📅 計劃 - 未來計劃、約定、待辦事項",
            "Other": "📝 其他 - 其他類型的記錄",
        }

        for category in categories:
            description = category_descriptions.get(category, category)
            result += f"• {description}\n"

        return result


class UnifiedToolHandler:
    """統一工具處理器 - 處理聯絡人和記錄的所有操作"""

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user
        self.contact_handler = ContactToolHandler(db, current_user)
        self.record_handler = RecordToolHandler(db, current_user)

    async def handle_tool_call(self, tool_call: types.FunctionCall) -> tuple[str, dict]:
        """統一處理工具調用"""
        function_name = tool_call.name

        # 確認工具分類
        contact_tools = {
            "get_contacts",
            "get_contact",
            "create_contact",
            "update_contact",
            "delete_contact",
            "request_user_confirmation",
        }

        record_tools = {
            "get_records",
            "get_records_by_contact",
            "get_record",
            "create_record",
            "update_record",
            "delete_record",
            "get_record_categories",
        }

        if function_name in contact_tools:
            return await self.contact_handler.handle_tool_call(tool_call)
        elif function_name in record_tools:
            return await self.record_handler.handle_tool_call(tool_call)
        else:
            result = f"未知的工具功能: {function_name or 'None'}"
            return result, {
                "name": function_name,
                "arguments": tool_call.args or {},
                "result": result,
            }

    @staticmethod
    def create_all_tools() -> List[types.Tool]:
        """創建所有工具（聯絡人 + 記錄）"""
        return ContactTools.create_tools() + RecordTools.create_tools()
