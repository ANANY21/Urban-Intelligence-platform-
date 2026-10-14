import re
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from backend.storage import get_db_connection
from backend.rag.service import search_knowledge_base
from .models import ChatMessageResponse, SourceCitation, ToolCallRecord, ConversationSummary
from .tools import (
    tool_predict_traffic,
    tool_predict_rainfall,
    tool_predict_flood_risk,
    tool_get_live_telemetry,
    tool_get_model_performance
)
from .llm_provider import get_llm_provider

logger = logging.getLogger("AssistantService")


# ==============================================================================
# CONVERSATION STORAGE
# ==============================================================================
def get_or_create_conversation(user_id: str, conversation_id: Optional[str] = None, title_hint: str = "New Inquiry") -> str:
    """Retrieves existing conversation or initializes a new conversation record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    if conversation_id:
        cursor.execute("SELECT id FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id))
        row = cursor.fetchone()
        if row:
            conn.close()
            return conversation_id

    # Create new conversation
    conv_id = f"cnv-{uuid.uuid4().hex[:10]}"
    title = title_hint[:50] if title_hint else "Urban Intelligence Session"
    cursor.execute("""
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    """, (conv_id, user_id, title, now_iso, now_iso))
    conn.commit()
    conn.close()
    return conv_id


def save_message(
    conversation_id: str,
    role: str,
    content: str,
    sources: Optional[List[Dict[str, Any]]] = None,
    tool_calls: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Stores a message record into the messages table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    msg_id = f"msg-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO messages (id, conversation_id, role, content, sources_json, tool_calls_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        msg_id,
        conversation_id,
        role,
        content,
        json.dumps(sources or []),
        json.dumps(tool_calls or []),
        now_iso
    ))

    # Update conversation updated_at timestamp
    cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now_iso, conversation_id))
    conn.commit()
    conn.close()
    return msg_id


def get_conversation_history(conversation_id: str, limit: int = 10) -> List[Dict[str, str]]:
    """Retrieves chronological messages for LLM context."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?
    """, (conversation_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [{"role": r["role"], "content": r["content"]} for r in rows]


def list_conversations(user_id: str) -> List[ConversationSummary]:
    """Lists all conversation sessions for the current user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.id, c.title, c.created_at, c.updated_at, COUNT(m.id) as msg_count
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [
        ConversationSummary(
            conversation_id=r["id"],
            title=r["title"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            message_count=r["msg_count"]
        )
        for r in rows
    ]


def get_full_conversation(conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Returns conversation thread with citations and tool call history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        return None

    cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conversation_id,))
    msgs = cursor.fetchall()
    conn.close()

    formatted_msgs = []
    for m in msgs:
        formatted_msgs.append({
            "message_id": m["id"],
            "role": m["role"],
            "content": m["content"],
            "sources": json.loads(m["sources_json"] or "[]"),
            "tool_calls": json.loads(m["tool_calls_json"] or "[]"),
            "created_at": m["created_at"]
        })

    return {
        "conversation_id": conv["id"],
        "title": conv["title"],
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
        "messages": formatted_msgs
    }


