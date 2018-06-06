"""empty message

Revision ID: 239ed71a3de6
Revises: 424f18f4c1df
Create Date: 2015-06-23 12:03:17.057462

"""

# revision identifiers, used by Alembic.
revision = '239ed71a3de6'
down_revision = '424f18f4c1df'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute('ALTER TABLE auth_providers ALTER COLUMN provider_id TYPE bigint')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute('ALTER TABLE auth_providers ALTER COLUMN provider_id TYPE int')
    ### end Alembic commands ###
