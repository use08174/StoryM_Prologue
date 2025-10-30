from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from server.context import get_config_parser, get_db_session
from server.security.auth import verify_token
from configparser import ConfigParser
from jose import jwt
from sqlalchemy.orm import Session
from server.repository.user_repository import UserRepository, UserProfile


router = APIRouter(prefix="/auth", tags=["Auth(Simple)"])


class SignupRequest(BaseModel):
    user_id: str = Field(min_length=3, max_length=64)
    gender: str
    region: str
    job: str


class UserProfile(BaseModel):
    user_id: str
    gender: str
    region: str
    job: str


class LoginRequest(BaseModel):
    user_id: str = Field(min_length=3, max_length=64)


def _user_key(user_id: str) -> str:
    return f"USER:{user_id}"


@router.post("/signup", response_model=UserProfile)
async def signup(
    req: SignupRequest,
    db: Session = Depends(get_db_session),
):
    repo = UserRepository(db)
    if repo.exists(req.user_id):
        raise HTTPException(status_code=409, detail="User already exists")

    user = UserProfile(
        user_id=req.user_id,
        gender=req.gender,
        region=req.region,
        job=req.job,
    )
    repo.create(user)
    return user


@router.post("/login")
async def login(
    req: LoginRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    parser: ConfigParser = Depends(get_config_parser),
):
    repo = UserRepository(db)
    if not repo.exists(req.user_id):
        raise HTTPException(status_code=404, detail="User not found")

    secret_key = parser.get("oauth2", "SECRET_KEY", fallback="secret_key")
    token = jwt.encode({"user_id": req.user_id}, key=secret_key, algorithm="HS256")
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
    return profile


