import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import Collaborator, Item, ItemCreate, Todo, TodoCreate, User, UserCreate, UserUpdate, SubTodoCreate, CollaboratorUpdate


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


# New function query for inviting collaborators
def add_collaborator_by_invite_code(
    *, session: Session, todo_id: uuid.UUID, invite_code: str
) -> CollaboratorUpdate:  # Đảm bảo kiểu trả về là CollaboratorUpdate
    user = session.exec(select(User).where(User.invite_code == invite_code)).first()
    if not user:
        raise ValueError("Mã mời không hợp lệ.")

    existing_collaborator = session.exec(
        select(Collaborator).where(Collaborator.todo_id == todo_id, Collaborator.user_id == user.id)
    ).first()
    if existing_collaborator:
        raise ValueError("Cộng tác viên đã tồn tại cho Todo này.")

    # Thêm cộng tác viên mới
    collaborator = Collaborator(todo_id=todo_id, user_id=user.id)
    session.add(collaborator)
    session.commit()
    session.refresh(collaborator)

    # Trả về đối tượng phù hợp với CollaboratorUpdate
    return CollaboratorUpdate(invite_code=invite_code)


# # getCollaboratedTodos
# def getCollaboratedTodos(*, session: Session, user_id: uuid.UUID) -> list[Todo]:
#     return session.exec(select(Todo).join(Collaborator).where(Collaborator.user_id == user_id)).all()


def get_collaborators_by_todo(*, session: Session, todo_id: uuid.UUID) -> list[Collaborator]:
    collaborators = session.exec(select(Collaborator).where(Collaborator.todo_id == todo_id)).all()
    return collaborators

def remove_collaborator(*, session: Session, todo_id: uuid.UUID, user_id: uuid.UUID) -> None:
    collaborator = session.exec(
        select(Collaborator).where(Collaborator.todo_id == todo_id, Collaborator.user_id == user_id)
    ).first()
    if not collaborator:
        raise ValueError("Collaborator not found.")
    
    session.delete(collaborator)
    session.commit()

def check_todo_access(*, session: Session, todo_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    # Kiểm tra quyền sở hữu hoặc cộng tác
    todo_owner = session.exec(select(Todo).where(Todo.id == todo_id, Todo.owner_id == user_id)).first()
    if todo_owner:
        return True
    
    collaborator = session.exec(
        select(Collaborator).where(Collaborator.todo_id == todo_id, Collaborator.user_id == user_id)
    ).first()
    return bool(collaborator)

def get_todos_by_user(*, session: Session, user_id: uuid.UUID) -> list[Todo]:
    todos_as_owner = session.exec(select(Todo).where(Todo.owner_id == user_id)).all()
    todos_as_collaborator = session.exec(
        select(Todo).join(Collaborator).where(Collaborator.user_id == user_id)
    ).all()
    return todos_as_owner + todos_as_collaborator
