from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..file_utils import delete_avatar, get_avatar_file, upload_avatar
from ..models import Contact, User
from ..schemas import (
    ContactCreate,
    ContactListResponse,
    ContactResponse,
    ContactUpdate,
    FileUploadResponse,
)

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    創建新聯絡人
    """
    db_contact = Contact(
        name=contact.name,
        description=contact.description,
        user_id=current_user.id,
    )

    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)

    return db_contact


@router.post(
    "/with-avatar", response_model=ContactResponse, status_code=status.HTTP_201_CREATED
)
async def create_contact_with_avatar(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    創建聯絡人並同時上傳頭像
    """
    # 創建聯絡人
    db_contact = Contact(
        name=name,
        description=description,
        user_id=current_user.id,
    )

    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)

    # 如果有頭像，則上傳
    if avatar and avatar.filename:
        try:
            avatar_key = await upload_avatar(avatar, current_user.id, db_contact.id)  # type: ignore
            db_contact.avatar_key = avatar_key  # type: ignore
            db.commit()
            db.refresh(db_contact)
        except Exception as e:
            # 如果頭像上傳失敗，刪除已創建的聯絡人
            db.delete(db_contact)
            db.commit()
            raise e

    return db_contact


@router.get("/", response_model=ContactListResponse)
async def get_contacts(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    獲取當前用戶的聯絡人列表
    """
    query = db.query(Contact).filter(Contact.user_id == current_user.id)

    # 搜索功能
    if search:
        query = query.filter(Contact.name.contains(search))

    # 獲取總數
    total = query.count()

    # 分頁
    contacts = query.offset(skip).limit(limit).all()

    return ContactListResponse(
        contacts=[ContactResponse.model_validate(contact) for contact in contacts],
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        size=len(contacts),
    )


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    獲取指定聯絡人詳情
    """
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到"
        )

    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    更新聯絡人資訊
    """
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到"
        )

    # 更新字段
    update_data = contact_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)

    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    刪除聯絡人
    """
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到"
        )

    # 刪除頭像文件
    if contact.avatar_key:  # type: ignore
        delete_avatar(contact.avatar_key)  # type: ignore

    db.delete(contact)
    db.commit()


@router.post("/{contact_id}/avatar", response_model=FileUploadResponse)
async def upload_contact_avatar(
    contact_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    上傳聯絡人頭像
    """
    # 檢查聯絡人是否存在
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到"
        )

    # 刪除舊頭像
    if contact.avatar_key:  # type: ignore
        delete_avatar(contact.avatar_key)  # type: ignore

    # 上傳新頭像
    avatar_key = await upload_avatar(file, current_user.id, contact_id)  # type: ignore

    # 更新資料庫
    contact.avatar_key = avatar_key  # type: ignore
    db.commit()
    db.refresh(contact)

    return FileUploadResponse(
        filename=file.filename or "avatar.jpg",
        size=file.size or 0,
        content_type=file.content_type or "image/jpeg",
    )


@router.delete("/{contact_id}/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact_avatar(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    刪除聯絡人頭像
    """
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到"
        )

    # 刪除頭像文件
    if contact.avatar_key:  # type: ignore
        delete_avatar(contact.avatar_key)  # type: ignore
        contact.avatar_key = None  # type: ignore
        db.commit()


@router.get("/{contact_id}/avatar/image")
async def get_contact_avatar_image(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    直接返回聯絡人頭像圖片文件
    """
    # 檢查聯絡人是否存在
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到"
        )

    if not contact.avatar_key:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人沒有頭像"
        )

    # 獲取頭像文件內容
    file_content, content_type = get_avatar_file(contact.avatar_key)  # type: ignore

    return Response(
        content=file_content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=3600",  # 緩存 1 小時
            "Content-Disposition": f"inline; filename=avatar_{contact_id}.jpg",
        },
    )
