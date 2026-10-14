import re
import io
import logging
from typing import List, Dict, Any

logger = logging.getLogger("TextExtractor")


def extract_text_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Extracts text and page numbers from file bytes (PDF, TXT, MD).
    Returns a list of dicts: [{"page": int, "text": str}]
    """
    ext = filename.lower().split(".")[-1]
    pages_data = []

    if ext == "pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            for page_num, page in enumerate(reader.pages, start=1):
                raw_text = page.extract_text() or ""
                cleaned = clean_text(raw_text)
                if cleaned:
                    pages_data.append({
                        "page": page_num,
                        "text": cleaned
                    })
        except Exception as e:
            logger.error(f"Error parsing PDF with pypdf: {e}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    elif ext in ["txt", "md", "markdown", "csv"]:
        try:
            raw_text = file_bytes.decode("utf-8", errors="replace")
            cleaned = clean_text(raw_text)
            if cleaned:
                pages_data.append({
                    "page": 1,
                    "text": cleaned
                })
        except Exception as e:
            logger.error(f"Error parsing text file: {e}")
            raise ValueError(f"Failed to read text file: {str(e)}")

    else:
        raise ValueError(f"Unsupported file format '{ext}'. Allowed: .pdf, .txt, .md")

    return pages_data


def clean_text(text: str) -> str:
    """
    Cleans raw text without stripping critical information:
    - Normalizes null bytes and unicode control characters
    - Preserves newlines for paragraph and markdown structure
    - Consolidates multiple consecutive blank lines
    """
    if not text:
        return ""
    # Strip null bytes and non-printable control characters except newline and tab
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)
    # Replace carriage returns with standard newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace 3 or more consecutive newlines with 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace
    return text.strip()
