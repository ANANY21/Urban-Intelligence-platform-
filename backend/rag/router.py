from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status

from .models import (
    DocumentMetadata,
    DocumentUploadResponse,
    KnowledgeStatusResponse,
    RAGSearchRequest,
    RAGSearchResponse
)
from .service import (
    ingest_document,
    list_documents,
    get_document_by_id,
    delete_document,
    search_knowledge_base,
    seed_default_knowledge_base
)
from .vector_store import get_vector_store_stats
from backend.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/knowledge", tags=["RAG Knowledge Base"])


@router.get("/status", response_model=KnowledgeStatusResponse)
def get_knowledge_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns knowledge base inventory, document counts, and vector store stats."""
    stats = get_vector_store_stats()
    return {
        "total_documents": stats["total_documents"],
        "total_chunks": stats["total_chunks"],
        "categories": stats["categories"],
        "vector_store": stats["vector_store"],
        "embedding_provider": "Local Dense Vector (128-dim Cosine)",
        "status": "ready"
    }


@router.get("/documents", response_model=List[DocumentMetadata])
def get_all_documents(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Lists all ingested knowledge base documents."""
    return list_documents()


@router.get("/documents/{document_id}", response_model=DocumentMetadata)
def get_document(document_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves metadata for a specific document."""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("general"),
    source_url: Optional[str] = Form(None),
    publication_date: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(require_role(["Admin", "Analyst"]))
):
    """
    Uploads and indexes a document (.pdf, .txt, .md) into the RAG vector store.
    Requires Analyst or Admin role. Maximum file size: 15MB.
    """
    ext = file.filename.lower().split(".")[-1]
    if ext not in ["pdf", "txt", "md", "markdown"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats: .pdf, .txt, .md"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (15MB).")

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = ingest_document(
            file_bytes=file_bytes,
            filename=file.filename,
            title=title.strip(),
            category=category.strip(),
            source_url=source_url.strip() if source_url else None,
            publication_date=publication_date.strip() if publication_date else None,
            uploaded_by=current_user["username"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline failure: {str(e)}")


@router.delete("/documents/{document_id}")
def remove_document(document_id: str, current_user: Dict[str, Any] = Depends(require_role(["Admin"]))):
    """Deletes a document and purges all its vector embeddings (Administrator only)."""
    success = delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"status": "success", "message": f"Document '{document_id}' and all associated embeddings deleted."}


@router.post("/ingest")
def trigger_default_ingestion(current_user: Dict[str, Any] = Depends(require_role(["Admin"]))):
    """Scans knowledge_base/ directory and indexes any unindexed documents (Administrator only)."""
    seed_default_knowledge_base()
    stats = get_vector_store_stats()
    return {
        "status": "success",
        "message": "Knowledge base sync complete.",
        "stats": stats
    }


@router.post("/search", response_model=RAGSearchResponse)
def search_documents(req: RAGSearchRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Direct semantic retrieval endpoint to test RAG chunk matching."""
    chunks = search_knowledge_base(
        query=req.query,
        top_k=req.top_k,
        category=req.category,
        min_similarity=req.min_similarity
    )
    return {
        "query": req.query,
        "results_count": len(chunks),
        "results": [
            {
                "chunk_id": c["chunk_id"],
                "document_id": c["document_id"],
                "document_title": c["document_title"],
                "document_category": c["document_category"],
                "chunk_index": c["chunk_index"],
                "text": c["text"],
                "metadata": c["metadata"],
                "similarity_score": c["similarity_score"]
            }
            for c in chunks
        ]
    }
