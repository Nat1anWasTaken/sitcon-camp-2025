import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite 資料庫文件路徑
SQLALCHEMY_DATABASE_URL = "sqlite:///./sitcon_camp.db"

# 創建資料庫引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 特有配置
)

# 創建 SessionLocal 類
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 創建 Base 類
Base = declarative_base()


def get_db():
    """
    資料庫依賴注入函數
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
