from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, EmailStr, Field


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
