import uuid
from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app import crud

from app.api.deps import CurrentUser, SessionDep
from app.models import  Message, Category, ListCategories, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])



#  POST[/categories]
@router.post("/", response_model=Category)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, cat_in: CategoryCreate
) -> Any:
   return crud.create_category(session=session,cat_in=cat_in, owner_id=current_user.id )



#  GET[/categories]
@router.get("/", response_model=ListCategories)
def read_items(
    session: SessionDep, current_user: CurrentUser, page: int = 1, limit: int = 10
) -> Any:
    return crud.get_all_categories(session=session, owner_id= current_user.id, page=page, limit=limit)
    

#  GET[/categories/:id]
@router.get("/{id}", response_model=Category)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    return crud.get_category(session=session, cat_id=id ,owner_id=current_user.id)
   

#  PUT[/categories/:id]
@router.put("/{id}", response_model=Category)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    cat_in: CategoryUpdate,
) -> Any:
  
  return crud.update_category(session=session, cat_id=id, owner_id=current_user.id,cat_in=cat_in)


#  DELETE[/categories/:id]
@router.delete("/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
   return crud.delete_category(session=session, cat_id=id, owner_id=current_user.id)

#  GET[/categories]
@router.delete("/")
def delete_all_categories(session: SessionDep, current_user: CurrentUser) -> Message:
    return crud.delete_all_categories(session=session, owner_id=current_user.id)


