"""Tiles without areas (HLR-13): an area can be the hidden holder of a tile's own tasks.

Adds one column. Existing areas stay visible (hidden = false), so nothing changes until a tile's
"Use areas" switch is turned off.

Revision ID: 0006_tile_without_areas
Revises: 0005_reward_ideas
Create Date: 2026-10-02 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_tile_without_areas'
down_revision: Union[str, Sequence[str], None] = '0005_reward_ideas'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('areas', schema=None) as batch_op:
        batch_op.add_column(sa.Column('hidden', sa.Boolean(), server_default=sa.false(), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('areas', schema=None) as batch_op:
        batch_op.drop_column('hidden')
