"""Task order (D16): tasks are dragged into order instead of High/Med/Low.

Adds tasks.sort_order and fills it per area from today's order: priority high -> low, then
creation time (LLR-2.14). The old priority value is kept, just no longer used for ordering.

Revision ID: 0007_task_order
Revises: 0006_tile_without_areas
Create Date: 2026-10-03 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007_task_order'
down_revision: Union[str, Sequence[str], None] = '0006_tile_without_areas'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PRIORITY_RANK = {"high": 0, "medium": 1, "low": 2}


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False))

    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, area_id, priority, created_at FROM tasks")).all()
    position: dict[int, int] = {}
    for task_id, area_id, _, _ in sorted(rows, key=lambda r: (r[1], PRIORITY_RANK.get(r[2], 3), r[3], r[0])):
        bind.execute(
            sa.text("UPDATE tasks SET sort_order = :n WHERE id = :id"), {"n": position.get(area_id, 0), "id": task_id}
        )
        position[area_id] = position.get(area_id, 0) + 1


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_column('sort_order')
