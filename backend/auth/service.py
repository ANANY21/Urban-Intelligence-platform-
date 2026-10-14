import uuid
import secrets
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

from backend.storage import get_db_connection
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token
)
from .config import (
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_DURATION_MINUTES,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    INITIAL_ADMIN_EMAIL,
    INITIAL_ADMIN_USERNAME,
    INITIAL_ADMIN_PASSWORD
)

logger = logging.getLogger("AuthService")


# ==============================================================================
# AUDIT LOGGING HELPER
# ==============================================================================
def record_audit(action: str, user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None):
    """Persists an immutable audit log entry."""
    conn = get_db_connection()
    cursor = conn.cursor()
    log_id = f"aud-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        cursor.execute("""
        INSERT INTO audit_logs (id, user_id, action, details_json, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (log_id, user_id, action, json.dumps(details or {}), ip_address, now_iso))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
    finally:
        conn.close()


# ==============================================================================
# LOGIN THROTTLING & RATE LIMITING
# ==============================================================================
def check_login_throttle(key: str) -> tuple[bool, int]:
    """
    Checks if a username or IP address is locked out due to excessive failed attempts.
    Returns (is_locked, seconds_remaining).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT attempts, last_attempt, locked_until FROM login_attempts WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return False, 0

    now = datetime.now(timezone.utc)
    locked_until_str = row["locked_until"]

    if locked_until_str:
        locked_until = datetime.fromisoformat(locked_until_str)
        if now < locked_until:
            remaining = int((locked_until - now).total_seconds())
            return True, remaining
        else:
            # Lockout expired, reset record
            reset_login_attempts(key)
            return False, 0

    return False, 0


def record_login_failure(key: str):
    """Increments failed attempt count and locks if threshold is exceeded."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT attempts FROM login_attempts WHERE key = ?", (key,))
    row = cursor.fetchone()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    if row:
        new_attempts = row["attempts"] + 1
        if new_attempts >= MAX_LOGIN_ATTEMPTS:
            locked_until = (now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)).isoformat()
            cursor.execute("""
            UPDATE login_attempts SET attempts = ?, last_attempt = ?, locked_until = ? WHERE key = ?
            """, (new_attempts, now_iso, locked_until, key))
            logger.warning(f"Key '{key}' locked out for {LOCKOUT_DURATION_MINUTES} minutes due to {new_attempts} failures.")
        else:
            cursor.execute("""
            UPDATE login_attempts SET attempts = ?, last_attempt = ? WHERE key = ?
            """, (new_attempts, now_iso, key))
    else:
        cursor.execute("""
        INSERT INTO login_attempts (key, attempts, last_attempt, locked_until)
        VALUES (?, 1, ?, NULL)
        """, (key, now_iso))

    conn.commit()
    conn.close()


