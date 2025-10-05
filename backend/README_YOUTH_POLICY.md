# 청년정책 API 통합 가이드

## 개요
이 프로젝트에 온통청년 OPEN API를 통합하여 부동산 관련 청년정책 정보를 게임 내 에이전트에게 제공하는 기능을 추가했습니다.

## 추가된 파일들

### 1. `server/router/youth_policy_handlers.py`
- 온통청년 API와 통신하는 엔드포인트들
- 부동산 관련 키워드 검색 기능
- 여러 키워드 동시 검색 지원

### 2. `server/services/real_estate_agent.py`
- 부동산 에이전트를 위한 정책 정보 처리 서비스
- 자연어 질문에서 키워드 추출
- 정책 정보를 프롬프트 컨텍스트로 변환

### 3. `config_example.ini`
- 청년정책 API 키 설정 예시

## API 엔드포인트

### 1. 자연어 질문으로 키워드 추출 (NEW! 🎉)
```bash
POST /youth-policy/extract-keywords
{
    "question": "전세자금이 부족한데 도움받을 수 있는 정책이 있나요?"
}

# 응답 예시
{
    "original_question": "전세자금이 부족한데 도움받을 수 있는 정책이 있나요?",
    "extracted_keywords": ["전세", "전세자금대출"],
    "keyword_categories": {
        "전세_관련": ["전세", "전세자금대출"]
    },
    "suggested_searches": [
        {"keyword": "전세", "search_url": "/youth-policy/search/전세"},
        {"keyword": "전세자금대출", "search_url": "/youth-policy/search/전세자금대출"}
    ]
}
```

### 2. 키워드로 직접 검색
```bash
# POST 방식
POST /youth-policy/search
{
    "keyword": "청년주택",
    "page_index": 1,
    "display": 10
}

# GET 방식
GET /youth-policy/search/청년주택?page_index=1&display=10
```

### 3. 사용 가능한 키워드 조회
```bash
GET /youth-policy/keywords
```

## 설정 방법

### 1. API 키 설정
`config.ini` 파일에 청년정책 API 키를 추가하세요:

```ini
[youth_policy]
api_key = your_actual_api_key_here
base_url = https://www.youthcenter.go.kr/opi/youthPlcyList.do
```

### 2. 코드에서 API 키 사용
`youth_policy_handlers.py`와 `session_handlers.py`에서 `"YOUR_API_KEY"`를 실제 API 키로 교체하세요.

## 사용 가능한 키워드

### 주거 지원 정책
- 청년주택, 청년희망키움, 청년매입임대, 공공임대, 매입임대

### 전세 관련
- 전세, 전세자금대출, 전세보증금

### 임대 관련
- 임대, 임대료, 월세

### 주거비 지원
- 주거급여, 청년주거급여, 주거지원, 주거비

### 자금 지원
- 청년도약계좌, 주거자금, 대출

### 기타
- 주거, 부동산, 주택

## 게임 내 사용법

### 방법 1: 키워드 추출 후 개별 검색
```javascript
// 1단계: 키워드 추출
const keywordResponse = await fetch('/youth-policy/extract-keywords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        question: "월세 부담이 커서 도움이 필요해요"
    })
});

const keywordResult = await keywordResponse.json();
// keywordResult.extracted_keywords: ["월세", "임대", "주거급여"]

// 2단계: 추출된 키워드로 개별 검색
for (const keyword of keywordResult.extracted_keywords) {
    const searchResponse = await fetch(`/youth-policy/search/${keyword}`);
    const searchResult = await searchResponse.json();
    // 각 키워드별 정책 정보 처리
}
```

### 방법 2: 게임 내 자동 사용
게임에서 부동산 조언 에이전트를 생성할 때, 에이전트 이름을 다음 중 하나로 설정하세요:
- `real_estate_advisor`
- `부동산조언사`
- `real_estate_agent`

해당 에이전트와 채팅할 때, 시스템이 자동으로:
1. 사용자 질문에서 키워드 추출
2. 온통청년 API로 관련 정책 검색
3. 검색된 정책 정보를 에이전트 프롬프트에 주입
4. 정책 정보를 바탕으로 정확한 조언 제공

## 예시 사용 시나리오

### 사용자 질문
"전세자금이 부족한데 도움받을 수 있는 정책이 있나요?"

### 시스템 처리
1. 키워드 추출: "전세", "전세자금대출"
2. API 검색: 전세 관련 정책들 검색
3. 컨텍스트 생성: 검색된 정책 정보를 프롬프트에 추가
4. 에이전트 응답: 구체적인 정책 정보와 신청 방법 안내

## 주의사항

1. **API 키 보안**: 실제 API 키는 환경변수나 안전한 설정 파일에 저장하세요.
2. **에러 처리**: API 호출 실패 시 기본 채팅 기능은 정상 작동합니다.
3. **키워드 매핑**: 새로운 키워드가 필요하면 `REAL_ESTATE_KEYWORDS` 리스트에 추가하세요.
4. **성능**: API 호출로 인한 지연이 있을 수 있으니 적절한 타임아웃을 설정하세요.

## 확장 가능성

1. **벡터 스토어 통합**: 로컬 벡터 스토어를 구축하여 더 정교한 의미 검색 구현
2. **캐싱**: Redis를 활용한 정책 정보 캐싱으로 성능 향상
3. **다른 정책 영역**: 취업, 교육 등 다른 청년정책 영역으로 확장
4. **실시간 업데이트**: 정책 정보의 실시간 업데이트 기능
