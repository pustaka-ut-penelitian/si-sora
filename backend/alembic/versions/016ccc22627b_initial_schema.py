from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '016ccc22627b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('raw_comments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('platform', sa.String(length=50), nullable=False),
    sa.Column('source_url', sa.Text(), nullable=False),
    sa.Column('author_name', sa.String(length=100), nullable=True),
    sa.Column('text_content', sa.Text(), nullable=False),
    sa.Column('posted_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('system_settings',
    sa.Column('setting_key', sa.String(length=100), nullable=False),
    sa.Column('setting_value', sa.Text(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('setting_key')
    )
    op.create_table('ai_analysis',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('comment_id', sa.UUID(), nullable=False),
    sa.Column('sentiment', sa.String(length=20), nullable=False),
    sa.Column('emotion', sa.String(length=50), nullable=True),
    sa.Column('topic_tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('ai_reasoning', sa.Text(), nullable=True),
    sa.Column('analyzed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['comment_id'], ['raw_comments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('ai_analysis')
    op.drop_table('system_settings')
    op.drop_table('raw_comments')