def reset_login_attempts(key: str):
    """Clears failed attempts upon successful authentication."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM login_attempts WHERE key = ?", (key,))
    conn.commit()
    conn.close()


# ==============================================================================
# USER MANAGEMENT & AUTHENTICATION
# ==============================================================================
def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by primary key ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_email_or_username(identifier: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by email or username."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? OR username = ?", (identifier.lower().strip(), identifier.strip()))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(email: str, username: str, password: str, role: str = "Viewer", full_name: Optional[str] = None) -> Dict[str, Any]:
    """Creates a new user record with Argon2 password hash."""
    clean_email = email.lower().strip()
    clean_username = username.strip()

    if get_user_by_email_or_username(clean_email):
        raise ValueError(f"User with email '{clean_email}' already exists.")
    if get_user_by_email_or_username(clean_username):
        raise ValueError(f"Username '{clean_username}' is already taken.")

    user_id = f"usr-{uuid.uuid4().hex[:10]}"
    hashed_pw = hash_password(password)
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO users (id, email, username, hashed_password, role, full_name, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (user_id, clean_email, clean_username, hashed_pw, role, full_name, now_iso, now_iso))
    conn.commit()
    conn.close()

    record_audit("USER_CREATED", user_id, {"email": clean_email, "role": role})
    return {
        "id": user_id,
        "email": clean_email,
        "username": clean_username,
        "role": role,
        "full_name": full_name,
        "is_active": True,
        "created_at": now_iso
    }


def authenticate_user(identifier: str, password: str, ip_address: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Authenticates a user by email/username and plaintext password.
    Enforces login throttling.
    """
    throttle_key = identifier.lower().strip()
    is_locked, remaining = check_login_throttle(throttle_key)
    if is_locked:
        record_audit("LOGIN_LOCKED", None, {"identifier": identifier, "remaining_seconds": remaining}, ip_address)
        raise PermissionError(f"Account temporarily locked due to multiple failed attempts. Try again in {remaining} seconds.")

    user = get_user_by_email_or_username(identifier)
    if not user:
        record_login_failure(throttle_key)
        record_audit("LOGIN_FAILURE", None, {"reason": "User not found", "identifier": identifier}, ip_address)
        return None

    if not user.get("is_active"):
        record_audit("LOGIN_DISABLED", user["id"], {"identifier": identifier}, ip_address)
        raise PermissionError("This account has been deactivated by an administrator.")

    if not verify_password(password, user["hashed_password"]):
        record_login_failure(throttle_key)
        record_audit("LOGIN_FAILURE", user["id"], {"reason": "Invalid password"}, ip_address)
        return None

    # Reset failed attempts upon successful login
    reset_login_attempts(throttle_key)
    record_audit("LOGIN_SUCCESS", user["id"], {"email": user["email"]}, ip_address)

    # Return safe user dictionary without password hash
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name"),
        "is_active": bool(user["is_active"]),
        "created_at": user["created_at"]
    }


# ==============================================================================
# TOKEN LIFECYCLE & ROTATION
# ==============================================================================
def issue_user_tokens(user: Dict[str, Any]) -> tuple[str, str]:
    """Issues a new short-lived access token and a long-lived refresh token."""
    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"]
    }
    access_token = create_access_token(token_payload)
    raw_refresh, token_hash = create_refresh_token(token_payload)

    # Store refresh token hash in DB
    conn = get_db_connection()
    cursor = conn.cursor()
    refresh_id = f"rft-{uuid.uuid4().hex[:12]}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
    """, (refresh_id, user["id"], token_hash, expires_at, now_iso))
    conn.commit()
    conn.close()

    return access_token, raw_refresh


def rotate_refresh_token(raw_refresh: str) -> tuple[str, str, Dict[str, Any]]:
    """
    Validates an incoming refresh token, revokes it (single-use),
    and issues a brand-new access and refresh token pair.
    """
    payload = decode_token(raw_refresh)
    if not payload or payload.get("type") != "refresh":
        raise ValueError("Invalid or expired refresh token.")

    user_id = payload.get("sub")
    token_hash = hash_token(raw_refresh)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0
    """, (token_hash,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        # Possible token reuse attack detected! Revoke all tokens for this user for security
        revoke_all_user_tokens(user_id)
        record_audit("REFRESH_TOKEN_REUSE_DETECTED", user_id, {"token_hash": token_hash[:10]})
        raise ValueError("Refresh token is invalid or has already been used.")

    # Check expiration
    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?", (row["id"],))
        conn.commit()
        conn.close()
        raise ValueError("Refresh token has expired. Please log in again.")

    # Mark old token as revoked
    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?", (row["id"],))
    conn.commit()
    conn.close()

    # Fetch user
    user = get_user_by_id(user_id)
    if not user or not user["is_active"]:
        raise ValueError("User account is inactive or not found.")

    safe_user = {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name"),
        "is_active": bool(user["is_active"]),
        "created_at": user["created_at"]
    }

    new_access, new_refresh = issue_user_tokens(safe_user)
    record_audit("TOKEN_REFRESH", user_id)
    return new_access, new_refresh, safe_user


def revoke_token(raw_refresh: str):
    """Revokes a specific refresh token upon logout."""
    token_hash = hash_token(raw_refresh)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?", (token_hash,))
    conn.commit()
    conn.close()


def revoke_all_user_tokens(user_id: str):
    """Revokes all refresh tokens for a user (e.g. after password reset or security breach)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()


# ==============================================================================
# PASSWORD RESET WORKFLOW
# ==============================================================================
def create_password_reset_token(email: str) -> Optional[str]:
    """Generates a secure 32-byte cryptographic hex token valid for 30 minutes."""
    user = get_user_by_email_or_username(email)
    if not user:
        return None

    raw_token = secrets.token_hex(24)
    token_hash = hash_token(raw_token)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?
    """, (token_hash, expires_at, user["id"]))
    conn.commit()
    conn.close()

    record_audit("PASSWORD_RESET_REQUESTED", user["id"], {"email": email})
    return raw_token


