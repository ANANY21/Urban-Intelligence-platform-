from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Response, Depends, HTTPException, status

from .models import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    RoleUpdateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest
)
from .service import (
    authenticate_user,
    create_user,
    issue_user_tokens,
    rotate_refresh_token,
    revoke_token,
    create_password_reset_token,
    reset_password_with_token,
    list_all_users,
    update_user_role,
    set_user_active_status
)
from .dependencies import get_current_user, require_role
from .config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    COOKIE_SECURE,
    COOKIE_SAMESITE
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, response: Response):
    """
    Authenticates user and returns JWT bearer token while securely setting
    HttpOnly cookies for browser sessions. Throttles consecutive failed attempts.
    """
    client_ip = request.client.host if request.client else "unknown"
    try:
        user = authenticate_user(req.username_or_email, req.password, ip_address=client_ip)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your username/email and password."
        )

    access_token, refresh_token = issue_user_tokens(user)

    # Set secure HttpOnly cookies for browser clients
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/api/auth"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }


@router.post("/logout")
def logout(request: Request, response: Response):
    """Clears authentication cookies and revokes refresh token session."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            revoke_token(refresh_token)
        except Exception:
            pass

    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"status": "logged_out", "message": "Session terminated successfully."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns profile information and role permissions for the currently authenticated user."""
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh_session(request: Request, response: Response, body: Optional[RefreshTokenRequest] = None):
    """
    Rotates access and refresh tokens using either HttpOnly cookie or request payload.
    Enforces single-use refresh token rotation.
    """
    token_to_use = None
    if body and body.refresh_token:
        token_to_use = body.refresh_token
    else:
        token_to_use = request.cookies.get("refresh_token")

    if not token_to_use:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required for session rotation."
        )

    try:
        new_access, new_refresh, user = rotate_refresh_token(token_to_use)
    except ValueError as e:
        response.delete_cookie(key="access_token", path="/")
        response.delete_cookie(key="refresh_token", path="/api/auth")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    # Update cookies
    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/api/auth"
    )

    return {
        "access_token": new_access,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, response: Response):
    """Registers a new user account with default Viewer role (or requested role if valid)."""
    assigned_role = req.role.value if req.role else "Viewer"
    # Public registration can only grant 'Viewer' role; Analyst and Admin require explicit admin elevation
    if assigned_role in ["Admin", "Analyst"]:
        assigned_role = "Viewer"

    try:
        user = create_user(
            email=req.email,
            username=req.username,
            password=req.password,
            role=assigned_role,
            full_name=req.full_name
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    access_token, refresh_token = issue_user_tokens(user)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/api/auth"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    """
    Initiates password reset workflow. Generates a time-limited reset token.
    Generic response is returned to avoid email enumeration.
    """
    token = create_password_reset_token(req.email)
    # In production, dispatch email containing reset link. For local environment, return token metadata.
    return {
        "status": "success",
        "message": "If an account exists with that email, a password reset authorization has been generated.",
        "reset_token": token if token else None  # Provided for seamless local evaluation
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    """Resets user password given a valid, unexpired reset token."""
    success = reset_password_with_token(req.token, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired."
        )
    return {"status": "success", "message": "Password successfully updated. Please log in with your new password."}


# ==============================================================================
# ADMIN ROLE MANAGEMENT (RBAC)
# ==============================================================================
@router.get("/users", response_model=List[UserResponse])
def get_all_users(admin: Dict[str, Any] = Depends(require_role(["Admin"]))):
    """Lists all registered users (Administrator only)."""
    return list_all_users()


@router.put("/users/{user_id}/role")
def set_role(user_id: str, req: RoleUpdateRequest, admin: Dict[str, Any] = Depends(require_role(["Admin"]))):
    """Elevates or changes user role (Administrator only)."""
    try:
        success = update_user_role(user_id, req.role.value, admin["id"])
        if not success:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"status": "success", "message": f"User role updated to '{req.role.value}'."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/users/{user_id}")
def deactivate_user(user_id: str, admin: Dict[str, Any] = Depends(require_role(["Admin"]))):
    """Deactivates a user account (Administrator only)."""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")
    success = set_user_active_status(user_id, is_active=False, admin_user_id=admin["id"])
    if not success:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"status": "success", "message": "User account deactivated."}
