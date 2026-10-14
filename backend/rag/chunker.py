import re
from typing import List, Dict, Any


def split_into_chunks(
    pages_data: List[Dict[str, Any]], 
    chunk_size: int = 650, 
    chunk_overlap: int = 120
) -> List[Dict[str, Any]]:
    """
    Splits page-level text into overlapping semantic chunks.
    Ensures chunks do not slice sentences mid-word.
    Returns: [{"chunk_index": int, "text": str, "metadata": {"page": int, "start_char": int}}]
    """
    chunks = []
    chunk_idx = 0

    for page_info in pages_data:
        page_num = page_info["page"]
        text = page_info["text"]

        if not text:
            continue

        # Split text into paragraphs first
        paragraphs = text.split("\n\n")
        current_chunk = ""
        start_char = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If adding this paragraph exceeds chunk_size, save current chunk and start new with overlap
            if len(current_chunk) + len(para) + 2 > chunk_size and len(current_chunk) > 100:
                chunks.append({
                    "chunk_index": chunk_idx,
                    "text": current_chunk.strip(),
                    "metadata": {
                        "page": page_num,
                        "char_count": len(current_chunk)
                    }
                })
                chunk_idx += 1
                # Create overlap by taking the last chunk_overlap characters
                overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else ""
                current_chunk = overlap_text + "\n\n" + para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para

        if current_chunk.strip():
            chunks.append({
                "chunk_index": chunk_idx,
                "text": current_chunk.strip(),
                "metadata": {
                    "page": page_num,
                    "char_count": len(current_chunk)
                }
            })
            chunk_idx += 1

    return chunks