def reset_password_with_token(raw_token: str, new_password: str) -> bool:
    """Validates the reset token and updates the user's password with Argon2."""
    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM users WHERE reset_token = ?
    """, (token_hash,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return False

    expires_at_str = user["reset_token_expires"]
    if not expires_at_str or now > datetime.fromisoformat(expires_at_str):
        conn.close()
        return False

    hashed_pw = hash_password(new_password)
    now_iso = now.isoformat()
    cursor.execute("""
    UPDATE users 
    SET hashed_password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = ?
    WHERE id = ?
    """, (hashed_pw, now_iso, user["id"]))
    conn.commit()
    conn.close()

    # Revoke all existing sessions on password change
    revoke_all_user_tokens(user["id"])
    record_audit("PASSWORD_RESET_COMPLETED", user["id"])
    return True


# ==============================================================================
# ADMIN USER MANAGEMENT
# ==============================================================================
def list_all_users() -> List[Dict[str, Any]]:
    """Returns list of all users with public profile fields."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, email, username, role, full_name, is_active, created_at, updated_at 
    FROM users ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_user_role(user_id: str, new_role: str, admin_user_id: str) -> bool:
    """Updates the role of a user (Admin only)."""
    if new_role not in ["Admin", "Analyst", "Viewer"]:
        raise ValueError("Invalid role. Allowed roles: Admin, Analyst, Viewer.")

    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    UPDATE users SET role = ?, updated_at = ? WHERE id = ?
    """, (new_role, now_iso, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected > 0:
        record_audit("USER_ROLE_UPDATED", admin_user_id, {"target_user_id": user_id, "new_role": new_role})
        return True
    return False


def set_user_active_status(user_id: str, is_active: bool, admin_user_id: str) -> bool:
    """Enables or disables a user account (Admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?
    """, (1 if is_active else 0, now_iso, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected > 0:
        record_audit("USER_STATUS_UPDATED", admin_user_id, {"target_user_id": user_id, "is_active": is_active})
        if not is_active:
            revoke_all_user_tokens(user_id)
        return True
    return False


# ==============================================================================
# AUTOMATIC INITIAL SEEDING
# ==============================================================================
def seed_default_admin():
    """Seeds the initial administrator and sample operational users if users table is empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users")
    count = cursor.fetchone()["count"]
    conn.close()

    if count == 0:
        logger.info("Initializing default users in database...")
        # 1. Admin Account
        create_user(
            email=INITIAL_ADMIN_EMAIL,
            username=INITIAL_ADMIN_USERNAME,
            password=INITIAL_ADMIN_PASSWORD,
            role="Admin",
            full_name="GCC Crisis Operations Admin"
        )
        # 2. Analyst Account
        create_user(
            email="analyst@chennai-urban.gov.in",
            username="analyst_chennai",
            password="Analyst@Chennai2026!",
            role="Analyst",
            full_name="Senior Urban Hydrologist"
        )
        # 3. Viewer Account
        create_user(
            email="viewer@chennai-urban.gov.in",
            username="viewer_chennai",
            password="Viewer@Chennai2026!",
            role="Viewer",
            full_name="Civic Agency Observer"
        )
        logger.info(f"Seeded Admin ({INITIAL_ADMIN_EMAIL}), Analyst, and Viewer accounts.")
