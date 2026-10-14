from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    ADMIN = "Admin"
    ANALYST = "Analyst"
    VIEWER = "Viewer"


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=3, max_length=100, description="Email address or username")
    password: str = Field(..., min_length=6, max_length=100)


class RegisterRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid email address")
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_\-\.]+$")
    password: str = Field(..., min_length=8, max_length=100, description="Minimum 8 characters")
    full_name: Optional[str] = Field(None, max_length=100)
    role: Optional[UserRole] = Field(UserRole.VIEWER, description="Initial role request")


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RoleUpdateRequest(BaseModel):
    role: UserRole


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid registered email address")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=16)
    new_password: str = Field(..., min_length=8, max_length=100)


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None
