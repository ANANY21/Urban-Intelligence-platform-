from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User prompt or query")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID to continue thread")
    stream: bool = Field(False, description="Stream response tokens if supported")


class ToolCallRecord(BaseModel):
    tool_name: str
    description: str
    inputs: Dict[str, Any]
    result: Dict[str, Any]
    executed_at: str


class SourceCitation(BaseModel):
    document_id: str
    title: str
    category: str
    source_url: Optional[str] = None
    page: Optional[int] = None
    similarity_score: float
    snippet: str


class ChatMessageResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    sources: List[SourceCitation] = []
    tool_calls: List[ToolCallRecord] = []
    intent_classified: str = "general"
    created_at: str


class ConversationSummary(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0
