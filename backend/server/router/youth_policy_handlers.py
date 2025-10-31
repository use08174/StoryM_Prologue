import httpx
import asyncio
import configparser
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
router = APIRouter(prefix="/youth-policy", tags=["Youth Policy"])

# 부동산 관련 검색 가능한 키워드들
REAL_ESTATE_KEYWORDS = [
    # 주거 지원 정책
    '청년주택',           # 청년주택 공급 정책
    '청년희망키움',        # 청년희망키움 주택
    '청년매입임대',        # 청년매입임대주택
    '공공임대',           # 공공임대주택
    '매입임대',           # 매입임대주택
    
    # 전세 관련
    '전세',              # 전세 관련 정책
    '전세자금대출',       # 전세자금 대출 지원
    '전세보증금',         # 전세보증금 지원
    
    # 임대 관련
    '임대',              # 임대 관련 정책
    '임대료',            # 임대료 지원
    '월세',              # 월세 지원
    
    # 주거비 지원
    '주거급여',           # 주거급여 지원
    '청년주거급여',        # 청년 주거급여
    '주거지원',           # 주거 지원 정책
    '주거비',             # 주거비 지원
    
    # 자금 지원
    '청년도약계좌',        # 청년도약계좌
    '주거자금',           # 주거자금 지원
    '대출',              # 주거 관련 대출
    
    # 기타
    '주거',              # 주거 관련 전반
    '부동산',            # 부동산 관련 정책
    '주택',              # 주택 관련 정책
]

class PolicySearchRequest(BaseModel):
    keyword: str
    page_index: int = 1
    display: int = 10

class PolicySearchResponse(BaseModel):
    keyword: str
    total_count: int
    policies: List[Dict]
    search_url: str

class KeywordExtractionRequest(BaseModel):
    question: str

class KeywordExtractionResponse(BaseModel):
    original_question: str
    extracted_keywords: List[str]
    keyword_categories: Dict[str, List[str]]
    suggested_searches: List[Dict[str, str]]


class YouthPolicyService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.youthcenter.go.kr/opi/youthPlcyList.do"
    
    async def search_policy(self, keyword: str, page_index: int = 1, display: int = 10) -> Dict:
        """온통청년 API로 정책 검색"""
        params = {
            "openApiVlak": self.api_key,
            "pageIndex": page_index,
            "display": display,
            "query": keyword,
            "keyword": keyword
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "keyword": keyword,
                    "total_count": data.get("totalCount", 0),
                    "policies": data.get("items", []),
                    "search_url": str(response.url)
                }
                
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"API 요청 실패: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")

# 키워드 추출을 위한 매핑 테이블
KEYWORD_MAPPING = {
    # 주거 관련
    '집': ['주거', '주택'],
    '살 곳': ['주거', '주택'],
    '거주': ['주거'],
    '주택': ['주택', '주거'],
    '아파트': ['주택', '주거'],
    '원룸': ['주거', '임대'],
    '고시원': ['주거', '임대'],
    
    # 전세 관련
    '전세': ['전세'],
    '전세자금': ['전세자금대출', '전세'],
    '전세보증금': ['전세보증금', '전세'],
    '전세대출': ['전세자금대출', '전세'],
    '전세금': ['전세'],
    
    # 임대 관련
    '월세': ['월세', '임대'],
    '임대': ['임대'],
    '임대료': ['임대료', '임대'],
    '렌트': ['임대'],
    '세들어': ['임대'],
    
    # 청년주택 관련
    '청년주택': ['청년주택'],
    '희망키움': ['청년희망키움', '청년주택'],
    '청년희망키움': ['청년희망키움'],
    '매입임대': ['청년매입임대', '매입임대'],
    '청년매입임대': ['청년매입임대'],
    '공공임대': ['공공임대'],
    
    # 주거비 지원
    '주거비': ['주거비', '주거급여'],
    '주거급여': ['주거급여', '청년주거급여'],
    '주거지원': ['주거지원', '주거급여'],
    '집세': ['주거급여', '주거비'],
    '월세지원': ['주거급여', '주거비'],
    
    # 자금 지원
    '대출': ['대출', '주거자금'],
    '자금': ['주거자금', '대출'],
    '도약계좌': ['청년도약계좌'],
    '청년도약계좌': ['청년도약계좌'],
    '주거자금': ['주거자금'],
    
    # 기타
    '부동산': ['부동산', '주택'],
    '정책': ['주거', '주택'],
    '지원': ['주거지원', '주거급여'],
    '혜택': ['주거지원', '주거급여'],
}

def extract_keywords_from_question(question: str) -> List[str]:
    """자연어 질문에서 키워드를 추출합니다."""
    extracted_keywords = set()
    
    # 1. 정확한 키워드 매칭
    for keyword in REAL_ESTATE_KEYWORDS:
        if keyword in question:
            extracted_keywords.add(keyword)
    
    # 2. 매핑 테이블을 통한 키워드 추출
    for word, keywords in KEYWORD_MAPPING.items():
        if word in question:
            extracted_keywords.update(keywords)
    
    # 3. 기본 키워드 추가 (매칭되는 키워드가 없는 경우)
    if not extracted_keywords:
        if any(word in question for word in ['전세', '전세자금', '전세보증금']):
            extracted_keywords.add('전세')
        elif any(word in question for word in ['임대', '월세', '임대료']):
            extracted_keywords.add('임대')
        elif any(word in question for word in ['주거', '집', '살 곳', '주택']):
            extracted_keywords.add('주거')
        elif any(word in question for word in ['청년주택', '희망키움']):
            extracted_keywords.add('청년주택')
        elif any(word in question for word in ['주거급여', '주거비', '주거지원']):
            extracted_keywords.add('주거급여')
        elif any(word in question for word in ['대출', '자금', '도약계좌']):
            extracted_keywords.add('대출')
    
    return list(extracted_keywords)[:5]  # 최대 5개 키워드

