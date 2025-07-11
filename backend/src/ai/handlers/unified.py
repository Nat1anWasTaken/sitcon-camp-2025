"""統一工具處理器"""

from typing import List

from google.genai import types
from sqlalchemy.orm import Session

from ...models import User
from ..tools.contact import ContactTools
from ..tools.record import RecordTools
from .contact import ContactToolHandler
from .record import RecordToolHandler


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