def delete_conversation_session(conversation_id: str, user_id: str) -> bool:
    """Deletes conversation and associated messages."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# ==============================================================================
# INTENT CLASSIFICATION & TOOL DISPATCH
# ==============================================================================
def execute_assistant_pipeline(user_message: str, user_id: str, conversation_id: Optional[str] = None) -> ChatMessageResponse:
    """
    Main Assistant Orchestrator:
    1. Manages conversation thread.
    2. Classifies intent (Rainfall, Traffic, Flood, Model Specs, General RAG).
    3. Executes relevant ML models/tools if applicable.
    4. Performs semantic RAG knowledge retrieval for grounded facts.
    5. Dispatches to LLM provider for synthesis with citations.
    6. Stores messages and returns structured response.
    """
    msg_lower = user_message.lower()
    conv_id = get_or_create_conversation(user_id, conversation_id, title_hint=user_message)

    # Save User message
    save_message(conv_id, role="user", content=user_message)

    executed_tools: List[Dict[str, Any]] = []
    intent = "general_rag"
    target_category = None

    # 1. Check for Traffic Intent
    if any(k in msg_lower for k in ["traffic", "congestion", "omr", "kathipara", "anna salai", "speed", "vehicle", "car count"]):
        intent = "traffic_intelligence"
        target_category = "traffic-guidelines"
        # Parse or default counts for prediction
        car_match = re.search(r"(\d+)\s*(car|cars)", msg_lower)
        bike_match = re.search(r"(\d+)\s*(bike|bikes|two wheeler)", msg_lower)
        car_val = int(car_match.group(1)) if car_match else 55
        bike_val = int(bike_match.group(1)) if bike_match else 70

        res = tool_predict_traffic(car_count=car_val, bike_count=bike_val, bus_count=8, truck_count=4)
        executed_tools.append({
            "tool_name": "predict_traffic",
            "description": "Executed RandomForestClassifier for traffic congestion prediction",
            "inputs": {"cars": car_val, "bikes": bike_val, "buses": 8, "trucks": 4},
            "result": res,
            "executed_at": datetime.now(timezone.utc).isoformat()
        })

    # 2. Check for Rainfall Intent
    elif any(k in msg_lower for k in ["rain", "rainfall", "precipitation", "forecast", "cloudburst", "monsoon", "imd", "nungambakkam", "meenambakkam"]):
        intent = "rainfall_prediction"
        target_category = "meteorology"
        station = "Chennai Meenambakkam" if "meenambakkam" in msg_lower else "Chennai nungambakkam"
        res = tool_predict_rainfall(station=station)
        executed_tools.append({
            "tool_name": "predict_rainfall",
            "description": "Executed RandomForestRegressor for quantitative precipitation forecasting",
            "inputs": {"station": station},
            "result": res,
            "executed_at": datetime.now(timezone.utc).isoformat()
        })

    # 3. Check for Flood Risk Intent
    elif any(k in msg_lower for k in ["flood", "discharge", "chembarambakkam", "adyar", "cooum", "reservoir", "inundation", "water level"]):
        intent = "flood_risk_analysis"
        target_category = "flood-preparedness"
        res = tool_predict_flood_risk(
            river_discharge_m3s=3800.0,
            rainfall_mm=140.0,
            water_level_m=6.8,
            elevation_m=4.5,
            location_name="Adyar River Basin (Kathipara - Jafferkhanpet corridor)"
        )
        executed_tools.append({
            "tool_name": "predict_flood_risk",
            "description": "Executed Hydrological Inundation Risk Classifier",
            "inputs": {"discharge_m3s": 3800.0, "rainfall_mm": 140.0, "water_level_m": 6.8},
            "result": res,
            "executed_at": datetime.now(timezone.utc).isoformat()
        })

    # 4. Check for Model Performance Intent
    elif any(k in msg_lower for k in ["model", "accuracy", "random forest", "rmse", "baseline", "kmeans", "cluster"]):
        intent = "model_architecture"
        target_category = "model-documentation"
        res = tool_get_model_performance(user_message)
        executed_tools.append({
            "tool_name": "get_model_performance",
            "description": "Retrieved verified machine learning performance benchmarks",
            "inputs": {"query": user_message},
            "result": res,
            "executed_at": datetime.now(timezone.utc).isoformat()
        })

    # 5. Semantic RAG Search across Knowledge Base
    retrieved_chunks = search_knowledge_base(
        query=user_message,
        top_k=4,
        category=target_category,
        min_similarity=0.03
    )

    # Fallback to unrestricted search across all documents if category returned no chunks
    if not retrieved_chunks and target_category is not None:
        retrieved_chunks = search_knowledge_base(
            query=user_message,
            top_k=4,
            category=None,
            min_similarity=0.03
        )

    # 6. Format Citations
    citations: List[SourceCitation] = []
    for c in retrieved_chunks:
        citations.append(SourceCitation(
            document_id=c["document_id"],
            title=c["document_title"],
            category=c["document_category"],
            source_url=c.get("source_url"),
            page=c.get("metadata", {}).get("page", 1),
            similarity_score=c["similarity_score"],
            snippet=c["text"][:180] + "..."
        ))

    # 7. Generate Grounded Synthesis via LLM Provider
    history = get_conversation_history(conv_id, limit=6)
    provider = get_llm_provider()
    synthesized_answer = provider.generate_response(
        user_message=user_message,
        context_chunks=retrieved_chunks,
        tool_results=executed_tools,
        conversation_history=history
    )

    # 8. Save Assistant Response
    now_iso = datetime.now(timezone.utc).isoformat()
    msg_id = save_message(
        conversation_id=conv_id,
        role="assistant",
        content=synthesized_answer,
        sources=[c.dict() for c in citations],
        tool_calls=executed_tools
    )

    tool_call_records = [
        ToolCallRecord(
            tool_name=t["tool_name"],
            description=t["description"],
            inputs=t["inputs"],
            result=t["result"],
            executed_at=t["executed_at"]
        )
        for t in executed_tools
    ]

    return ChatMessageResponse(
        conversation_id=conv_id,
        message_id=msg_id,
        role="assistant",
        content=synthesized_answer,
        sources=citations,
        tool_calls=tool_call_records,
        intent_classified=intent,
        created_at=now_iso
    )
