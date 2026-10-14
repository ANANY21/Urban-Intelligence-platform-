import os
import math
import hashlib
import logging
from abc import ABC, abstractmethod
from typing import List
import numpy as np

logger = logging.getLogger("Embeddings")


class BaseEmbeddingProvider(ABC):
    """Abstract base class for RAG text embedding providers."""

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass

    @abstractmethod
    def embed_query(self, query: str) -> List[float]:
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        pass


class LocalDenseEmbeddingProvider(BaseEmbeddingProvider):
    """
    High-performance, zero-external-dependency local dense embedding provider.
    Generates 128-dimensional L2-normalized feature vectors using subword n-gram hashing
    and term weighting.
    - Zero API cost
    - 100% offline capable
    - Dot product between vectors equals exact cosine similarity
    """

    def __init__(self, dim: int = 128):
        self._dim = dim

    @property
    def dimension(self) -> int:
        return self._dim

    def _text_to_vector(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self._dim

        # Tokenize and normalize words & n-grams
        tokens = [w.lower() for w in text.split() if len(w) > 1]
        vec = np.zeros(self._dim, dtype=np.float32)

        for i, word in enumerate(tokens):
            # Term weight based on length and position
            weight = math.log(len(word) + 1.0)
            # Hash word into bucket
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            bucket = h % self._dim
            sign = 1.0 if ((h >> 8) & 1) == 0 else -1.0
            vec[bucket] += sign * weight

            # Bigram hashing for sequential context
            if i > 0:
                bi = f"{tokens[i-1]}_{word}"
                h_bi = int(hashlib.sha256(bi.encode("utf-8")).hexdigest(), 16)
                b_bi = h_bi % self._dim
                s_bi = 1.0 if ((h_bi >> 8) & 1) == 0 else -1.0
                vec[b_bi] += s_bi * (weight * 1.5)

        # L2-normalize to unit length
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._text_to_vector(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        return self._text_to_vector(query)


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """OpenAI Embedding Provider using text-embedding-3-small."""

    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.model = model
        self._dim = 1536

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        import httpx
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {"input": texts, "model": self.model}
        res = httpx.post(url, headers=headers, json=payload, timeout=20.0)
        res.raise_for_status()
        data = res.json()["data"]
        return [item["embedding"] for item in data]

    def embed_query(self, query: str) -> List[float]:
        return self.embed_documents([query])[0]


def get_embedding_provider() -> BaseEmbeddingProvider:
    """Factory creating configured embedding provider based on environment variables."""
    provider_type = os.environ.get("EMBEDDING_PROVIDER", "local").lower()
    api_key = os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY")

    if provider_type == "openai" and api_key:
        model = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")
        return OpenAIEmbeddingProvider(api_key=api_key, model=model)

    return LocalDenseEmbeddingProvider(dim=128)
