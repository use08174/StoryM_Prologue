from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from server.context import get_config_parser, get_db_session
from server.security.auth import verify_token
from configparser import ConfigParser
from jose import jwt
from sqlalchemy.orm import Session
from server.repository.user_repository import UserRepository, UserProfile as UserProfileData


router = APIRouter(prefix="/auth", tags=["Auth(Simple)"])


class SignupRequest(BaseModel):
    id: str = Field(..., description="User ID (for login)")
    email: str = Field(..., description="User email address (for internal use)")
    password: str = Field(min_length=6, description="User password")


class UserProfile(BaseModel):
    user_id: str
    email: str
    # Note: password is excluded from response model for security


class LoginRequest(BaseModel):
    id: str = Field(..., description="User ID")
    password: str = Field(..., description="User password")


def _user_key(user_id: str) -> str:
    return f"USER:{user_id}"


@router.post("/signup", response_model=UserProfile)
async def signup(
    req: SignupRequest,
    db: Session = Depends(get_db_session),
):
    repo = UserRepository(db)
    
    # Check if user_id already exists
    if repo.exists(req.id):
        raise HTTPException(status_code=409, detail="User ID already exists")
    
    # Check if email already exists (for internal use)
    if repo.exists_by_email(req.email):
        raise HTTPException(status_code=409, detail="Email already exists")

    # Hash the password before storing
    hashed_password = UserRepository.hash_password(req.password)
    
    # Use id as user_id
    user_id = req.id
    
    user = UserProfileData(
        user_id=user_id,
        email=req.email,
        password=hashed_password,
    )
    repo.create(user)
    # Return user profile without password
    return UserProfile(
        user_id=user.user_id,
        email=user.email,
    )


@router.post("/login")
async def login(
    req: LoginRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    parser: ConfigParser = Depends(get_config_parser),
):
    repo = UserRepository(db)
    # Login with user_id (id) instead of email
    user = repo.get(req.id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid ID or password")
    
    # Verify password
    if not UserRepository.verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid ID or password")

    secret_key = parser.get("oauth2", "SECRET_KEY", fallback="secret_key")
    token = jwt.encode({"user_id": user.user_id, "email": user.email}, key=secret_key, algorithm="HS256")
    # Set cookie for convenience (front can also store token manually)
    response.set_cookie(key="token", value=token, max_age=60 * 60 * 24 * 30)
    return {"token": token}


@router.get("/me", response_model=UserProfile)
async def me(
    token: Optional[str] = None,
    db: Session = Depends(get_db_session),
    parser: ConfigParser = Depends(get_config_parser),
):
    # Prefer Authorization cookie named 'token' if header param not provided
    if not token:
        # This endpoint is typically proxied by FastAPI, we can not access Request here without Depends, so keep simple:
        # Ask callers to pass token as query when needed; otherwise, they can call from browser where cookie will be attached.
        raise HTTPException(status_code=400, detail="Provide token as query or via cookie on protected endpoints")

    user_claims = verify_token(token, parser)
    user_id = user_claims.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    repo = UserRepository(db)
    profile = repo.get(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    # Convert dataclass to response model
    return UserProfile(
        user_id=profile.user_id,
        email=profile.email,
    )


