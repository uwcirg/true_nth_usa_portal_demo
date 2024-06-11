"""Add research_data table, to hold questionnaire response research data in a cache

Revision ID: daee63f50d35
Revises: cf586ed4f043
Create Date: 2024-05-21 17:00:58.204998

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'daee63f50d35'
down_revision = 'cf586ed4f043'


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('research_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('questionnaire_response_id', sa.Integer(), nullable=False),
        sa.Column('instrument', sa.Text(), nullable=False),
        sa.Column('research_study_id', sa.Integer(), nullable=False),
        sa.Column('authored', sa.DateTime(), nullable=False),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(
            ['questionnaire_response_id'], ['questionnaire_responses.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'patient_id', 'questionnaire_response_id', name='_research data_unique_patient_qnr')
        )

    op.create_index(
        op.f('ix_research_data_authored'), 'research_data', ['authored'], unique=False)
    op.create_index(
        op.f('ix_research_data_instrument'), 'research_data', ['instrument'], unique=False)
    op.create_index(
        op.f('ix_research_data_patient_id'), 'research_data', ['patient_id'], unique=False)
    op.create_index(
        op.f('ix_research_data_questionnaire_response_id'),
        'research_data', ['questionnaire_response_id'], unique=False)
    op.create_index(
        op.f('ix_research_data_research_study_id'),
        'research_data', ['research_study_id'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_research_data_research_study_id'), table_name='research_data')
    op.drop_index(op.f('ix_research_data_questionnaire_response_id'), table_name='research_data')
    op.drop_index(op.f('ix_research_data_patient_id'), table_name='research_data')
    op.drop_index(op.f('ix_research_data_instrument'), table_name='research_data')
    op.drop_index(op.f('ix_research_data_authored'), table_name='research_data')
    op.drop_table('research_data')
    # ### end Alembic commands ###
