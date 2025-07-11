import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class RecordCategory(enum.Enum):
    """
    記錄分類枚舉
    """

    COMMUNICATIONS = "Communications"
    NICKNAMES = "Nicknames"
    MEMORIES = "Memories"
    PREFERENCES = "Preferences"
    PLAN = "Plan"
    OTHER = "Other"


class User(Base):
    """
    用戶資料模型
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯關係
    contacts = relationship(
        "Contact", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class Contact(Base):
    """
    聯絡人資料模型
    """

    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    avatar_key = Column(String(500), nullable=True)  # 存儲頭像在 MinIO 中的對象鍵
    user_id = Column(
        Integer,
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯關係
    user = relationship("User", back_populates="contacts")
    records = relationship(
        "Record", back_populates="contact", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class Record(Base):
    """
    記錄資料模型 - 屬於聯絡人的數據條目
    """

    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(RecordCategory), nullable=False, index=True)
    content = Column(Text, nullable=False)
    contact_id = Column(
        Integer,
        ForeignKey("contacts.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯關係
    contact = relationship("Contact", back_populates="records")

    def __repr__(self):
        return f"<Record(id={self.id}, category='{self.category.value}', contact_id={self.contact_id})>"
