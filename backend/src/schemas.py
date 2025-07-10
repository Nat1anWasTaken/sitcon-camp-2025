from datetime import datetime
from typing import Optional, List

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


class ChatMessage(BaseModel):
    """
    聊天訊息模型
    """
    role: str = Field(..., description="訊息角色 (user, assistant, system)")
    content: str = Field(..., description="訊息內容")
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
