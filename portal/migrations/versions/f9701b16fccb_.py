"""Correct identifiers tagged deleted on live patients

Revision ID: f9701b16fccb
Revises: 49d13048e7a7
Create Date: 2021-08-02 14:00:43.963679

"""
from alembic import op
from datetime import datetime
from flask import current_app
import logging
import sqlalchemy as sa
from sqlalchemy.sql import text

from portal.system_uri import TRUENTH_EXTERNAL_STUDY_SYSTEM

# revision identifiers, used by Alembic.
revision = 'f9701b16fccb'
down_revision = '49d13048e7a7'

logger = logging.getLogger("alembic")
logger.setLevel(logging.INFO)


def upgrade():
    conn = op.get_bind()
    query = (
        "SELECT users.id, identifier_id, value FROM users "
        "JOIN user_identifiers ON users.id = user_id "
        "JOIN identifiers ON identifiers.id = identifier_id "
        "WHERE deleted_id IS NULL AND "
        "system=:system "
        "AND VALUE LIKE '%-deleted'"
    )
    result = conn.execute(text(query), system=TRUENTH_EXTERNAL_STUDY_SYSTEM)

    corrected = {}
    now = datetime.utcnow()
    version = current_app.config.metadata['version']
    new_audit = (
        "INSERT INTO audit ("
        " user_id, subject_id, timestamp , version, context, comment) "
        "VALUES ("
        " :user_id, :user_id, :now, :version, :context, :comment)")

    for user_id, identifier_id, value in result.fetchall():
        corrected[identifier_id] = value[:-(len('-deleted'))]

        conn.execute(
            text(new_audit),
            user_id=user_id, now=now, version=version, context="user",
            comment="removed misplaced `-deleted' suffix from study identifier"
                    " '%s'" % corrected[identifier_id])

        # Remove links from legit deleted accounts
        query = (
            "DELETE FROM user_identifiers "
            "WHERE identifier_id=:identifier_id AND "
            "user_id!=:user_id")
        conn.execute(text(query), identifier_id=identifier_id, user_id=user_id)

    # update without suffix
    update = "UPDATE identifiers SET value=:value WHERE id=:id"
    for identifier_id, corrected_text in corrected.items():
        conn.execute(text(update), value=corrected_text, id=identifier_id)


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###