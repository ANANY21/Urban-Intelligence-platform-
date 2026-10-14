"""
Comprehensive automated integration test suite for:
- Secure Authentication & RBAC (Argon2, JWT, Cookies/Bearer, Role Throttling)
- Knowledge Base & RAG Vector Engine (Document chunking, SQLite cosine similarity)
- AI Urban Intelligence Assistant (Intent routing, ML tool dispatching, grounded RAG synthesis)
"""
import os
import sys

WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_admin_login_and_me():
    # 1. Login with seeded admin credentials
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin@chennai-urban.gov.in",
        "password": "Admin@Chennai2026!"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    assert token_data["user"]["role"] == "Admin"
    assert token_data["user"]["email"] == "admin@chennai-urban.gov.in"

    # 2. Access /api/auth/me with Bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["role"] == "Admin"

    # 3. Access /api/auth/users (Admin only)
    users_resp = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert users_resp.status_code == 200
    users_data = users_resp.json()
    assert len(users_data) >= 1

def test_rbac_restriction():
    # Register a viewer
    import uuid
    uid = uuid.uuid4().hex[:6]
    reg_resp = client.post("/api/auth/register", json={
        "email": f"viewer_{uid}@chennai-urban.gov.in",
        "username": f"viewer_{uid}",
        "password": "ViewerPassword123!",
        "full_name": "Test Viewer User"
    })
    assert reg_resp.status_code in (200, 201)
    viewer_token = reg_resp.json()["access_token"]
    assert reg_resp.json()["user"]["role"] == "Viewer"

    # Viewer should be FORBIDDEN (403) from accessing admin user management
    admin_only_resp = client.get("/api/auth/users", headers={"Authorization": f"Bearer {viewer_token}"})
    assert admin_only_resp.status_code == 403

def test_knowledge_base_endpoints():
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin@chennai-urban.gov.in",
        "password": "Admin@Chennai2026!"
    })
    token = login_resp.json()["access_token"]

    # Knowledge status
    status_resp = client.get("/api/knowledge/status", headers={"Authorization": f"Bearer {token}"})
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["total_documents"] >= 5
    assert status_data["total_chunks"] >= 20

    # Knowledge documents listing
    docs_resp = client.get("/api/knowledge/documents", headers={"Authorization": f"Bearer {token}"})
    assert docs_resp.status_code == 200
    docs = docs_resp.json()
    assert len(docs) >= 5

    # Knowledge semantic search
    search_resp = client.post("/api/knowledge/search", headers={"Authorization": f"Bearer {token}"}, json={
        "query": "Chembarambakkam surplus discharge and Adyar river",
        "top_k": 3
    })
    assert search_resp.status_code == 200
    results = search_resp.json()["results"]
    assert len(results) >= 1
    assert any("Chembarambakkam" in r["text"] or "Adyar" in r["text"] for r in results)

def test_assistant_chat_and_tools():
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "admin@chennai-urban.gov.in",
        "password": "Admin@Chennai2026!"
    })
    token = login_resp.json()["access_token"]

    # 1. Ask traffic prediction query (should invoke predict_traffic tool)
    traffic_chat = client.post("/api/assistant/chat", headers={"Authorization": f"Bearer {token}"}, json={
        "message": "What is the predicted traffic congestion for Anna Salai at 18:00 with heavy rain?"
    })
    assert traffic_chat.status_code == 200
    t_data = traffic_chat.json()
    assert t_data["role"] == "assistant"
    assert len(t_data["content"]) > 0
    assert len(t_data["tool_calls"]) >= 1
    assert t_data["tool_calls"][0]["tool_name"] == "predict_traffic"

    # 2. Ask knowledge base query (should retrieve sources)
    kb_chat = client.post("/api/assistant/chat", headers={"Authorization": f"Bearer {token}"}, json={
        "message": "Explain the IMD rainfall intensity classification categories for Chennai."
    })
    assert kb_chat.status_code == 200
    kb_data = kb_chat.json()
    assert len(kb_data["sources"]) >= 1

    # 3. Retrieve conversation history
    history_resp = client.get("/api/assistant/history", headers={"Authorization": f"Bearer {token}"})
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    assert len(history_data) >= 1

if __name__ == "__main__":
    print("Running test_health()...")
    test_health()
    print("PASS: test_health")

    print("Running test_admin_login_and_me()...")
    test_admin_login_and_me()
    print("PASS: test_admin_login_and_me")

    print("Running test_rbac_restriction()...")
    test_rbac_restriction()
    print("PASS: test_rbac_restriction")

    print("Running test_knowledge_base_endpoints()...")
    test_knowledge_base_endpoints()
    print("PASS: test_knowledge_base_endpoints")

    print("Running test_assistant_chat_and_tools()...")
    test_assistant_chat_and_tools()
    print("PASS: test_assistant_chat_and_tools")

    print("\nALL 5 AUTOMATED BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!")
