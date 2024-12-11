import uuid
from sqlalchemy.orm import Session
from typing import Any
from app import crud
from typing import List
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
from app.crud import get_collaborators_by_todo
from app.api.deps import CurrentUser, SessionDep
from app.models import Collaborator, Todo, TodoCreate, TodoPublic, TodosPublic, TodoUpdate, Message, CollaboratorPublic, CollaboratorUpdate, UserPublic 
from fastapi import Query
router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=TodosPublic)
def read_todos(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve todos.
    """
    print("helelo")

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
        count = session.exec(count_statement).one()
        statement = (
            select(Todo)
            .where(Todo.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
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
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Task not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
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
    # collaboratorTodo = session.get(Collaborator, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Task not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    # if collaboratorTodo:
    #     session.delete(collaboratorTodo)
    #     session.commit()
    # if not collaboratorTodo:
    #     pass

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
        collaborator = crud.add_collaborator_by_invite_code(
            session=session, todo_id=todo_id, invite_code=todo_in.invite_code, is_owner=todo_in.is_owner
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Return the collaborator or something that matches CollaboratorUpdate
    return collaborator  # Make sure this matches the response model


@router.get("/{todo_id}/collaborators", response_model=List[CollaboratorPublic])
def get_collaborators(
    *, session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID
) -> Any:
    """
    Retrieve the list of collaborators for a Todo.
    """
    # Kiểm tra quyền truy cập vào Todo
    if not check_todo_access(session=session, todo_id=todo_id, user_id=current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    collaborators = get_collaborators_by_todo(session=session, todo_id=todo_id)
    return collaborators

@router.delete("/{todo_id}/collaborators/{user_id}")
def remove_collaborator(
    *, session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID, user_id: uuid.UUID
) -> Message:
    """
    Remove a collaborator from a Todo.
    """
    # Kiểm tra quyền truy cập vào Todo
    if not check_todo_access(session=session, todo_id=todo_id, user_id=current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Xóa cộng tác viên
    remove_collaborator(session=session, todo_id=todo_id, user_id=user_id)
    
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

