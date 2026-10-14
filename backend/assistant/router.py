from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from .models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationSummary
)
from .service import (
    execute_assistant_pipeline,
    list_conversations,
    get_full_conversation,
    delete_conversation_session
)
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["AI Urban Intelligence Assistant"])


@router.post("/chat", response_model=ChatMessageResponse)
def chat_with_assistant(req: ChatMessageRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Executes conversational turn with AI Urban Intelligence Assistant:
    - Grounded RAG knowledge retrieval from official Chennai documents.
    - Automated tool execution (Rainfall, Traffic, Flood Risk ML models).
    - Source citations with document titles and page references.
    """
    try:
        response = execute_assistant_pipeline(
            user_message=req.message,
            user_id=current_user["id"],
            conversation_id=req.conversation_id
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Assistant execution error: {str(e)}"
        )


@router.get("/history", response_model=List[ConversationSummary])
def get_user_chat_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Lists conversation history threads for the authenticated user."""
    return list_conversations(current_user["id"])


@router.get("/conversations/{conversation_id}")
def get_conversation_thread(conversation_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves full conversation transcript with citations and tool outputs."""
    thread = get_full_conversation(conversation_id, current_user["id"])
    if not thread:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return thread


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Deletes conversation thread."""
    success = delete_conversation_session(conversation_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"status": "success", "message": "Conversation session deleted."}
