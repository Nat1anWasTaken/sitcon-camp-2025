import os
from datetime import datetime
from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, EmailStr, Field


class RecordCategoryEnum(str, Enum):
    """
    記錄分類枚舉
    """

    COMMUNICATIONS = "Communications"
    NICKNAMES = "Nicknames"
    MEMORIES = "Memories"
    PREFERENCES = "Preferences"
    PLAN = "Plan"
    OTHER = "Other"


class UserBase(BaseModel):
    """
    用戶基礎模型
    """

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    """
    用戶註冊模型
    """

    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """
    用戶登入模型
    """

    username: str
    password: str


class UserResponse(UserBase):
    """
    用戶響應模型
    """

    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    JWT 令牌模型
    """

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """
    令牌數據模型
    """

    username: Optional[str] = None


class UserInDB(UserBase):
    """
    資料庫中的用戶模型
    """

    id: int
    hashed_password: str
    is_active: bool


class ImageContent(BaseModel):
    """
    圖片內容模型
    """

    type: str = Field(default="image", description="內容類型")
    data: str = Field(..., description="Base64 編碼的圖片資料或圖片 URL")
    mime_type: str = Field(
        ..., description="圖片 MIME 類型 (e.g., image/jpeg, image/png)"
    )


class TextContent(BaseModel):
    """
    文字內容模型
    """

    type: str = Field(default="text", description="內容類型")
    text: str = Field(..., description="文字內容")


class ChatMessage(BaseModel):
    """
    聊天訊息模型 - 支援文字和多張圖片
    """

    role: str = Field(..., description="訊息角色 (user, assistant, system)")
    content: Union[str, List[Union[TextContent, ImageContent]]] = Field(
        ..., description="訊息內容 - 可以是純文字或包含文字和圖片的列表"
    )
    timestamp: Optional[datetime] = Field(None, description="訊息時間戳")


class ChatRequest(BaseModel):
    """
    聊天請求模型
    """

    history_messages: List[ChatMessage] = Field(default=[], description="歷史訊息")
    messages: List[ChatMessage] = Field(..., description="當前訊息")


class ChatResponse(BaseModel):
    """
    聊天響應模型
    """

    message: str = Field(..., description="回應訊息")
    timestamp: datetime = Field(..., description="響應時間戳")
    status: str = Field(default="success", description="響應狀態")


class ToolCall(BaseModel):
    """
    工具調用模型
    """

    name: str = Field(..., description="工具名稱")
    arguments: dict = Field(..., description="工具參數")
    result: str = Field(..., description="工具執行結果")


class ChatStreamChunk(BaseModel):
    """
    聊天串流片段模型 - 支援文字和工具調用
    """

    type: str = Field(..., description="片段類型: 'text' 或 'tool_call'")
    content: Optional[str] = Field(None, description="文字內容")
    tool_call: Optional[ToolCall] = Field(None, description="工具調用資訊")
    timestamp: datetime = Field(default_factory=datetime.now, description="時間戳")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


# Contact 相關模型
class ContactBase(BaseModel):
    """
    聯絡人基礎模型
    """

    name: str = Field(..., min_length=1, max_length=100, description="聯絡人姓名")
    description: Optional[str] = Field(None, description="聯絡人描述")


class ContactCreate(ContactBase):
    """
    聯絡人創建模型
    """

    pass


class ContactUpdate(BaseModel):
    """
    聯絡人更新模型
    """

    name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="聯絡人姓名"
    )
    description: Optional[str] = Field(None, description="聯絡人描述")


class ContactResponse(ContactBase):
    """
    聯絡人響應模型
    """

    id: int
    avatar_key: Optional[str] = Field(None, description="頭像在 MinIO 中的對象鍵")
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    """
    聯絡人列表響應模型
    """

    contacts: List[ContactResponse]
    total: int
    page: int
    size: int


class FileUploadResponse(BaseModel):
    """
    文件上傳響應模型
    """

    filename: str
    size: int
    content_type: str


# Record 相關模型
class RecordBase(BaseModel):
    """
    記錄基礎模型
    """

    category: RecordCategoryEnum = Field(..., description="記錄分類")
    content: str = Field(..., min_length=1, description="記錄內容")


class RecordCreate(RecordBase):
    """
    記錄創建模型
    """

    contact_id: int = Field(..., description="所屬聯絡人 ID")


class RecordUpdate(BaseModel):
    """
    記錄更新模型
    """

    category: Optional[RecordCategoryEnum] = Field(None, description="記錄分類")
    content: Optional[str] = Field(None, min_length=1, description="記錄內容")


class RecordResponse(RecordBase):
    """
    記錄響應模型
    """

    id: int
    contact_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RecordListResponse(BaseModel):
    """
    記錄列表響應模型
    """

    records: List[RecordResponse]
    total: int
    page: int
    size: int


# 更新 ContactResponse 以包含 records
class ContactWithRecordsResponse(ContactResponse):
    """
    包含記錄的聯絡人響應模型
    """

    records: List[RecordResponse] = Field(default=[], description="聯絡人的記錄列表")


# User Profile Management Schemas
class PasswordChangeRequest(BaseModel):
    """
    用戶密碼變更請求模型
    """
    
    current_password: str = Field(..., description="當前密碼")
    new_password: str = Field(..., min_length=8, max_length=100, description="新密碼")


class UserPreferencesUpdate(BaseModel):
    """
    用戶偏好設定更新模型
    """
    
    full_name: Optional[str] = Field(None, max_length=100, description="完整姓名")
    email: Optional[EmailStr] = Field(None, description="電子郵件")


class AccountDeletionRequest(BaseModel):
    """
    帳號刪除請求模型
    """
    
    password: str = Field(..., description="確認密碼")
    confirmation: str = Field(..., description="確認字串，必須為 'DELETE_MY_ACCOUNT'")


class ProfileResponse(BaseModel):
    """
    用戶個人資料響應模型
    """
    
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    contacts_count: int = Field(0, description="聯絡人數量")
    records_count: int = Field(0, description="記錄數量")

    class Config:
        from_attributes = True