def categorize_keywords(keywords: List[str]) -> Dict[str, List[str]]:
    """키워드를 카테고리별로 분류합니다."""
    categories = {
        "주거_지원_정책": [],
        "전세_관련": [],
        "임대_관련": [],
        "주거비_지원": [],
        "자금_지원": [],
        "기타": []
    }
    
    for keyword in keywords:
        if keyword in ['청년주택', '청년희망키움', '청년매입임대', '공공임대', '매입임대']:
            categories["주거_지원_정책"].append(keyword)
        elif keyword in ['전세', '전세자금대출', '전세보증금']:
            categories["전세_관련"].append(keyword)
        elif keyword in ['임대', '임대료', '월세']:
            categories["임대_관련"].append(keyword)
        elif keyword in ['주거급여', '청년주거급여', '주거지원', '주거비']:
            categories["주거비_지원"].append(keyword)
        elif keyword in ['청년도약계좌', '주거자금', '대출']:
            categories["자금_지원"].append(keyword)
        else:
            categories["기타"].append(keyword)
    
    # 빈 카테고리 제거
    return {k: v for k, v in categories.items() if v}

# 전역 서비스 인스턴스 (실제로는 의존성 주입 사용)
# config.ini에서 API 키를 읽어옵니다
parser = configparser.ConfigParser()
config_path = Path(__file__).parent / "config.ini"
parser.read(config_path)
#parser.read("config.ini")
api_key = parser.get("youth_policy", "api_key", fallback="YOUR_API_KEY")
youth_policy_service = YouthPolicyService(api_key)

@router.post("/search", response_model=PolicySearchResponse)
async def search_youth_policy(request: PolicySearchRequest):
    """
    온통청년 API를 사용하여 청년정책을 검색합니다.
    
    사용 가능한 키워드:
    - 청년주택, 청년희망키움, 청년매입임대
    - 전세, 전세자금대출, 전세보증금
    - 임대, 임대료, 월세, 공공임대, 매입임대
    - 주거급여, 청년주거급여, 주거지원, 주거비
    - 청년도약계좌, 주거자금, 대출
    - 주거, 부동산, 주택
    """
    result = await youth_policy_service.search_policy(
        keyword=request.keyword,
        page_index=request.page_index,
        display=request.display
    )
    
    return PolicySearchResponse(**result)

@router.get("/search/{keyword}", response_model=PolicySearchResponse)
async def search_youth_policy_by_keyword(
    keyword: str,
    page_index: int = Query(1, ge=1, description="페이지 번호"),
    display: int = Query(10, ge=1, le=100, description="한 페이지당 결과 수")
):
    """
    URL 파라미터로 청년정책을 검색합니다.
    
    사용 가능한 키워드:
    - 청년주택, 청년희망키움, 청년매입임대
    - 전세, 전세자금대출, 전세보증금  
    - 임대, 임대료, 월세, 공공임대, 매입임대
    - 주거급여, 청년주거급여, 주거지원, 주거비
    - 청년도약계좌, 주거자금, 대출
    - 주거, 부동산, 주택
    """
    result = await youth_policy_service.search_policy(
        keyword=keyword,
        page_index=page_index,
        display=display
    )
    
    return PolicySearchResponse(**result)

@router.get("/keywords")
async def get_available_keywords():
    """사용 가능한 부동산 관련 키워드 목록을 반환합니다."""
    return {
        "categories": {
            "주거_지원_정책": [
                "청년주택", "청년희망키움", "청년매입임대", 
                "공공임대", "매입임대"
            ],
            "전세_관련": [
                "전세", "전세자금대출", "전세보증금"
            ],
            "임대_관련": [
                "임대", "임대료", "월세"
            ],
            "주거비_지원": [
                "주거급여", "청년주거급여", "주거지원", "주거비"
            ],
            "자금_지원": [
                "청년도약계좌", "주거자금", "대출"
            ],
            "기타": [
                "주거", "부동산", "주택"
            ]
        },
        "total_keywords": len(REAL_ESTATE_KEYWORDS)
    }

@router.post("/extract-keywords", response_model=KeywordExtractionResponse)
async def extract_keywords(request: KeywordExtractionRequest):
    """
    자연어 질문에서 부동산 관련 키워드를 추출합니다.
    
    프론트엔드에서 사용자가 자연어로 질문하면, 
    해당 질문에서 부동산 관련 키워드를 자동으로 추출하여 반환합니다.
    추출된 키워드는 /youth-policy/search 엔드포인트에서 사용할 수 있습니다.
    
    예시:
    - "전세자금이 부족해요" → ["전세", "전세자금대출"]
    - "월세 부담이 커요" → ["월세", "임대", "주거급여"]
    - "청년주택 신청하고 싶어요" → ["청년주택"]
    """
    extracted_keywords = extract_keywords_from_question(request.question)
    keyword_categories = categorize_keywords(extracted_keywords)
    
    # 추천 검색어 생성
    suggested_searches = []
    for keyword in extracted_keywords[:3]:  # 상위 3개 키워드만
        suggested_searches.append({
            "keyword": keyword,
            "search_url": f"/youth-policy/search/{keyword}"
        })
    
    return KeywordExtractionResponse(
        original_question=request.question,
        extracted_keywords=extracted_keywords,
        keyword_categories=keyword_categories,
        suggested_searches=suggested_searches
    )

