from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1c7de0a0cf0'
down_revision: Union[str, Sequence[str], None] = '8306d202b512'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('scraper_targets',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('platform', sa.String(length=20), nullable=False),
    sa.Column('target_id', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('cron_time', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('scraper_targets')
