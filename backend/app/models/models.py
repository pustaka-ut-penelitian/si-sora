import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base

class RawComment(Base):
    __tablename__ = "raw_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String(50), nullable=False)
    source_url = Column(Text, nullable=False)
    author_name = Column(String(100), default="anon")
    text_content = Column(Text, nullable=False)
    posted_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="UNPROCESSED", nullable=False)

    ai_analysis = relationship("AIAnalysis", back_populates="raw_comment", uselist=False, cascade="all, delete-orphan")

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comment_id = Column(UUID(as_uuid=True), ForeignKey("raw_comments.id", ondelete="CASCADE"), nullable=False)
    sentiment = Column(String(20), nullable=False)
    emotion = Column(String(50), nullable=True)
    topic_tags = Column(JSONB, default=list)
    ai_reasoning = Column(Text, nullable=True)
    analyzed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    raw_comment = relationship("RawComment", back_populates="ai_analysis")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_key = Column(String(100), primary_key=True)
    setting_value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="VIEWER", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ScraperTarget(Base):
    __tablename__ = "scraper_targets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String(20), nullable=False)
    target_id = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    cron_time = Column(String(20), default="02:00")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class GeneratedInsight(Base):
    __tablename__ = "generated_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    insight_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

