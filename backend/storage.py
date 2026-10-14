import os
import json
import sqlite3
import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "urban_intelligence.db")


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes tables for streaming event persistence, latest entity states, alerts, and dead letter queue."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS streaming_events (
        event_id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        event_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        location_id TEXT,
        payload_json TEXT NOT NULL,
        quality_score REAL DEFAULT 1.0,
        is_replay INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS latest_state (
        state_key TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS urban_alerts (
        alert_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        domain TEXT NOT NULL,
        zone TEXT NOT NULL,
        message TEXT NOT NULL,
        recommended_action TEXT,
        timestamp TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dead_letter_events (
        dead_letter_id TEXT PRIMARY KEY,
        original_topic TEXT NOT NULL,
        rejection_reason TEXT NOT NULL,
        failed_payload_json TEXT NOT NULL,
        failed_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pipeline_metrics (
        metric_key TEXT PRIMARY KEY,
        metric_value TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # --------------------------------------------------------------------------
    # AUTHENTICATION & USERS SCHEMA
    # --------------------------------------------------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Viewer',
        full_name TEXT,
        is_active INTEGER DEFAULT 1,
        reset_token TEXT,
        reset_token_expires TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS login_attempts (
        key TEXT PRIMARY KEY,
        attempts INTEGER DEFAULT 1,
        last_attempt TEXT NOT NULL,
        locked_until TEXT
    );
    """)

    # --------------------------------------------------------------------------
    # RAG KNOWLEDGE BASE & VECTOR STORE SCHEMA
    # --------------------------------------------------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        source_url TEXT,
        publication_date TEXT,
        retrieval_date TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        chunk_count INTEGER DEFAULT 0,
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        embedding_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    """)

    # --------------------------------------------------------------------------
    # AI ASSISTANT CONVERSATIONS & AUDIT LOGS
    # --------------------------------------------------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json TEXT,
        tool_calls_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        details_json TEXT,
        ip_address TEXT,
        timestamp TEXT NOT NULL
    );
    """)

    # Indexes for fast querying
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_topic ON streaming_events(topic);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON streaming_events(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_ts ON urban_alerts(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_docs_cat ON documents(category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_logs(timestamp);")

    conn.commit()
    conn.close()


# ==============================================================================
# EVENT STORAGE OPERATIONS
# ==============================================================================
def save_event(topic: str, event_data: Dict[str, Any]):
    """Stores an event into streaming_events and updates latest_state."""
    conn = get_db_connection()
    cursor = conn.cursor()

    event_id = event_data.get("event_id") or str(datetime.datetime.now().timestamp())
    event_type = event_data.get("event_type", "unknown")
    timestamp = event_data.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat()
    location = event_data.get("location", {})
    location_id = location.get("location_id") or location.get("station_id") or "unknown"
    data_quality = event_data.get("data_quality", {})
    quality_score = float(data_quality.get("quality_score", 1.0))
    is_replay = 1 if data_quality.get("is_replay") else 0
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        cursor.execute("""
        INSERT OR REPLACE INTO streaming_events 
        (event_id, topic, event_type, timestamp, location_id, payload_json, quality_score, is_replay, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            topic,
            event_type,
            timestamp,
            location_id,
            json.dumps(event_data.get("payload", {})),
            quality_score,
            is_replay,
            now_iso
        ))

        # Update latest_state
        domain = "other"
        if "traffic" in topic:
            domain = "traffic"
        elif "rainfall" in topic:
            domain = "rainfall"
        elif "weather" in topic:
            domain = "weather"
        elif "flood" in topic:
            domain = "flood"

        state_key = f"{domain}:{location_id}"
        cursor.execute("""
        INSERT OR REPLACE INTO latest_state (state_key, domain, entity_id, data_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """, (state_key, domain, location_id, json.dumps(event_data), now_iso))

        conn.commit()
    except Exception as e:
        print(f"Error saving event to DB: {e}")
    finally:
        conn.close()


def save_dead_letter(topic: str, raw_payload: Dict[str, Any], reason: str):
    """Persists a rejected/malformed event to dead_letter_events."""
    conn = get_db_connection()
    cursor = conn.cursor()
    dl_id = f"dl-{datetime.datetime.now().timestamp()}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        cursor.execute("""
        INSERT OR REPLACE INTO dead_letter_events 
        (dead_letter_id, original_topic, rejection_reason, failed_payload_json, failed_at)
        VALUES (?, ?, ?, ?, ?)
        """, (dl_id, topic, reason, json.dumps(raw_payload), now_iso))
        conn.commit()
    except Exception as e:
        print(f"Error saving dead letter to DB: {e}")
    finally:
        conn.close()


def save_urban_alert(alert_data: Dict[str, Any]):
    """Persists an urban alert to urban_alerts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    aid = alert_data.get("alert_id") or f"alt-{datetime.datetime.now().timestamp()}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        cursor.execute("""
        INSERT OR REPLACE INTO urban_alerts
        (alert_id, title, severity, domain, zone, message, recommended_action, timestamp, resolved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            aid,
            alert_data.get("title", "Urban Alert"),
            alert_data.get("severity", "warning"),
            alert_data.get("domain", "weather"),
            alert_data.get("zone", "Chennai Metro"),
            alert_data.get("message", ""),
            alert_data.get("recommended_action", ""),
            alert_data.get("broadcast_timestamp", now_iso)
        ))
        conn.commit()
    except Exception as e:
        print(f"Error saving alert to DB: {e}")
    finally:
        conn.close()


