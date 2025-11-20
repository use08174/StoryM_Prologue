from typing import List, Optional, Dict
import re

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from llm.base import LLMBase
from schema import Message
from server.context import (
    get_llm,
    get_db_session,
)
from sqlalchemy.orm import Session
from server.repository.user_repository import UserRepository
from server.repository.character_repository import CharacterRepository
from server.router.youth_policy_handlers import youth_policy_service
from pathlib import Path
from configparser import ConfigParser
import os

def load_youth_api_key():
    # 1) ENV 우선
    env_key = os.getenv("YOUTHCENTER_OPENAPI_VLAK")
    if env_key:
        return env_key.strip()

    # 2) 여러 후보 경로 탐색
    candidates = [
        Path.cwd() / "config.ini",
        Path(__file__).resolve().parents[2] / "config.ini",  # backend/config.ini
    ]
    cfg = ConfigParser()
    for p in candidates:
        if p.exists():
            cfg.read(p, encoding="utf-8")
            if cfg.has_option("youth_policy", "api_key"):
                return cfg.get("youth_policy", "api_key").strip()

    raise RuntimeError("API 키를 찾을 수 없습니다.")

router = APIRouter(
    prefix="/llm",
    tags=["LLM"],
)


class ChatRequest(BaseModel):
    prompt: str
    user_id: Optional[str] = None
    character_id: Optional[int] = None  # 캐릭터 ID


class ChatResponse(BaseModel):
    content: str


class ExtractPolicyContextRequest(BaseModel):
    prompt: str  # 질문 또는 프롬프트
    context: List[Dict]  # 수동으로 검색해온 정책 리스트 (youth_policy/search API 결과의 policies 필드)


class ExtractPolicyContextResponse(BaseModel):
    prompt: str  # 최종 생성된 프롬프트 (context + 원본 prompt 결합)


def extract_keywords(text: str) -> List[str]:
    """
    텍스트에서 키워드 추출 (한국어 명사 위주)
    간단한 구현: 2글자 이상의 연속된 문자 조합
    """
    # 한글, 영문, 숫자만 포함
    words = re.findall(r'[가-힣]+|[a-zA-Z]+|\d+', text)
    # 2글자 이상만 필터링
    keywords = [w for w in words if len(w) >= 2]
    
    # 정책 검색에 유용한 키워드 우선순위 적용
    policy_keywords = [
        '전세', '임대', '주거', '주택', '월세', '보증금', '자금', '대출',
        '청년', '주거급여', '청년주택', '청년희망키움', '공공임대',
        '교육', '일자리', '창업', '취업', '복지문화'
    ]
    
    # 우선순위 키워드가 있으면 먼저 반환
    prioritized = [kw for kw in policy_keywords if kw in text]
    if prioritized:
        return prioritized + [k for k in keywords if k not in prioritized]
    
    return keywords


def calculate_relevance_score(question: str, policy: Dict) -> float:
    """
    질문과 정책의 관련성을 점수로 계산
    반환: 0.0 ~ 1.0 사이의 점수
    """
    # 정책에서 추출할 수 있는 텍스트 필드들
    policy_text_fields = [
        policy.get("plcyNm", ""),  # 정책명
        policy.get("plcyExplnCn", ""),  # 정책설명
        policy.get("plcyKywdNm", ""),  # 키워드
        policy.get("plcySprtCn", ""),  # 지원내용
    ]
    
    # 모든 텍스트를 합쳐서 하나의 문서로 만듦
    policy_text = " ".join(str(field) for field in policy_text_fields if field)
    
    if not policy_text:
        return 0.0
    
    # 질문과 정책 텍스트에서 키워드 추출
    question_keywords = set(extract_keywords(question.lower()))
    policy_keywords = set(extract_keywords(policy_text.lower()))
    
    if not question_keywords:
        return 0.0
    
    # 키워드 매칭 점수 (Jaccard similarity)
    intersection = question_keywords & policy_keywords
    union = question_keywords | policy_keywords
    
    if not union:
        return 0.0
    
    jaccard_score = len(intersection) / len(union)
    
    # 부분 일치 보너스 (질문의 키워드가 정책 텍스트에 포함되는 경우)
    partial_match_bonus = 0.0
    for q_keyword in question_keywords:
        if q_keyword in policy_text:
            partial_match_bonus += 0.1
    
    # 최종 점수 (Jaccard + 부분일치 보너스, 최대 1.0)
    final_score = min(1.0, jaccard_score + partial_match_bonus)
    
    return final_score


def filter_relevant_policies(question: str, policies: List[Dict], max_count: int = 5) -> List[Dict]:
    """
    질문과 관련된 정책만 필터링하여 반환
    관련성 점수 기준으로 정렬하여 상위 N개만 반환
    """
    if not policies:
        return []
    
    # 각 정책에 대해 관련성 점수 계산
    scored_policies = []
    for policy in policies:
        score = calculate_relevance_score(question, policy)
        scored_policies.append((score, policy))
    
    # 점수 기준으로 내림차순 정렬
    scored_policies.sort(key=lambda x: x[0], reverse=True)
    
    # 상위 N개만 반환
    relevant_policies = [policy for score, policy in scored_policies[:max_count] if score > 0]
    
    return relevant_policies


