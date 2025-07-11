from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..models import Contact, Record, RecordCategory, User
from ..schemas import (
    RecordCategoryEnum,
    RecordCreate,
    RecordListResponse,
    RecordResponse,
    RecordUpdate,
)

router = APIRouter(prefix="/records", tags=["records"])


@router.post("/", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    創建新記錄
    """
    # 檢查聯絡人是否存在且屬於當前用戶
    contact = (
        db.query(Contact)
        .filter(Contact.id == record.contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到或您沒有權限"
        )

    # 將 Pydantic 枚舉轉換為 SQLAlchemy 枚舉
    category_value = RecordCategory(record.category.value)

    db_record = Record(
        category=category_value,
        content=record.content,
        contact_id=record.contact_id,
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return db_record


@router.get("/", response_model=RecordListResponse)
async def get_records(
    skip: int = 0,
    limit: int = 100,
    contact_id: Optional[int] = None,
    category: Optional[RecordCategoryEnum] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    獲取記錄列表，支援按聯絡人、分類和內容搜索過濾
    """
    # 基礎查詢：只能查看自己聯絡人的記錄
    query = db.query(Record).join(Contact).filter(Contact.user_id == current_user.id)

    # 按聯絡人過濾
    if contact_id:
        query = query.filter(Record.contact_id == contact_id)

    # 按分類過濾
    if category:
        category_value = RecordCategory(category.value)
        query = query.filter(Record.category == category_value)

    # 內容搜索
    if search:
        query = query.filter(Record.content.contains(search))

    # 獲取總數
    total = query.count()

    # 分頁
    records = query.offset(skip).limit(limit).all()

    return RecordListResponse(
        records=[RecordResponse.model_validate(record) for record in records],
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        size=len(records),
    )


@router.get("/by-contact/{contact_id}", response_model=RecordListResponse)
async def get_records_by_contact(
    contact_id: int,
    skip: int = 0,
    limit: int = 100,
    category: Optional[RecordCategoryEnum] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    獲取指定聯絡人的記錄列表
    """
    # 檢查聯絡人是否存在且屬於當前用戶
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == current_user.id)
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人未找到或您沒有權限"
        )

    # 查詢該聯絡人的記錄
    query = db.query(Record).filter(Record.contact_id == contact_id)

    # 按分類過濾
    if category:
        category_value = RecordCategory(category.value)
        query = query.filter(Record.category == category_value)

    # 內容搜索
    if search:
        query = query.filter(Record.content.contains(search))

    # 獲取總數
    total = query.count()

    # 分頁
    records = query.offset(skip).limit(limit).all()

    return RecordListResponse(
        records=[RecordResponse.model_validate(record) for record in records],
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        size=len(records),
    )


@router.get("/{record_id}", response_model=RecordResponse)
async def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    獲取指定記錄詳情
    """
    record = (
        db.query(Record)
        .join(Contact)
        .filter(Record.id == record_id, Contact.user_id == current_user.id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="記錄未找到或您沒有權限"
        )

    return record


@router.put("/{record_id}", response_model=RecordResponse)
async def update_record(
    record_id: int,
    record_update: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    更新記錄資訊
    """
    record = (
        db.query(Record)
        .join(Contact)
        .filter(Record.id == record_id, Contact.user_id == current_user.id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="記錄未找到或您沒有權限"
        )

    # 更新字段
    update_data = record_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "category" and value is not None:
            # 將 Pydantic 枚舉轉換為 SQLAlchemy 枚舉
            setattr(record, field, RecordCategory(value.value))
        else:
            setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    刪除記錄
    """
    record = (
        db.query(Record)
        .join(Contact)
        .filter(Record.id == record_id, Contact.user_id == current_user.id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="記錄未找到或您沒有權限"
        )

    db.delete(record)
    db.commit()


@router.get("/categories/", response_model=List[str])
async def get_record_categories():
    """
    獲取所有可用的記錄分類
    """
    return [category.value for category in RecordCategoryEnum]
