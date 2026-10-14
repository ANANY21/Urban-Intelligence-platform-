import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from backend.storage import get_db_connection
from .text_extractor import extract_text_from_bytes
from .chunker import split_into_chunks
from .embeddings import get_embedding_provider
from .vector_store import (
    insert_chunks,
    search_similar_chunks,
    delete_chunks_by_document,
    get_vector_store_stats
)

logger = logging.getLogger("RAGService")
KB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge_base")


def ingest_document(
    file_bytes: bytes,
    filename: str,
    title: str,
    category: str,
    source_url: Optional[str] = None,
    publication_date: Optional[str] = None,
    uploaded_by: str = "system"
) -> Dict[str, Any]:
    """
    Complete Ingestion Pipeline:
    1. Text & metadata extraction
    2. Overlapping chunk generation
    3. Vector embedding generation
    4. Document metadata persistence & vector indexing
    """
    logger.info(f"Ingesting document '{filename}' ({title})...")

    # 1. Extract text
    pages_data = extract_text_from_bytes(file_bytes, filename)
    if not pages_data:
        raise ValueError(f"No readable text could be extracted from '{filename}'.")

    # 2. Chunk text
    chunks = split_into_chunks(pages_data, chunk_size=650, chunk_overlap=120)
    if not chunks:
        raise ValueError("Document yielded 0 valid text chunks.")

    # 3. Generate embeddings
    embedder = get_embedding_provider()
    chunk_texts = [c["text"] for c in chunks]
    embeddings = embedder.embed_documents(chunk_texts)

    # 4. Persist document metadata in SQLite
    doc_id = f"doc-{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    file_size = len(file_bytes)
    ext = filename.lower().split(".")[-1]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO documents 
    (id, filename, title, category, source_url, publication_date, retrieval_date, file_type, file_size_bytes, chunk_count, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_id,
        filename,
        title,
        category,
        source_url,
        publication_date,
        now_iso,
        ext,
        file_size,
        len(chunks),
        uploaded_by,
        now_iso
    ))
    conn.commit()
    conn.close()

    # 5. Store chunks & vectors
    insert_chunks(doc_id, chunks, embeddings)
    logger.info(f"Successfully ingested '{title}' ({doc_id}) with {len(chunks)} chunks.")

    return {
        "document_id": doc_id,
        "filename": filename,
        "title": title,
        "category": category,
        "chunk_count": len(chunks),
        "message": f"Successfully ingested {len(chunks)} searchable chunks."
    }


def list_documents() -> List[Dict[str, Any]]:
    """Lists all ingested documents in the knowledge base."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, filename, title, category, source_url, publication_date, retrieval_date, 
           file_type, file_size_bytes, chunk_count, uploaded_by, created_at
    FROM documents ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves document metadata by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_document(doc_id: str) -> bool:
    """
    Deletes document record and all associated vector embeddings and chunks.
    Ensures complete clean-up without orphaned vectors.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected > 0:
        delete_chunks_by_document(doc_id)
        logger.info(f"Purged document {doc_id} and associated vector embeddings.")
        return True
    return False


def search_knowledge_base(
    query: str,
    top_k: int = 4,
    category: Optional[str] = None,
    min_similarity: float = 0.12
) -> List[Dict[str, Any]]:
    """
    RAG Semantic Retrieval:
    1. Embeds search query with embedding provider.
    2. Searches vector store for top K chunks above similarity threshold.
    3. Returns formatted source chunks with document title, URL, page, and score.
    """
    embedder = get_embedding_provider()
    query_vector = embedder.embed_query(query)
    results = search_similar_chunks(
        query_vector=query_vector,
        top_k=top_k,
        min_similarity=min_similarity,
        category=category
    )
    return results


def seed_default_knowledge_base():
    """
    Automatically scans knowledge_base/ directory and ingests all trusted Chennai documents
    if they are not yet in the knowledge base.
    """
    if not os.path.exists(KB_DIR):
        return

    existing_docs = {d["filename"]: d for d in list_documents()}

    seed_files = [
        {
            "filename": "chennai_flood_preparedness_sop.md",
            "title": "Greater Chennai Corporation Flood Preparedness SOP",
            "category": "flood-preparedness",
            "source_url": "https://www.chennaicorporation.gov.in/disaster-management/sop-monsoon.pdf",
            "publication_date": "2024-09-15"
        },
        {
            "filename": "chennai_stormwater_drainage_master_plan.md",
            "title": "Chennai Stormwater Drainage Master Plan & Canal Basins",
            "category": "stormwater-infrastructure",
            "source_url": "https://www.chennaicorporation.gov.in/engineering/stormwater-masterplan.html",
            "publication_date": "2023-11-20"
        },
        {
            "filename": "imd_chennai_rainfall_intensity_standards.md",
            "title": "IMD Regional Meteorological Centre Rainfall Classification",
            "category": "meteorology",
            "source_url": "https://mausam.imd.gov.in/chennai/mcdata/rainfall_criteria.pdf",
            "publication_date": "2024-06-10"
        },
        {
            "filename": "chennai_traffic_flood_diversion_guidelines.md",
            "title": "Greater Chennai Traffic Police Flood Diversions & Subways SOP",
            "category": "traffic-guidelines",
            "source_url": "https://www.chennaitrafficpolice.gov.in/advisories/monsoon-traffic-plan.pdf",
            "publication_date": "2024-08-30"
        },
        {
            "filename": "urban_intelligence_ml_models_architecture.md",
            "title": "Urban Intelligence Platform Machine Learning Specifications",
            "category": "model-documentation",
            "source_url": "https://urban-intelligence.chennai.gov.in/docs/ml-models-architecture.html",
            "publication_date": "2026-03-10"
        }
    ]

    for item in seed_files:
        fn = item["filename"]
        if fn in existing_docs:
            continue

        file_path = os.path.join(KB_DIR, fn)
        if os.path.exists(file_path):
            try:
                with open(file_path, "rb") as f:
                    file_bytes = f.read()
                ingest_document(
                    file_bytes=file_bytes,
                    filename=fn,
                    title=item["title"],
                    category=item["category"],
                    source_url=item["source_url"],
                    publication_date=item["publication_date"],
                    uploaded_by="GCC Disaster Management Authority"
                )
            except Exception as e:
                logger.error(f"Error seeding default document '{fn}': {e}")