# ==============================================================================
# QUERY OPERATIONS FOR REST ENDPOINTS
# ==============================================================================
def get_latest_domain_entities(domain: str) -> List[Dict[str, Any]]:
    """Retrieves all latest states for a specific domain (traffic, rainfall, weather, flood)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM latest_state WHERE domain = ? ORDER BY updated_at DESC", (domain,))
    rows = cursor.fetchall()
    conn.close()
    return [json.loads(r["data_json"]) for r in rows]


def get_recent_events(limit: int = 50, topic: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns the most recent streaming events across all or specific topics."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if topic:
        cursor.execute("SELECT * FROM streaming_events WHERE topic = ? ORDER BY timestamp DESC LIMIT ?", (topic, limit))
    else:
        cursor.execute("SELECT * FROM streaming_events ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "event_id": r["event_id"],
            "topic": r["topic"],
            "event_type": r["event_type"],
            "timestamp": r["timestamp"],
            "location_id": r["location_id"],
            "quality_score": r["quality_score"],
            "is_replay": bool(r["is_replay"]),
            "payload": json.loads(r["payload_json"]),
            "created_at": r["created_at"]
        })
    return results


def get_recent_alerts(limit: int = 20) -> List[Dict[str, Any]]:
    """Returns active urban alerts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM urban_alerts ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_dead_letter_events(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns quarantined dead letter events."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dead_letter_events ORDER BY failed_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "dead_letter_id": r["dead_letter_id"],
            "original_topic": r["original_topic"],
            "rejection_reason": r["rejection_reason"],
            "failed_payload": json.loads(r["failed_payload_json"]),
            "failed_at": r["failed_at"]
        })
    return results


def get_storage_metrics() -> Dict[str, Any]:
    """Returns database record counts and storage footprint."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as c FROM streaming_events")
    total_events = cursor.fetchone()["c"]

    cursor.execute("SELECT COUNT(*) as c FROM dead_letter_events")
    total_dead_letter = cursor.fetchone()["c"]

    cursor.execute("SELECT COUNT(*) as c FROM urban_alerts")
    total_alerts = cursor.fetchone()["c"]

    conn.close()
    return {
        "persisted_events_count": total_events,
        "dead_letter_count": total_dead_letter,
        "urban_alerts_count": total_alerts,
        "database_type": "SQLite3 (Persistent Store)",
        "database_path": DB_PATH
    }


# Initialize DB on load
init_db()
