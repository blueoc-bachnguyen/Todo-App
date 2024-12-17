"""add colaborator table

Revision ID: 9e0bb028bb85
Revises: cf8b2a32522c
Create Date: 2024-12-12 14:32:54.334512

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '9e0bb028bb85'
down_revision = 'cf8b2a32522c'
branch_labels = None
depends_on = None


def upgrade():
    # Giữ nguyên kiểu cột 'status' là VARCHAR (str)
    op.alter_column(
        'collaborator',
        'status',
        type_=sa.String(),  # Đảm bảo kiểu là VARCHAR (str)
        existing_type=sa.String(),
        existing_nullable=False
    )

def downgrade():
    # Khôi phục kiểu cột 'status' nếu cần
    op.alter_column(
        'collaborator',
        'status',
        type_=sa.String(),  # Giữ kiểu là VARCHAR (str)
        existing_type=sa.String(),
        existing_nullable=False
    )

