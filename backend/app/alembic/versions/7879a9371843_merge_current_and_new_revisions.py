"""Merge current and new revisions

Revision ID: 7879a9371843
Revises: 9e0bb028bb85, fab65404b721
Create Date: 2024-12-17 23:09:10.194488

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '7879a9371843'
down_revision = ('9e0bb028bb85', 'fab65404b721')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
