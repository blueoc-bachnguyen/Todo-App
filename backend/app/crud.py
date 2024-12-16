import uuid
from typing import Any
import math
from sqlmodel import Session, select,func
from datetime import datetime
from app.core.security import get_password_hash, verify_password
from app.models import Item, ItemCreate, Todo, TodoCreate, User, UserCreate, UserUpdate, SubTodoCreate,Category,CategoryCreate,CategoryUpdate,ListCategories,LevelEnum,Message
from fastapi import HTTPException

def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_subtodo(*, session: Session, item_in: SubTodoCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


#  ========= CATEGORY============

def create_category(*, session: Session, cat_in: CategoryCreate, owner_id: uuid.UUID) -> Category:
    db_cat = Category.model_validate(cat_in, update={"owner_id": owner_id})
    session.add(db_cat)
    session.commit()
    session.refresh(db_cat)
    return db_cat

def get_all_categories(session: Session, owner_id: uuid.UUID, page: int, limit: int) -> ListCategories:
    print('hi')
    offset = (page - 1) * limit
    count_statement = (
            select(func.count())
            .select_from(Category)
            .where(Category.owner_id == owner_id)
        )
    count = session.exec(count_statement).one()
    statement = (
            select(Category)
            .where(Category.owner_id == owner_id)
            .offset(offset)
            .limit(limit)
        )
    items = session.exec(statement).all()
    pages = math.ceil(count / limit)
    return ListCategories(data=items, pages=pages)


def get_category(session: Session, cat_id: uuid.UUID, owner_id: uuid.UUID):
    cat = session.query(Category).filter(Category.id == cat_id, Category.owner_id == owner_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


def update_category(session: Session, cat_id: uuid.UUID, owner_id: uuid.UUID, cat_in: CategoryUpdate):
    cat = session.query(Category).filter(Category.id == cat_id, Category.owner_id == owner_id).first()

    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    update_dict = cat_in.model_dump(exclude_unset=True)
    cat.updated_at = datetime.now()
    cat.sqlmodel_update(update_dict)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat

def delete_category(session: Session, cat_id: uuid.UUID, owner_id: uuid.UUID):
    cat = session.query(Category).filter(Category.id == cat_id, Category.owner_id == owner_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="cat not found")
    session.delete(cat)
    session.commit()
    return Message(message="cat deleted successfully")


def delete_all_categories(session: Session, owner_id: uuid.UUID):
    statement = select(Category).where(Category.owner_id == owner_id)
    cats = session.exec(statement).all()

    for cat in cats:
        session.delete(cat)
    session.commit()
    return Message(message="all cats deleted successfully")