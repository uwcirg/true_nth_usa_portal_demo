"""empty message

Revision ID: 45282885249b
Revises: fb87044ded54
Create Date: 2016-10-26 00:02:34.689913

"""

# revision identifiers, used by Alembic.
revision = '45282885249b'
down_revision = 'fb87044ded54'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user_consents', sa.Column(
        'deleted_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'user_consents', 'audit',
                          ['deleted_id'], ['id'])
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'user_consents', type_='foreignkey')
    op.drop_column('user_consents', 'deleted_id')
    ### end Alembic commands ###
