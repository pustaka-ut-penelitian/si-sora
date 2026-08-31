from pydantic import BaseModel, Field
from typing import List, Optional

class AIAnalysisResult(BaseModel):
    sentiment: str = Field(pattern="^(POSITIF|NEGATIF|NETRAL)$")
    emotion: str = Field(...)
    topic_tags: List[str] = Field(default_factory=list)
    ai_reasoning: str = Field(...)
