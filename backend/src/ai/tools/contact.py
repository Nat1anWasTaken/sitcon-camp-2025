"""聯絡人工具定義"""

from typing import List

from google.genai import types


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
