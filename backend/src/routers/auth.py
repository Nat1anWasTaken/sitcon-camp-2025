from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    get_user_by_email,
    get_user_by_username,
    verify_password,
)
from ..database import get_db
from ..models import User, Contact, Record
from ..schemas import (
    Token, 
    UserCreate, 
    UserResponse, 
    PasswordChangeRequest,
    UserPreferencesUpdate,
    AccountDeletionRequest,
    ProfileResponse
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    用戶註冊端點
    """
    # 檢查用戶名是否已存在
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用戶名已存在"
        )

    # 檢查郵箱是否已存在
    db_user = get_user_by_email(db, email=str(user.email))
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="郵箱已被註冊"
        )

    # 創建新用戶
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=str(user.email),
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    用戶登入端點
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶名或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用戶帳號已被停用"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/@me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    獲取當前用戶資訊端點
    """
    return current_user


@router.get("/profile", response_model=ProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    獲取用戶完整個人資料，包含統計資料
    """
    # 獲取聯絡人數量
    contacts_count = db.query(Contact).filter(Contact.user_id == current_user.id).count()
    
    # 獲取記錄數量
    records_count = (
        db.query(Record)
        .join(Contact)
        .filter(Contact.user_id == current_user.id)
        .count()
    )
    
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        contacts_count=contacts_count,
        records_count=records_count,
    )


@router.put("/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    變更用戶密碼
    """
    # 驗證當前密碼
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="當前密碼錯誤"
        )
    
    # 檢查新密碼不能與當前密碼相同
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密碼不能與當前密碼相同"
        )
    
    # 更新密碼
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "密碼已成功更新"}


@router.put("/preferences", response_model=UserResponse)
async def update_user_preferences(
    preferences_data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    更新用戶偏好設定
    """
    # 檢查 email 是否已被其他用戶使用
    if preferences_data.email and preferences_data.email != current_user.email:
        existing_user = get_user_by_email(db, str(preferences_data.email))
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="該電子郵件已被其他用戶使用"
            )
    
    # 更新用戶資料
    update_data = preferences_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email":
            setattr(current_user, field, str(value))
        else:
            setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    deletion_data: AccountDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    刪除用戶帳號（軟刪除）
    """
    # 驗證密碼
    if not verify_password(deletion_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密碼錯誤"
        )
    
    # 驗證確認字串
    if deletion_data.confirmation != "DELETE_MY_ACCOUNT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="確認字串錯誤，請輸入 'DELETE_MY_ACCOUNT'"
        )
    
    # 軟刪除：將用戶設為非活躍狀態
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "帳號已成功停用"}


@router.delete("/account/permanent", status_code=status.HTTP_200_OK)
async def permanently_delete_account(
    deletion_data: AccountDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    永久刪除用戶帳號及所有相關資料
    警告：此操作無法復原
    """
    # 驗證密碼
    if not verify_password(deletion_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密碼錯誤"
        )
    
    # 驗證確認字串
    if deletion_data.confirmation != "DELETE_MY_ACCOUNT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="確認字串錯誤，請輸入 'DELETE_MY_ACCOUNT'"
        )
    
    # 永久刪除用戶（由於外鍵約束，相關的 contacts 和 records 也會被級聯刪除）
    db.delete(current_user)
    db.commit()
    
    return {"message": "帳號及所有相關資料已永久刪除"}
