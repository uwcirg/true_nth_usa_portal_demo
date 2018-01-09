from alembic import op
import sqlalchemy as sa


"""User Identifiers made unique

Revision ID: 081e325cca54
Revises: f47410f58746
Create Date: 2018-01-09 10:48:56.808498

"""

# revision identifiers, used by Alembic.
revision = '081e325cca54'
down_revision = 'f47410f58746'


def upgrade():
    # First have to eliminate duplcates, or the addition of the constraint will fail
    # simply hold on to the lowest id from each duplicate (or non-duplicate)
    query = ("DELETE FROM user_identifiers WHERE id NOT IN ("
        "SELECT MIN(id) from user_identifiers GROUP BY user_id, identifier_id)")
    op.execute(query)

    # add missing constraint
    op.create_unique_constraint('_user_identifier', 'user_identifiers', ['user_id', 'identifier_id'])


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('_user_identifier', 'user_identifiers', type_='unique')
    # ### end Alembic commands ###
