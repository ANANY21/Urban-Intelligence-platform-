import os
from datetime import timedelta

# Auth & Token Secrets
SECRET_KEY = os.environ.get(
    "SECRET_KEY", 
    "9f82d8c3b4a5e6f71029384756abcdef0123456789abcdef0123456789abcdef"
)
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Cookie Security Settings
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() in ("true", "1")
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "lax").lower()

# Initial Administrator Seed Configuration
INITIAL_ADMIN_EMAIL = os.environ.get("INITIAL_ADMIN_EMAIL", "admin@chennai-urban.gov.in")
INITIAL_ADMIN_USERNAME = os.environ.get("INITIAL_ADMIN_USERNAME", "admin")
INITIAL_ADMIN_PASSWORD = os.environ.get("INITIAL_ADMIN_PASSWORD", "Admin@Chennai2026!")

# Throttling
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 5
