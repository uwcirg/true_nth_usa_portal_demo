"""promote __system__ user to admin

Revision ID: 9c6788e6db2f
Revises: c242e22f5a47
Create Date: 2019-08-01 17:28:56.859235

"""
import random
from werkzeug.security import generate_password_hash

from portal.database import db
from portal.models.user import User
from portal.models.role import Role, ROLE

# revision identifiers, used by Alembic.
revision = '9c6788e6db2f'
down_revision = 'c242e22f5a47'


def upgrade():
    sys_user = User.query.filter_by(email='__system__').one()
    if not(len(sys_user.roles) == 1 and
           sys_user.has_role(ROLE.ADMIN.value)):
        admin_only = Role.query.filter(Role.name == ROLE.ADMIN.value).all()
        sys_user.update_roles(role_list=admin_only, acting_user=sys_user)

    # CYA - give the system account a decent, random password
    password = (''.join([random.choice(list(
        '123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'))
        for x in range(32)]))
    pw_hash = generate_password_hash(password)
    # pluck the hash algorithm from the hash, like all others in the db
    i = pw_hash.find('$')
    sys_user.password = pw_hash[i:]

    db.session.commit()


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
