from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import Contact, Record, User
from .schemas import TokenData

# 密碼加密配置
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 配置
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# JWT 配置
SECRET_KEY = "your-secret-key-here-change-in-production"  # 在生產環境中應該使用環境變數
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60  # 7 天


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證密碼
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    密碼雜湊
    """
    return pwd_context.hash(password)


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    根據用戶名獲取用戶
    """
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    根據郵箱獲取用戶
    """
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    驗證用戶身份
    """
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    創建 JWT 訪問令牌
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """
    獲取當前登入用戶
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="無法驗證憑證",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    if token_data.username is None:
        raise credentials_exception

    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """
    獲取當前活躍用戶
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用戶帳號已被停用")
    return current_user


async def get_user_contacts(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    query = (
        db.query(Contact)
        .filter(Contact.user_id == current_user.id)
        .options(selectinload(Contact.records))
    )

    contacts = query.all()

    return contacts


async def get_user_records(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """
    獲取當前用戶的所有記錄
    """
    query = db.query(Record).join(Contact).filter(Contact.user_id == current_user.id)

    records = query.all()

    return records
