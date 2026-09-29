"""Reward scope and match mode (HLR-9). Adds columns and infers each existing reward's scope from its tags.

No reward, tag, completion or status is deleted (LLR-4.18):
- all tagged tasks in one area  -> scope = that area (and its tile)
- all tagged tasks in one tile  -> scope = that tile
- no tags, or tags across tiles -> category_id stays NULL ("Needs a tile"); tags are kept

Revision ID: 0003_reward_scope
Revises: 0002_details
Create Date: 2026-09-29 18:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003_reward_scope'
down_revision: Union[str, Sequence[str], None] = '0002_details'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def infer_scope(tag_areas: list[tuple[int, str]]) -> tuple[str | None, int | None]:
    """(area_id, category_id) of each tagged task -> the reward's (category_id, area_id)."""
    area_ids = {area_id for area_id, _ in tag_areas}
    category_ids = {category_id for _, category_id in tag_areas}
    if len(category_ids) != 1:
        return None, None
    return category_ids.pop(), (area_ids.pop() if len(area_ids) == 1 else None)


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('rewards', schema=None) as batch_op:
        batch_op.add_column(sa.Column('category_id', sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column('area_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('match_mode', sa.String(length=10), server_default='selected', nullable=False))
        batch_op.create_index(batch_op.f('ix_rewards_category_id'), ['category_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_rewards_area_id'), ['area_id'], unique=False)
        batch_op.create_foreign_key('fk_rewards_category_id', 'categories', ['category_id'], ['id'], ondelete='CASCADE')
        batch_op.create_foreign_key('fk_rewards_area_id', 'areas', ['area_id'], ['id'], ondelete='SET NULL')

    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT rt.reward_id, a.id, a.category_id FROM reward_tasks rt "
            "JOIN tasks t ON t.id = rt.task_id JOIN areas a ON a.id = t.area_id"
        )
    ).all()
    tags: dict[int, list[tuple[int, str]]] = {}
    for reward_id, area_id, category_id in rows:
        tags.setdefault(reward_id, []).append((area_id, category_id))
    for reward_id, tag_areas in tags.items():
        category_id, area_id = infer_scope(tag_areas)
        if category_id is not None:
            conn.execute(
                sa.text("UPDATE rewards SET category_id = :c, area_id = :a WHERE id = :id"),
                {"c": category_id, "a": area_id, "id": reward_id},
            )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('rewards', schema=None) as batch_op:
        batch_op.drop_constraint('fk_rewards_area_id', type_='foreignkey')
        batch_op.drop_constraint('fk_rewards_category_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_rewards_area_id'))
        batch_op.drop_index(batch_op.f('ix_rewards_category_id'))
        batch_op.drop_column('match_mode')
        batch_op.drop_column('area_id')
        batch_op.drop_column('category_id')
