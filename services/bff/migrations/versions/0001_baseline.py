"""Baseline schema: every table as it existed before migrations were introduced.

Databases created earlier by create_all() are *stamped* at this revision on startup (see
app/migrate.py), so this file only ever runs against a brand-new, empty database.

Revision ID: 0001_baseline
Revises: 
Create Date: 2026-09-28 19:15:45.557672

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_baseline'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('categories',
    sa.Column('id', sa.String(length=32), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('icon', sa.String(length=16), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('rewards',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('rule_type', sa.String(length=15), nullable=False),
    sa.Column('threshold', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=10), nullable=False),
    sa.Column('unlocked_at', sa.DateTime(), nullable=True),
    sa.Column('claimed_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('areas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('category_id', sa.String(length=32), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('areas', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_areas_category_id'), ['category_id'], unique=False)

    op.create_table('photos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('area_id', sa.Integer(), nullable=False),
    sa.Column('stored_name', sa.String(length=100), nullable=False),
    sa.Column('original_name', sa.String(length=255), nullable=False),
    sa.Column('content_type', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('photos', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_photos_area_id'), ['area_id'], unique=False)

    op.create_table('tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('area_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('notes', sa.Text(), nullable=False),
    sa.Column('source', sa.String(length=10), nullable=False),
    sa.Column('priority', sa.String(length=10), nullable=False),
    sa.Column('frequency', sa.String(length=10), nullable=False),
    sa.Column('status', sa.String(length=10), nullable=False),
    sa.Column('relevance', sa.String(length=15), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_tasks_area_id'), ['area_id'], unique=False)

    op.create_table('activities',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('completed_at', sa.DateTime(), nullable=False),
    sa.Column('note', sa.Text(), nullable=False),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('activities', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_activities_completed_at'), ['completed_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_activities_task_id'), ['task_id'], unique=False)

    op.create_table('reward_tasks',
    sa.Column('reward_id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['reward_id'], ['rewards.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('reward_id', 'task_id')
    )
    op.create_table('suggestions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('area_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('why', sa.Text(), nullable=False),
    sa.Column('priority', sa.String(length=10), nullable=False),
    sa.Column('frequency', sa.String(length=10), nullable=False),
    sa.Column('decision', sa.String(length=15), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('suggestions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_suggestions_area_id'), ['area_id'], unique=False)



def downgrade() -> None:
    """Refuse: downgrading the baseline would drop every table and all data."""
    raise NotImplementedError("The baseline can't be downgraded; restore from data/backups instead.")
