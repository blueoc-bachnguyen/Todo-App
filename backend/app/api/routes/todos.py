import uuid
from sqlalchemy.orm import Session
from typing import Any, List
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.crud import get_collaborators_by_todo
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Todo, TodoCreate, TodoPublic, TodosPublic, TodoUpdate, 
    Message, Collaborator, SubTodo, SubTodosPublic, 
    CollaboratorPublic, CollaboratorUpdate, User, UserPublic, 
    CollaboratorUserDataPublic
)

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=TodosPublic)
def read_todos(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str | None = None
) -> Any:
    """
    Retrieve todos.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Todo)
        count = session.exec(count_statement).one()
        statement = select(Todo).offset(skip).limit(limit)
        todos = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Todo)
            .where(Todo.owner_id == current_user.id)
        )
        statement = (
            select(Todo)
            .where(Todo.owner_id == current_user.id)
            .order_by(Todo.created_at.desc())
        )
        if search:
            statement = statement.where(Todo.title.contains(search) | Todo.desc.contains(search) | Todo.status.contains(search))
            count_statement = (
                select(func.count())
                .select_from(Todo)
                .where(Todo.owner_id == current_user.id)
                .where(Todo.title.contains(search) | Todo.desc.contains(search) | Todo.status.contains(search))
            )
        count = session.exec(count_statement).one()
        statement = statement.offset(skip).limit(limit)
        todos = session.exec(statement).all()
    return TodosPublic(data=todos, count=count)


@router.get("/{id}/todo", response_model=TodoPublic)
def read_todo(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get todo by ID.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Task not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return todo

# CurrentUser to authenticat ->middleware
@router.post("", response_model=TodoPublic)
def create_todo(
    *, session: SessionDep, current_user: CurrentUser, todo_in: TodoCreate
) -> TodoPublic:
    """
    Create new todo.
    """
    todo = Todo.model_validate(todo_in, update={"owner_id": current_user.id})
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.put("/{id}", response_model=TodoPublic)
def update_todo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    todo_in: TodoUpdate,
) -> Any:
    """
    Update an item.
    """
    # Lấy thông tin todo
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Task not found")

    # Kiểm tra quyền sửa todo
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        # Truy vấn bảng Collaborator để kiểm tra quyền
        collaborator_exists = session.query(Collaborator).filter(
            Collaborator.todo_id == todo.id,
            Collaborator.user_id == current_user.id
        ).first()
        if not collaborator_exists:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    # Cập nhật todo
    update_dict = todo_in.model_dump(exclude_unset=True)
    todo.sqlmodel_update(update_dict)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.delete("/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Task not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.query(Collaborator).filter(Collaborator.todo_id == id).delete()
    session.delete(todo)
    session.commit()
    return Message(message="Task deleted successfully")



@router.post("/{todo_id}/invite", response_model=CollaboratorUpdate)
def invite_collaborator(
    *, 
    session: SessionDep, 
    current_user: CurrentUser, 
    todo_id: uuid.UUID, 
    todo_in: CollaboratorUpdate
) -> CollaboratorUpdate:

    try:
        if (todo_in.invite_code == current_user.invite_code):
            raise HTTPException(status_code=400, detail="You cannot invite yourself")
        collaborator = crud.add_collaborator_by_invite_code(
            session=session, todo_id=todo_id, invite_code=todo_in.invite_code
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Return the collaborator or something that matches CollaboratorUpdate
    return collaborator  # Make sure this matches the response model


@router.get("/{todo_id}/collaborators", response_model=List[CollaboratorUserDataPublic])
def get_collaborators(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    todo_id: uuid.UUID
) -> Any:
    """
    Retrieve the list of collaborators for a Todo, including user details.
    """
    query = (
        select(User)
        .join(Collaborator, Collaborator.user_id == User.id)
        .where(Collaborator.todo_id == todo_id)
    )
    users = session.exec(query).all()
    results = [
        CollaboratorUserDataPublic(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            invite_code=user.invite_code
        )
        for user in users
    ]
    return results

@router.delete("/{todo_id}/collaborators/{user_id}/remove", response_model=Message)
def remove_collaborator(
    *, session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID, user_id: uuid.UUID
) -> Message:
    """
    Remove a collaborator from a Todo.
    """
    # Query to find the collaborator
    collaborator_query = select(Collaborator).where(
        Collaborator.todo_id == todo_id, Collaborator.user_id == user_id
    )

    # Execute the query
    collaborator = session.exec(collaborator_query).first()

    # If no collaborator is found, raise a 404 error
    if not collaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found")

    # Check if the current user has permission to remove collaborators
    todo_query = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(todo_query).first()

    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    if todo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Remove the collaborator from the database
    session.delete(collaborator)

    # Commit the changes
    session.commit()

    return Message(message="Collaborator removed successfully")


@router.delete("/{todo_id}/leave_collaborate", response_model=Message)
def remove_collaborator(
    *, session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID
) -> Message:
    """
    Remove a collaborator from a Todo.
    """
    # Query to find the collaborator
    collaborator_query = select(Collaborator).where(
        Collaborator.todo_id == todo_id, Collaborator.user_id == current_user.id
    )

    # Execute the query
    collaborator = session.exec(collaborator_query).first()

    # If no collaborator is found, raise a 404 error
    if not collaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found")

    # Check if the current user has permission to remove collaborators
    todo_query = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(todo_query).first()

    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    

    # Remove the collaborator from the database
    session.delete(collaborator)

    # Commit the changes
    session.commit()

    return Message(message="Collaborator removed successfully")

@router.get("/{todo_id}/access", response_model=Message)
def check_access(
    *, session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID
) -> Message:
    """
    Check if the current user has access to a Todo.
    """
    has_access = check_todo_access(session=session, todo_id=todo_id, user_id=current_user.id)
    if not has_access:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    return Message(message="User has access to this Todo.")

# getCollaboratedTodos
@router.get("/collaborated")
def get_collaborated_todos(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> TodosPublic:
    """
    Retrieve collaborated todos.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Todo)
        count = session.exec(count_statement).one()
        statement = select(Todo).offset(skip).limit(limit)
        todos = session.exec(statement).all()
    else:
        count_statement = (
        select(func.count())
        .select_from(Collaborator)
        .where(Collaborator.user_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    # Lấy danh sách todos mà user đang cộng tác
    statement = (
        select(Todo)
        .join(Collaborator, Todo.id == Collaborator.todo_id)
        .where(Collaborator.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    todos = session.exec(statement).all()

    return TodosPublic(data=todos, count=count)

