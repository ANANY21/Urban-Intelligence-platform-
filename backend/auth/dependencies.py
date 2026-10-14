from typing import Optional, List, Dict, Any
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .security import decode_token
from .service import get_user_by_id

security_scheme = HTTPBearer(auto_error=False)


def get_token_from_request(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[str]:
    """
    Extracts JWT access token with dual support:
    1. Authorization: Bearer <token> header (API clients / Mobile).
    2. HttpOnly 'access_token' cookie (Secure Browser session).
    """
    if auth_header and auth_header.credentials:
        return auth_header.credentials
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    return None


def get_current_user(token: Optional[str] = Depends(get_token_from_request)) -> Dict[str, Any]:
    """
    Validates token and returns current active user.
    Raises 401 if missing, invalid, or expired.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated.",
        )

    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name"),
        "is_active": bool(user["is_active"]),
        "created_at": user["created_at"]
    }


def get_optional_current_user(token: Optional[str] = Depends(get_token_from_request)) -> Optional[Dict[str, Any]]:
    """Returns user if token is valid, otherwise None without raising error."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = get_user_by_id(user_id)
    if not user or not user.get("is_active"):
        return None
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name"),
        "is_active": bool(user["is_active"])
    }


def require_role(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    Example: Depends(require_role(["Admin", "Analyst"]))
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "Viewer")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}. Your role is '{user_role}'.",
            )
        return current_user
    return role_checker
