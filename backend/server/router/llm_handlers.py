from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from llm.base import LLMBase
from schema import Message
from server.context import (
    get_llm,
    get_db_session,
)
from sqlalchemy.orm import Session
from server.repository.user_repository import UserRepository

router = APIRouter(
    prefix="/llm",
    tags=["LLM"],
)


class ChatRequest(BaseModel):
    prompt: str
    system: str | None = None
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    content: str


@router.post("/chat", operation_id="chat_simple", response_model=ChatResponse)
async def chat_simple(
    req: ChatRequest,
    llm: LLMBase = Depends(get_llm),
    db: Session = Depends(get_db_session),
) -> ChatResponse:
    messages: List[Message] = []
    if req.system:
        messages.append(Message(role="system", content=req.system))
    user_prompt = req.prompt
    # If user_id provided, fetch profile and prepend contextual info
    if req.user_id:
        profile = UserRepository(db).get(req.user_id)
        if profile:
            context_lines = []
            if profile.gender:
                context_lines.append(f"성별: {profile.gender}")
            if profile.region:
                context_lines.append(f"지역: {profile.region}")
            if profile.job:
                context_lines.append(f"직업: {profile.job}")
            if context_lines:
                user_prompt = "\n".join(context_lines) + "\n\n" + user_prompt
    messages.append(Message(role="user", content=user_prompt))
    result = await llm.chat_completion(messages)
    return ChatResponse(content=result.content or "")
