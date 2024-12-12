import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import SubTodo, SubTodoCreate, SubTodoPublic, SubTodosPublic, SubTodoUpdate, Message, Todo

router = APIRouter(prefix="", tags=["subtodos"])

@router.get("/todos/{todo_id}/subtodos", response_model=SubTodosPublic)
def read_subtodo(session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID) -> Any:
    todo = session.get(Todo, todo_id)
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    statement = select(SubTodo).where(SubTodo.todo_id == todo_id)
    subtodos = session.exec(statement).all()
    if not subtodos:
        raise HTTPException(status_code=404, detail="Sub Task not found")
    return SubTodosPublic(count=len(subtodos), data=subtodos)

@router.get("/todos/{todo_id}/subtodos/{id}", response_model=SubTodoPublic)
def read_sub_todo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    todo_id: uuid.UUID,
    id: uuid.UUID
) -> SubTodoPublic:
    """
    Retrieve a specific sub todo by its ID and associated todo ID.
    """
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and todo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions to access this Todo")
    statement = select(SubTodo).where(SubTodo.todo_id == todo_id, SubTodo.id == id)
    sub_todo = session.exec(statement).first()
    if not sub_todo:
        raise HTTPException(status_code=404, detail="SubTodo not found")
    return sub_todo

@router.post("/todos/{todo_id}/subtodos", response_model=SubTodoPublic)
def create_sub_todo(
    *, session: SessionDep, todo_id: uuid.UUID,sub_todo_in: SubTodoCreate
) -> Any:
    """
    Create new sub todo.
    """
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    sub_todo = SubTodoCreate.model_validate(sub_todo_in)
    create_todo = SubTodo(**{**sub_todo.dict(), "todo_id": todo_id})
    session.add(create_todo)
    session.commit()
    session.refresh(create_todo)
    return create_todo

@router.put("/todos/{todo_id}/subtodos/{id}", response_model=SubTodoPublic)
def update_sub_todo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    todo_id: uuid.UUID,
    id: uuid.UUID,
    sub_todo_in: SubTodoUpdate,
) -> Any:
    """
    Update a sub todo by ID.
    """
    sub_todo = session.get(SubTodo, id)
    if not sub_todo:
        raise HTTPException(status_code=404, detail="SubTodo not found")
    parent_todo = session.get(Todo, sub_todo.todo_id)
    if not parent_todo:
        raise HTTPException(status_code=404, detail="Parent Todo not found")
    if not current_user.is_superuser and (parent_todo.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_data = sub_todo_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sub_todo, key, value)
    session.add(sub_todo)
    session.commit()
    session.refresh(sub_todo)
    
    return sub_todo

@router.delete("/todos/{todo_id}/subtodos/{id}")
def delete_sub_todo(
    session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID , id: uuid.UUID
) -> Message:
    """
    Delete a sub todo.
    """
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and todo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions to access this Todo")
    sub_todo = session.get(SubTodo, id)
    if not sub_todo:
        raise HTTPException(status_code=404, detail="SubTodo not found")
    statement = select(SubTodo).where(SubTodo.todo_id == todo_id, SubTodo.id == id)
    sub_todo = session.exec(statement).first()
    session.delete(sub_todo)
    session.commit()
    return Message(message="SubTodo deleted successfully")
