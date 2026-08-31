from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '18bcf41e6cda'
down_revision: Union[str, Sequence[str], None] = 'a1c7de0a0cf0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('generated_insights',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('insight_text', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('generated_insights')