def format_policy_context(policies: List[Dict]) -> str:
    """
    정책 목록을 LLM 프롬프트에 포함할 수 있는 형태로 포맷팅
    """
    if not policies:
        return ""
    
    context_parts = []
    for i, policy in enumerate(policies, 1):
        parts = []
        
        # 정책명
        if policy.get("plcyNm"):
            parts.append(f"정책명: {policy['plcyNm']}")
        
        # 정책 설명
        if policy.get("plcyExplnCn"):
            parts.append(f"설명: {policy['plcyExplnCn']}")
        
        # 키워드
        if policy.get("plcyKywdNm"):
            parts.append(f"키워드: {policy['plcyKywdNm']}")
        
        # 지원 내용
        if policy.get("plcySprtCn"):
            parts.append(f"지원내용: {policy['plcySprtCn']}")
        
        # 대분류, 중분류
        if policy.get("lclsfNm"):
            parts.append(f"대분류: {policy['lclsfNm']}")
        if policy.get("mclsfNm"):
            parts.append(f"중분류: {policy['mclsfNm']}")
        
        if parts:
            context_parts.append(f"[정책 {i}]\n" + "\n".join(parts))
    
    return "\n\n".join(context_parts)


def _build_user_message(
    req: ChatRequest,
    db: Session,
) -> Message:
    """Generate a user message with optional character context."""
    user_prompt = req.prompt

    if req.character_id:
        character_repo = CharacterRepository(db)
        character = character_repo.get(req.character_id)

        if character:
            context_lines = []
            if character.job:
                context_lines.append(f"직업: {character.job}")
            if character.gender:
                context_lines.append(f"성별: {character.gender}")
            if character.region:
                context_lines.append(f"사는지역: {character.region}")

            if context_lines:
                user_prompt = "\n".join(context_lines) + "\n\n" + user_prompt
    elif req.user_id:
        character_repo = CharacterRepository(db)
        characters = character_repo.get_by_user_id(req.user_id)
        if characters:
            character = characters[0]
            context_lines = []
            if character.gender:
                context_lines.append(f"성별: {character.gender}")
            if character.region:
                context_lines.append(f"지역: {character.region}")
            if character.job:
                context_lines.append(f"직업: {character.job}")
            if context_lines:
                user_prompt = "\n".join(context_lines) + "\n\n" + user_prompt

    return Message(role="user", content=user_prompt)


@router.post("/chat", operation_id="chat_simple", response_model=ChatResponse)
async def chat_simple(
    req: ChatRequest,
    llm: LLMBase = Depends(get_llm),
    db: Session = Depends(get_db_session),
) -> ChatResponse:
    messages: List[Message] = [_build_user_message(req, db)]
    result = await llm.chat_completion(messages)
    return ChatResponse(content=result.content or "")


@router.post("/chat/stream", operation_id="chat_stream")
async def chat_stream(
    req: ChatRequest,
    llm: LLMBase = Depends(get_llm),
    db: Session = Depends(get_db_session),
):
    """
    Streaming LLM chat endpoint (text stream, not SSE).
    Frontend reads chunks continuously using fetch + reader.read().
    """
    messages: List[Message] = [_build_user_message(req, db)]

    async def event_generator():
        # gpt-4o-mini 등의 모델로부터 스트림 형태로 응답 받기
        async for chunk in llm.stream_chat_completion(messages):
            # yield는 바로바로 한 조각씩 프론트로 전송됨
            yield chunk
    # text/event-stream 대신 text/plain으로 — 단순 텍스트 스트림
    return StreamingResponse(event_generator(), media_type="text/plain")



@router.post("/extract-policy-context", operation_id="extract_policy_context", response_model=ExtractPolicyContextResponse)
async def extract_policy_context(
    req: ExtractPolicyContextRequest,
) -> ExtractPolicyContextResponse:
    """
    질문 프롬프트와 수동으로 검색해온 정책 컨텍스트에서 관련된 정책만 추출하여 프롬프트를 생성합니다.
    
    전달받은 context(정책 리스트) 중에서 질문과 유사한 정책만 자동으로 필터링하여 컨텍스트로 사용하고,
    원본 프롬프트와 결합하여 최종 프롬프트를 반환합니다.
    """
    print(f"[LLM] 받은 context 정책 개수: {len(req.context)}")
    
    # 전달받은 context에서 질문과 관련된 정책만 필터링
    max_context_policies = 5  # 기본값: 최대 5개 정책만 사용
    relevant_policies = filter_relevant_policies(
        req.prompt,
        req.context,
        max_count=max_context_policies
    )
    
    print(f"[LLM] 필터링된 관련 정책 개수: {len(relevant_policies)}")
    
    # 필터링된 정책을 컨텍스트로 포맷팅
    policy_context = format_policy_context(relevant_policies)
    
    # 최종 프롬프트 생성
    final_prompt_parts = []
    
    # 컨텍스트가 있으면 추가
    if policy_context:
        final_prompt_parts.append("=== 관련 청년정책 정보 ===")
        final_prompt_parts.append(policy_context)
        final_prompt_parts.append("")  # 빈 줄
    
    # 원본 프롬프트 추가
    final_prompt_parts.append("=== 질문 ===")
    final_prompt_parts.append(req.prompt)
    
    # 최종 프롬프트 결합
    final_prompt = "\n".join(final_prompt_parts)
    
    return ExtractPolicyContextResponse(
        prompt=final_prompt
    )
