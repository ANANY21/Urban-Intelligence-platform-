from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    title: str
    category: str
    source_url: Optional[str] = None
    publication_date: Optional[str] = None
    retrieval_date: str
    file_type: str
    file_size_bytes: int
    chunk_count: int = 0
    uploaded_by: str
    created_at: str


class DocumentChunkItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    document_category: str
    chunk_index: int
    text: str
    metadata: Dict[str, Any] = {}
    similarity_score: float = 0.0


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    title: str
    category: str
    chunk_count: int
    message: str


class RAGSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    top_k: int = Field(4, ge=1, le=10)
    category: Optional[str] = None
    min_similarity: float = Field(0.12, ge=0.0, le=1.0)


class RAGSearchResponse(BaseModel):
    query: str
    results_count: int
    results: List[DocumentChunkItem]


class KnowledgeStatusResponse(BaseModel):
    total_documents: int
    total_chunks: int
    categories: Dict[str, int]
    vector_store: str
    embedding_provider: str
    status: str
