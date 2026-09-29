"""Task planning and visibility (HLR-11): milestone, announced/silent, due date/time, days to complete.

Adds columns only. Existing tasks become: not a milestone, announced, no due date, no days to
complete (LLR-11.12). Nothing else changes.

Revision ID: 0004_task_planning
Revises: 0003_reward_scope
Create Date: 2026-09-30 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004_task_planning'
down_revision: Union[str, Sequence[str], None] = '0003_reward_scope'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_milestone', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.add_column(sa.Column('visibility', sa.String(length=10), server_default='announced', nullable=False))
        batch_op.add_column(sa.Column('due_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('target_days', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_column('target_days')
        batch_op.drop_column('due_at')
        batch_op.drop_column('visibility')
        batch_op.drop_column('is_milestone')
