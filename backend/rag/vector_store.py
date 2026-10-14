import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import numpy as np

from backend.storage import get_db_connection


def insert_chunks(document_id: str, chunks_data: List[Dict[str, Any]], embeddings: List[List[float]]):
    """Persists document chunks and their embedding vectors into SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    for idx, (chunk, emb) in enumerate(zip(chunks_data, embeddings)):
        chunk_id = f"chk-{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO document_chunks (id, document_id, chunk_index, chunk_text, metadata_json, embedding_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            chunk_id,
            document_id,
            chunk.get("chunk_index", idx),
            chunk["text"],
            json.dumps(chunk.get("metadata", {})),
            json.dumps(emb),
            now_iso
        ))

    conn.commit()
    conn.close()


def search_similar_chunks(
    query_vector: List[float],
    top_k: int = 4,
    min_similarity: float = 0.12,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Executes cosine similarity search over stored chunk embeddings with optional category filtering.
    Returns: [{"chunk_id", "document_id", "document_title", "document_category", "text", "similarity_score", "metadata"}]
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    if category:
        cursor.execute("""
        SELECT c.id as chunk_id, c.document_id, c.chunk_index, c.chunk_text, c.metadata_json, c.embedding_json,
               d.title as doc_title, d.category as doc_category, d.source_url
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.category = ?
        """, (category,))
    else:
        cursor.execute("""
        SELECT c.id as chunk_id, c.document_id, c.chunk_index, c.chunk_text, c.metadata_json, c.embedding_json,
               d.title as doc_title, d.category as doc_category, d.source_url
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        """)

    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return []

    q_vec = np.array(query_vector, dtype=np.float32)
    q_norm = np.linalg.norm(q_vec)
    if q_norm == 0:
        return []

    results = []
    for r in rows:
        try:
            c_vec = np.array(json.loads(r["embedding_json"]), dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            if c_norm == 0:
                continue

            # Cosine similarity = dot product / (norm1 * norm2)
            similarity = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))

            if similarity >= min_similarity:
                results.append({
                    "chunk_id": r["chunk_id"],
                    "document_id": r["document_id"],
                    "document_title": r["doc_title"],
                    "document_category": r["doc_category"],
                    "source_url": r["source_url"],
                    "chunk_index": r["chunk_index"],
                    "text": r["chunk_text"],
                    "metadata": json.loads(r["metadata_json"]),
                    "similarity_score": round(similarity, 4)
                })
        except Exception:
            continue

    # Sort descending by similarity score
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:top_k]


def delete_chunks_by_document(document_id: str):
    """Deletes all chunks and vector embeddings associated with a document."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (document_id,))
    conn.commit()
    conn.close()


def get_vector_store_stats() -> Dict[str, Any]:
    """Returns vector store totals and category breakdown."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as c FROM documents")
    total_docs = cursor.fetchone()["c"]

    cursor.execute("SELECT COUNT(*) as c FROM document_chunks")
    total_chunks = cursor.fetchone()["c"]

    cursor.execute("SELECT category, COUNT(*) as c FROM documents GROUP BY category")
    cat_rows = cursor.fetchall()
    categories = {r["category"]: r["c"] for r in cat_rows}

    conn.close()
    return {
        "total_documents": total_docs,
        "total_chunks": total_chunks,
        "categories": categories,
        "vector_store": "SQLite Cosine Similarity Index",
        "status": "ready"
    }
