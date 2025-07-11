"""聯絡人工具處理器"""

from typing import Any, Dict

from google.genai import types
from sqlalchemy.orm import Session

from ...models import Contact, User


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
