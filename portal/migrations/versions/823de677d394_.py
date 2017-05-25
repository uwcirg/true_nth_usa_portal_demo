"""empty message

Revision ID: 823de677d394
Revises: 320726253d2d
Create Date: 2017-05-24 12:27:57.861464

"""

# revision identifiers, used by Alembic.
revision = '823de677d394'
down_revision = '320726253d2d'

from alembic import op
from datetime import datetime
import sqlalchemy as sa

from portal.models.encounter import Encounter

Session = sa.orm.sessionmaker()


def create_missing_encounters(table_name):
    bind = op.get_bind()
    session = Session(bind=bind)

    if table_name == 'questionnaire_responses':
        user_col = 'subject_id'
    else:
        user_col = 'user_id'

    for obj_id, user_id in session.execute("SELECT id, {} FROM {} where " \
                        "encounter_id IS NULL".format(user_col, table_name)):
        enc = Encounter(
            status='finished', auth_method='staff_authenticated',
            start_time=datetime(2000, 01, 01, 01, 01, 01), user_id=user_id)
        session.add(enc)
        session.commit()
        enc = session.merge(enc)
        session.execute('UPDATE {} SET encounter_id = {} where id = {}'.format(
                        table_name, enc.id, obj_id))


def remove_generated_encounters(table_name):
    bind = op.get_bind()
    session = Session(bind=bind)

    for obj_id, enc_id in session.execute("SELECT {table_name}.id, " \
                        "encounters.id FROM {table_name} JOIN encounters ON " \
                        "{table_name}.encounter_id = encounters.id WHERE " \
                        "encounters.status = 'finished' AND "\
                        "encounters.auth_method = 'staff_authenticated' AND " \
                        "encounters.start_time = '2000-01-01 01:01:01'".format(
                              table_name=table_name)):
        session.execute('UPDATE {} SET encounter_id = NULL WHERE id = {}' \
                        ''.format(table_name, obj_id))
        session.execute('DELETE FROM encounters WHERE id = {}'.format(enc_id))


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('clients', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    op.alter_column('grants', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

    create_missing_encounters('procedures')
    op.alter_column('procedures', 'encounter_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

    create_missing_encounters('questionnaire_responses')
    op.alter_column('questionnaire_responses', 'encounter_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

    op.alter_column('questionnaire_responses', 'subject_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    op.alter_column('tokens', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    op.alter_column('user_interventions', 'intervention_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    op.alter_column('user_interventions', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

    create_missing_encounters('user_observations')
    op.alter_column('user_observations', 'encounter_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('user_observations', 'encounter_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    remove_generated_encounters('user_observations')

    op.alter_column('user_interventions', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    op.alter_column('user_interventions', 'intervention_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    op.alter_column('tokens', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    op.alter_column('questionnaire_responses', 'subject_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)

    op.alter_column('questionnaire_responses', 'encounter_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    remove_generated_encounters('questionnaire_responses')

    op.alter_column('procedures', 'encounter_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    remove_generated_encounters('procedures')

    op.alter_column('grants', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    op.alter_column('clients', 'user_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    # ### end Alembic commands ###
