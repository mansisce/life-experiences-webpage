"""Reward ideas and wishlist (HLR-12): for whom, visibility, link, where seen, closed outcome, cover photo.

Adds columns only. Existing rewards get for whom = "Me" and visibility = announced; status, rule,
links and progress are unchanged (LLR-12.9).

Revision ID: 0005_reward_ideas
Revises: 0004_task_planning
Create Date: 2026-09-30 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_reward_ideas'
down_revision: Union[str, Sequence[str], None] = '0004_task_planning'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('rewards', schema=None) as batch_op:
        batch_op.add_column(sa.Column('for_whom', sa.String(length=40), server_default='Me', nullable=False))
        batch_op.add_column(sa.Column('visibility', sa.String(length=10), server_default='announced', nullable=False))
        batch_op.add_column(sa.Column('link', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('where_seen', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('closed_outcome', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('closed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('cover_stored_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('cover_content_type', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('rewards', schema=None) as batch_op:
        for column in ('cover_content_type', 'cover_stored_name', 'closed_at', 'closed_outcome', 'where_seen', 'link', 'visibility', 'for_whom'):
            batch_op.drop_column(column)
