"""記錄工具處理器"""

from typing import Any, Dict

from google.genai import types
from sqlalchemy.orm import Session

from ...models import Contact, Record, RecordCategory, User


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
                if len(str(record.content)) > 50
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
                    if len(str(record.content)) > 100
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
                setattr(record, "category", category_enum)
                updated_fields.append(f"分類: {category}")
            except ValueError:
                return f"無效的記錄分類: {category}。有效分類: {', '.join([c.value for c in RecordCategory])}"

        if content and content != record.content:
            setattr(record, "content", content)
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
            else str(record.content)
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
