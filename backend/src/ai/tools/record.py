"""記錄工具定義"""

from typing import List

from google.genai import types


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
                    description="為聯絡人創建新記錄",
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
                    description="更新記錄",
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
                    description="刪除記錄",
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
