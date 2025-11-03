import httpx
import asyncio
import configparser
import os
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

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
    keyword: Optional[str] = None  # 키워드를 선택적으로 받을 수 있도록 변경
    page_index: int = 1
    display: int = 10

class PolicySearchResponse(BaseModel):
    keyword: Optional[str] = ""  # 키워드가 없을 수 있으므로 Optional로 변경
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
    def __init__(self, api_key: str, redirect_uri: Optional[str] = None):
        self.api_key = api_key
        self.redirect_uri = redirect_uri
        # 온통청년 API 엔드포인트 (공식 문서 기준)
        # 참고: https://www.youthcenter.go.kr/cmnFooter/openapiIntro/oaiDoc
        # 중요: HTTPS 프로토콜 사용 필수
        # 실제 API 엔드포인트: /go/ythip/getPlcy (요청 예시 기준)
        self.base_url = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
        
        # HTTPS 프로토콜 확인
        if not self.base_url.startswith("https://"):
            raise ValueError("온통청년 API는 HTTPS 프로토콜을 사용해야 합니다.")
        
        # redirect_uri가 설정된 경우 HTTPS 확인
        if self.redirect_uri and not self.redirect_uri.startswith("https://"):
            raise ValueError("redirect_uri는 HTTPS 프로토콜을 사용해야 합니다.")
    
    async def search_policy(
        self, 
        keyword: Optional[str] = None, 
        page_index: Optional[int] = None, 
        display: Optional[int] = None,
        query: Optional[str] = None,
        biz_tycd_sel: Optional[str] = None,
        srch_poly_biz_secd: Optional[str] = None,
        lclsf_nm: Optional[str] = None,
        mclsf_nm: Optional[str] = None
    ) -> Dict:
        """
        온통청년 API로 정책 검색
        공식 문서: https://www.youthcenter.go.kr/cmnFooter/openapiIntro/oaiDoc
        
        파라미터:
        - apiKeyNm (String, 필수): 발급받은 인증키(마이페이지 > OPEN API에서 확인)
        - pageNum (Number, 선택): 페이지번호
        - pageSize (Number, 선택): 페이지사이즈
        - rtnType (String, 선택): 호출문서 형식 (xml / json)
        - plcyKywdNm (String, 선택): 정책키워드명 (요청형식: "키워드1,키워드2,...")
        - plcyNm (String, 선택): 정책명
        - plcyExplnCn (String, 선택): 정책설명
        - zipCd (String, 선택): 법정시군구코드(5자리, 요청형식: "11000,11330,...")
        - lclsfNm (String, 선택): 정책대분류명 (요청형식: "대분류1,대분류2,...")
        - mclsfNm (String, 선택): 정책중분류명 (요청형식: "중분류1,중분류2,...")
        - pageType (String, 선택): 화면유형 (1: 목록, 2: 상세)
        - plcyNo (String, 선택): 정책번호
        """
        # API 키 유효성 검사
        if not self.api_key or self.api_key == "YOUR_API_KEY" or not self.api_key.strip():
            raise HTTPException(
                status_code=400, 
                detail="API 키가 설정되지 않았습니다. config.ini 파일의 [youth_policy] 섹션에 api_key를 설정해주세요."
            )
        
        # 디버깅: API 키 확인 (마스킹)
        masked_key = self.api_key[:8] + "..." if len(self.api_key) > 8 else "***"
        print(f"[YouthPolicy] API 호출 시작 - 키: {masked_key}, 키워드: {keyword}")
        
        # 온통청년 API 파라미터 (실제 API 문서 기준)
        # 참고: https://www.youthcenter.go.kr/cmnFooter/openapiIntro/oaiDoc
        params = {
            "apiKeyNm": self.api_key,  # 필수: API 인증키
        }
        
        # 선택적 파라미터 추가
        # page_index와 display가 없으면 API 기본값 사용 (전체 조회)
        # 하지만 API가 기본값을 제공하지 않을 수 있으므로, 명시적으로 큰 값을 설정하여 전체를 가져오도록 시도
        if page_index is not None:
            params["pageNum"] = page_index
        else:
            params["pageNum"] = 1  # 기본값: 첫 페이지
        
        if display is not None:
            params["pageSize"] = display
        else:
            # display가 없으면 큰 값으로 설정하여 가능한 한 많은 데이터 가져오기
            params["pageSize"] = 100  # API 최대값
        
        # 응답 형식 (기본값: json)
        params["rtnType"] = "json"
        
        # 검색 파라미터: 여러 검색 방법을 시도
        # 1. plcyKywdNm: 정책키워드명 (요청형식: "키워드1,키워드2,...")
        # 2. plcyNm: 정책명 (부분 검색 가능할 수도)
        # 3. plcyExplnCn: 정책설명 (부분 검색 가능할 수도)
        
        # 키워드 확장 매핑 (단일 키워드를 여러 관련 키워드로 확장)
        keyword_expansions = {
            "전세": "전세,전세자금대출,전세보증금",
            "임대": "임대,월세,공공임대",
            "주거": "주거,주거급여,청년주거급여,주거지원",
            "주택": "주택,청년주택,청년희망키움",
        }
        
        # 검색 키워드 결정 (keyword 또는 query 사용)
        search_keyword = keyword or query
        
        if search_keyword:
            # 키워드 정규화 (공백 제거, 앞뒤 공백 제거)
            search_keyword = search_keyword.strip()
            
            # 키워드 확장 확인 (확장 가능한 키워드인지 체크)
            if search_keyword in keyword_expansions:
                expanded_keyword = keyword_expansions[search_keyword]
                params["plcyKywdNm"] = expanded_keyword
                print(f"[YouthPolicy] 키워드 확장: '{search_keyword}' -> '{expanded_keyword}'")
            else:
                # 확장 불가능한 키워드는 그대로 사용
                params["plcyKywdNm"] = search_keyword
                print(f"[YouthPolicy] 키워드 직접 사용: '{search_keyword}'")
        else:
            # 키워드가 없으면 전체 목록 조회
            print(f"[YouthPolicy] 키워드 없음 - 전체 정책 목록 조회")
        
        # lclsfNm (정책대분류명) 파라미터 추가
        # 요청형식: "대분류1,대분류2,..."
        if lclsf_nm:
            params["lclsfNm"] = lclsf_nm
            print(f"[YouthPolicy] lclsfNm 파라미터 추가: {lclsf_nm}")
        
        # mclsfNm (정책중분류명) 파라미터 추가
        # 요청형식: "중분류1,중분류2,..."
        if mclsf_nm:
            # 띄어쓰기가 포함된 값도 올바르게 처리되도록 확인
            import urllib.parse
            print(f"[YouthPolicy] ========== mclsfNm 파라미터 처리 ==========")
            print(f"[YouthPolicy] 원본 mclsf_nm: '{mclsf_nm}'")
            print(f"[YouthPolicy] 띄어쓰기 포함: {'예' if ' ' in mclsf_nm else '아니오'}")
            print(f"[YouthPolicy] URL 인코딩 전: '{mclsf_nm}'")
            print(f"[YouthPolicy] URL 인코딩 후: '{urllib.parse.quote(mclsf_nm)}'")
            params["mclsfNm"] = mclsf_nm
            print(f"[YouthPolicy] params['mclsfNm'] 설정 완료: '{params['mclsfNm']}'")
            print(f"[YouthPolicy] ==========================================")
        
        # 기타 선택적 파라미터는 현재 사용하지 않음
        # 필요시 추가 가능:
        # - plcyNm: 정책명
        # - plcyExplnCn: 정책설명
        # - zipCd: 법정시군구코드 (콤마로 구분)
        # - lclsfNm: 정책대분류명 (콤마로 구분)
        # - mclsfNm: 정책중분류명 (콤마로 구분)
        # - pageType: 화면유형 (1: 목록, 2: 상세)
        # - plcyNo: 정책번호
        
        # 디버깅: 실제 요청 URL 확인 (API 키는 마스킹)
        import urllib.parse
        params_str = "&".join([f"{k}={urllib.parse.quote(str(v)) if k != 'apiKeyNm' else masked_key}" for k, v in params.items()])
        request_url = f"{self.base_url}?{params_str}"
        print(f"[YouthPolicy] 요청 URL (마스킹): {request_url}")
        print(f"[YouthPolicy] 실제 파라미터: {params}")
        
        # 실제 URL 구성 (디버깅용 - API 키 포함)
        actual_params_str = "&".join([f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items()])
        actual_url = f"{self.base_url}?{actual_params_str}"
        print(f"[YouthPolicy] 실제 요청 URL: {actual_url[:200]}...")  # 처음 200자만 출력
        
        try:
            # 온통청년 API 헤더 설정
            # HTTPS 프로토콜 필수, 브라우저와 유사한 헤더 사용
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://www.youthcenter.go.kr/",
                "Origin": "https://www.youthcenter.go.kr",
                "Connection": "keep-alive",
                "Cache-Control": "no-cache",
            }
            
            async with httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=False,  # 리다이렉트를 수동으로 처리
                verify=True,  # SSL 검증 필수
                limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),  # 과도한 호출 방지
            ) as client:
                # GET 방식으로 요청 (온통청년 API는 GET 방식 사용)
                print(f"[YouthPolicy] HTTPS GET 요청 시작")
                
                # 디버깅: params에 포함된 mclsfNm 확인
                import urllib.parse
                if "mclsfNm" in params:
                    print(f"[YouthPolicy] ========== API 요청 전 mclsfNm 확인 ==========")
                    print(f"[YouthPolicy] params['mclsfNm'] 값: '{params['mclsfNm']}'")
                    print(f"[YouthPolicy] params['mclsfNm'] 타입: {type(params['mclsfNm'])}")
                    print(f"[YouthPolicy] params['mclsfNm'] URL 인코딩 (quote): '{urllib.parse.quote(str(params['mclsfNm']))}'")
                    print(f"[YouthPolicy] params['mclsfNm'] URL 인코딩 (quote_plus): '{urllib.parse.quote_plus(str(params['mclsfNm']))}'")
                    print(f"[YouthPolicy] ==============================================")
                
                # httpx는 query parameter를 인코딩할 때 공백을 +로 변환합니다.
                # 하지만 온통청년 API는 띄어쓰기가 포함된 mclsfNm을 처리할 때 %20을 기대하는 것 같습니다.
                # 온통청년 API의 mclsfNm 검색이 제대로 동작하지 않는 것으로 보이므로,
                # mclsfNm이 있는 경우, API에 mclsfNm 파라미터를 보내되, 응답에서 클라이언트 측 필터링도 수행합니다.
                use_client_filtering = "mclsfNm" in params
                request_params = params.copy()
                
                if use_client_filtering:
                    # mclsfNm을 제외한 파라미터로 먼저 요청 (API가 mclsfNm을 지원하지 않을 수 있음)
                    request_params.pop("mclsfNm", None)
                    search_mclsf_nm = params["mclsfNm"]
                    print(f"[YouthPolicy] 주의: mclsfNm 검색은 클라이언트 측 필터링을 사용합니다: '{search_mclsf_nm}'")
                
                if use_client_filtering and search_mclsf_nm:
                    # mclsfNm을 포함한 URL 직접 구성 (%20 인코딩)
                    encoded_params = []
                    for key, value in request_params.items():
                        encoded_value = urllib.parse.quote(str(value), safe='')
                        encoded_params.append(f"{urllib.parse.quote(key, safe='')}={encoded_value}")
                    
                    # mclsfNm도 추가
                    mclsf_encoded = urllib.parse.quote(search_mclsf_nm, safe='')
                    encoded_params.append(f"mclsfNm={mclsf_encoded}")
                    
                    query_string = "&".join(encoded_params)
                    final_url = f"{self.base_url}?{query_string}"
                    print(f"[YouthPolicy] 수동 구성 URL (띄어쓰기 %20 인코딩): {final_url[:300]}...")
                    response = await client.get(final_url, headers=headers)
                else:
                    # 일반적인 경우
                    response = await client.get(self.base_url, params=request_params, headers=headers)
                print(f"[YouthPolicy] 응답 상태: {response.status_code}")
                
                # 요청 정보 로깅
                print(f"[YouthPolicy] 최종 요청 URL: {response.url}")
                if "mclsfNm" in params:
                    print(f"[YouthPolicy] 최종 요청 URL에 mclsfNm 포함 여부: {'포함' if 'mclsfNm' in str(response.url) else '미포함'}")
                    # URL에서 mclsfNm 파라미터 값 추출 시도
                    if 'mclsfNm=' in str(response.url):
                        import urllib.parse
                        url_str = str(response.url)
                        mclsf_start = url_str.find('mclsfNm=')
                        if mclsf_start != -1:
                            mclsf_part = url_str[mclsf_start:].split('&')[0]
                            if '=' in mclsf_part:
                                encoded_value = mclsf_part.split('=', 1)[1]
                                decoded_value = urllib.parse.unquote(encoded_value)
                                print(f"[YouthPolicy] 최종 요청 URL에서 추출한 mclsfNm (디코딩): '{decoded_value}'")
                print(f"[YouthPolicy] 요청 헤더: {dict(headers)}")
                print(f"[YouthPolicy] 응답 헤더: {dict(response.headers)}")
                
                # 302 리다이렉트 응답 처리
                if response.status_code == 302:
                    location = response.headers.get("Location", "")
                    print(f"[YouthPolicy] 302 리다이렉트 감지 - Location: {location}")
                    print(f"[YouthPolicy] 응답 헤더 전체: {dict(response.headers)}")
                    
                    # 응답 본문 확인 (혹시 에러 메시지가 있는지)
                    try:
                        response_text = response.text[:500] if len(response.text) > 500 else response.text
                        print(f"[YouthPolicy] 302 응답 본문 (처음 500자): {response_text}")
                    except:
                        pass
                    
                    # 리다이렉트 위치 분석
                    location_lower = location.lower()
                    
                    # 리다이렉트 위치가 유효하지 않은 경우 (포트 8080, 에러 페이지 등)
                    if ":8080" in location_lower or location_lower.endswith("/") or not location_lower.startswith("http"):
                        # 302 리다이렉트 원인 분석
                        error_detail = self._analyze_redirect_error(location, response.headers, response.status_code, masked_key, params)
                        
                        raise HTTPException(
                            status_code=400,
                            detail=error_detail
                        )
                    
                    # 유효한 리다이렉트인 경우 (정상적인 API 응답으로 이어지는 경우)
                    # 일반적으로 온통청년 API는 이런 경우가 없지만, 만약을 대비
                    print(f"[YouthPolicy] 유효한 리다이렉트 감지 - Location: {location}")
                    # 리다이렉트를 따라가서 최종 응답 확인
                    try:
                        redirect_response = await client.get(location, headers=headers, follow_redirects=True, timeout=30.0)
                        if redirect_response.status_code == 200:
                            response = redirect_response
                            print(f"[YouthPolicy] 리다이렉트 후 성공 응답 받음")
                        else:
                            # 리다이렉트 후에도 실패
                            raise HTTPException(
                                status_code=400,
                                detail=f"리다이렉트 후에도 요청 실패 (HTTP {redirect_response.status_code})"
                            )
                    except httpx.RequestError as e:
                        raise HTTPException(
                            status_code=400,
                            detail=f"리다이렉트 위치로 연결 실패: {str(e)}"
                        )
                
                print(f"[YouthPolicy] 최종 응답 상태 코드: {response.status_code}")
                print(f"[YouthPolicy] 최종 응답 URL: {response.url}")
                print(f"[YouthPolicy] 최종 응답 Content-Type: {response.headers.get('content-type', 'N/A')}")
                
                # 성공 응답 (200 OK)
                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "").lower()
                    
                    # JSON 응답 처리
                    if "application/json" in content_type or "json" in content_type:
                        try:
                            data = response.json()
                            # 디버깅: API 응답 구조 상세 확인
                            print(f"[YouthPolicy] ========== API 응답 상세 정보 ==========")
                            print(f"[YouthPolicy] 응답 타입: {type(data)}")
                            if isinstance(data, dict):
                                print(f"[YouthPolicy] 응답 키 목록: {list(data.keys())}")
                                for key, value in data.items():
                                    if isinstance(value, dict):
                                        print(f"[YouthPolicy]   '{key}' (dict): 키={list(value.keys())}")
                                        if "pagging" in value:
                                            print(f"[YouthPolicy]     pagging: {value['pagging']}")
                                        if "youthPolicyList" in value:
                                            print(f"[YouthPolicy]     youthPolicyList: {len(value['youthPolicyList'])}개 항목")
                                            if len(value['youthPolicyList']) > 0:
                                                print(f"[YouthPolicy]     첫 번째 항목: {str(value['youthPolicyList'][0])[:300]}")
                                    elif isinstance(value, list):
                                        print(f"[YouthPolicy]   '{key}' (list): {len(value)}개 항목")
                                        if len(value) > 0:
                                            print(f"[YouthPolicy]     첫 번째 항목: {str(value[0])[:300]}")
                                    else:
                                        print(f"[YouthPolicy]   '{key}': {value}")
                            else:
                                print(f"[YouthPolicy] 응답 전체 (처음 1000자): {str(data)[:1000]}")
                            print(f"[YouthPolicy] =========================================")
                        except Exception as e:
                            print(f"[YouthPolicy] JSON 파싱 실패: {e}")
                            print(f"[YouthPolicy] 응답 본문 (처음 500자): {response.text[:500]}")
                            raise HTTPException(
                                status_code=500,
                                detail=f"API 응답을 JSON으로 파싱할 수 없습니다. 오류: {str(e)}"
                            )
                    # HTML 응답인 경우 (에러 페이지일 수 있음)
                    elif "text/html" in content_type:
                        body_preview = response.text[:1000] if len(response.text) > 1000 else response.text
                        print(f"[YouthPolicy] HTML 응답 본문 (전체 또는 일부):\n{body_preview}")
                        raise HTTPException(
                            status_code=400,
                            detail=f"온통청년 API가 HTML 페이지를 반환했습니다.\n"
                                   f"API 호출은 성공했지만 응답 형식이 예상과 다릅니다.\n"
                                   f"서버 콘솔의 '[YouthPolicy] HTML 응답 본문' 로그를 확인해주세요."
                        )
                    # 기타 응답 형식
                    else:
                        print(f"[YouthPolicy] 예상치 못한 응답 형식: {content_type}")
                        print(f"[YouthPolicy] 응답 본문 (처음 500자): {response.text[:500]}")
                        raise HTTPException(
                            status_code=500,
                            detail=f"예상치 못한 응답 형식입니다. (Content-Type: {content_type})"
                        )
                
                # 에러 응답
                else:
                    response.raise_for_status()
                    # 위 코드가 예외를 발생시키지 않으면 여기 도달하지 않음
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"API 요청 실패 (HTTP {response.status_code})"
                    )
                
                # API 응답 구조 확인 및 적절한 필드 추출
                # 실제 응답 구조: { "resultCode": 200, "resultMessage": "...", "result": { "pagging": { "totCount": 0, ... }, "youthPolicyList": [] } }
                total_count = 0
                policies = []
                
                # 디버깅: mclsfNm으로 검색했는데 결과가 없을 때, 실제 데이터의 mclsfNm 값 확인
                if "mclsfNm" in params and isinstance(data, dict):
                    # 전체 정책을 한 번 더 가져와서 실제 mclsfNm 값 확인
                    print(f"[YouthPolicy] ========== mclsfNm 검색 결과 분석 ==========")
                    print(f"[YouthPolicy] 검색한 mclsfNm: '{params['mclsfNm']}'")
                    # 전체 정책 목록을 가져와서 mclsfNm 값 확인
                    try:
                        debug_params = {
                            "apiKeyNm": self.api_key,
                            "pageNum": 1,
                            "pageSize": 10,  # 샘플로 10개만
                            "rtnType": "json"
                        }
                        debug_response = await client.get(self.base_url, params=debug_params, headers=headers)
                        if debug_response.status_code == 200:
                            debug_data = debug_response.json()
                            if isinstance(debug_data, dict) and "result" in debug_data:
                                debug_result = debug_data["result"]
                                if isinstance(debug_result, dict) and "youthPolicyList" in debug_result:
                                    debug_policies = debug_result["youthPolicyList"]
                                    print(f"[YouthPolicy] 샘플 정책 {len(debug_policies)}개에서 mclsfNm 확인:")
                                    sample_mclsf_nm = set()
                                    for p in debug_policies[:10]:
                                        if isinstance(p, dict):
                                            mclsf = p.get("mclsfNm")
                                            if mclsf:
                                                sample_mclsf_nm.add(str(mclsf))
                                    if sample_mclsf_nm:
                                        print(f"[YouthPolicy] 샘플 데이터의 mclsfNm 값들: {sorted(sample_mclsf_nm)}")
                                        search_value = params['mclsfNm']
                                        exact_matches = [v for v in sample_mclsf_nm if v == search_value]
                                        partial_matches = [v for v in sample_mclsf_nm if search_value in v or v in search_value]
                                        print(f"[YouthPolicy] 정확 일치: {exact_matches}")
                                        print(f"[YouthPolicy] 부분 일치: {partial_matches}")
                    except Exception as e:
                        print(f"[YouthPolicy] 디버깅 중 오류: {e}")
                    print(f"[YouthPolicy] ==============================================")
                
                if isinstance(data, dict):
                    # 온통청년 API 실제 응답 구조 처리
                    if "result" in data and isinstance(data["result"], dict):
                        result = data["result"]
                        
                        # pagging 정보에서 totCount 추출
                        if "pagging" in result and isinstance(result["pagging"], dict):
                            total_count = result["pagging"].get("totCount", result["pagging"].get("totalCount", 0))
                        
                        # youthPolicyList에서 정책 목록 추출
                        if "youthPolicyList" in result:
                            policies = result["youthPolicyList"]
                        elif "items" in result:
                            policies = result["items"]
                        elif "list" in result:
                            policies = result["list"]
                        elif "data" in result:
                            policies = result["data"]
                    
                    # 기타 가능한 응답 구조 (하위 호환성)
                    elif "totalCount" in data:
                        total_count = data.get("totalCount", 0)
                        policies = data.get("items", data.get("item", []))
                    elif "count" in data:
                        total_count = data.get("count", 0)
                        policies = data.get("data", data.get("list", []))
                    elif "total" in data:
                        total_count = data.get("total", 0)
                        policies = data.get("policies", data.get("policy", []))
                    else:
                        # 응답의 모든 키 확인 (디버깅용)
                        print(f"[YouthPolicy] 응답 구조 분석:")
                        for key, value in data.items():
                            if isinstance(value, (int, float)):
                                print(f"[YouthPolicy]   숫자 필드 '{key}': {value}")
                            elif isinstance(value, list):
                                print(f"[YouthPolicy]   리스트 필드 '{key}': 길이 {len(value)}")
                                if len(value) > 0:
                                    print(f"[YouthPolicy]   첫 번째 항목 예시: {str(value[0])[:200]}")
                            elif isinstance(value, dict):
                                print(f"[YouthPolicy]   딕셔너리 필드 '{key}': {list(value.keys())}")
                        
                        # 리스트 필드가 있으면 그것을 사용
                        for key, value in data.items():
                            if isinstance(value, list):
                                policies = value
                                total_count = len(value)
                                print(f"[YouthPolicy] '{key}' 필드를 policies로 사용: {total_count}개 항목")
                                break
                
                # resultCode 확인
                result_code = data.get("resultCode", 200) if isinstance(data, dict) else 200
                result_message = data.get("resultMessage", "") if isinstance(data, dict) else ""
                
                print(f"[YouthPolicy] resultCode: {result_code}, resultMessage: {result_message}")
                print(f"[YouthPolicy] 추출된 결과: total_count={total_count}, policies 개수={len(policies)}")
                
                # resultCode가 200이 아니면 경고
                if result_code != 200:
                    print(f"[YouthPolicy] 경고: API 응답 코드가 200이 아닙니다: {result_code}, 메시지: {result_message}")
                
                # mclsfNm으로 검색했는데 결과가 없으면, 클라이언트 측에서 필터링 시도
                if mclsf_nm and total_count == 0 and len(policies) == 0:
                    print(f"[YouthPolicy] ========== 클라이언트 측 필터링 시작 ==========")
                    print(f"[YouthPolicy] API에서 mclsfNm '{mclsf_nm}' 검색 결과가 없음. 클라이언트 측 필터링 시도...")
                    
                    try:
                        # 전체 정책을 가져와서 클라이언트 측에서 필터링
                        all_policies = []
                        max_pages = 50  # 최대 50페이지 (5000개)
                        page_num = 1
                        page_size = 100
                        
                        while page_num <= max_pages:
                            filter_params = {
                                "apiKeyNm": self.api_key,
                                "pageNum": page_num,
                                "pageSize": page_size,
                                "rtnType": "json"
                            }
                            
                            filter_response = await client.get(self.base_url, params=filter_params, headers=headers)
                            if filter_response.status_code != 200:
                                break
                            
                            filter_data = filter_response.json()
                            if not isinstance(filter_data, dict) or "result" not in filter_data:
                                break
                            
                            filter_result = filter_data["result"]
                            if not isinstance(filter_result, dict) or "youthPolicyList" not in filter_result:
                                break
                            
                            page_policies = filter_result["youthPolicyList"]
                            if not page_policies:
                                break
                            
                            # mclsfNm으로 필터링
                            for policy in page_policies:
                                if isinstance(policy, dict):
                                    policy_mclsf = policy.get("mclsfNm", "")
                                    # 정확 일치 또는 부분 일치
                                    if policy_mclsf == mclsf_nm or mclsf_nm in str(policy_mclsf) or str(policy_mclsf) in mclsf_nm:
                                        all_policies.append(policy)
                            
                            if len(page_policies) < page_size:
                                break
                            
                            page_num += 1
                        
                        if all_policies:
                            policies = all_policies
                            total_count = len(all_policies)
                            print(f"[YouthPolicy] 클라이언트 측 필터링 성공: {len(all_policies)}개 정책 발견")
                        else:
                            print(f"[YouthPolicy] 클라이언트 측 필터링 결과: 0개 정책")
                    except Exception as e:
                        print(f"[YouthPolicy] 클라이언트 측 필터링 중 오류: {e}")
                    
                    print(f"[YouthPolicy] ==============================================")
                
                # 반환할 키워드 결정 (원본 keyword, lclsf_nm, mclsf_nm 또는 search_keyword)
                return_keyword = keyword or query or lclsf_nm or mclsf_nm or ""
                
                # 최종 결과 로그
                print(f"[YouthPolicy] ========== 최종 검색 결과 ==========")
                if lclsf_nm:
                    print(f"[YouthPolicy] 검색 대주제: {lclsf_nm}")
                elif mclsf_nm:
                    print(f"[YouthPolicy] 검색 중주제: {mclsf_nm}")
                else:
                    print(f"[YouthPolicy] 검색 키워드: {return_keyword}")
                print(f"[YouthPolicy] 총 개수: {total_count}")
                print(f"[YouthPolicy] 반환할 정책 개수: {len(policies)}")
                if len(policies) > 0:
                    print(f"[YouthPolicy] 첫 번째 정책 키: {list(policies[0].keys()) if isinstance(policies[0], dict) else 'Not a dict'}")
                print(f"[YouthPolicy] =====================================")
                
                return {
                    "keyword": return_keyword,
                    "total_count": total_count,
                    "policies": policies,
                    "search_url": str(response.url)
                }
                
        except httpx.HTTPStatusError as e:
            # 302 리다이렉트 에러 처리
            if e.response.status_code == 302:
                location = e.response.headers.get("Location", "")
                raise HTTPException(
                    status_code=400,
                    detail=f"API 키가 유효하지 않거나 인증에 실패했습니다. "
                           f"온통청년 포털에서 발급받은 유효한 API 키를 사용해주세요. "
                           f"(리다이렉트 위치: {location})"
                )
            # 기타 HTTP 에러
            raise HTTPException(
                status_code=e.response.status_code, 
                detail=f"API 요청 실패 (HTTP {e.response.status_code}): {str(e)}"
            )
        except httpx.HTTPError as e:
            # 네트워크 오류 등
            raise HTTPException(status_code=500, detail=f"API 요청 실패: {str(e)}")
        except HTTPException:
            # 이미 처리된 HTTPException은 그대로 전달
            raise
        except ValueError as e:
            # JSON 파싱 오류
            raise HTTPException(
                status_code=500,
                detail=f"API 응답을 파싱할 수 없습니다. API 키를 확인해주세요. 오류: {str(e)}"
            )
        except Exception as e:
            # 기타 예상치 못한 오류
            raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")
    
    async def get_all_policies_keywords(self) -> List[str]:
        """
        모든 정책을 조회하여 plcyKywdNm 필드의 unique 키워드 리스트를 반환합니다.
        """
        all_keywords = set()
        page_size = 100  # 최대 페이지 사이즈
        page_num = 1
        total_fetched = 0
        
        print(f"[YouthPolicy] 전체 정책에서 키워드 추출 시작...")
        
        while True:
            try:
                # 한 페이지씩 조회
                result = await self.search_policy(
                    keyword=None,
                    page_index=page_num,
                    display=page_size
                )
                
                policies = result.get("policies", [])
                total_count = result.get("total_count", 0)
                
                if not policies:
                    print(f"[YouthPolicy] 페이지 {page_num}: 정책이 없음, 중단")
                    break
                
                # 각 정책에서 plcyKywdNm 추출
                for policy in policies:
                    if isinstance(policy, dict):
                        plcy_kywd_nm = policy.get("plcyKywdNm")
                        
                        if plcy_kywd_nm:
                            # plcyKywdNm이 콤마로 구분된 여러 키워드일 수 있음
                            keywords = [k.strip() for k in str(plcy_kywd_nm).split(",") if k.strip()]
                            all_keywords.update(keywords)
                
                total_fetched += len(policies)
                print(f"[YouthPolicy] 페이지 {page_num}: {len(policies)}개 정책 처리, 누적: {total_fetched}개, 수집된 키워드: {len(all_keywords)}개")
                
                # 더 이상 가져올 정책이 없으면 중단
                if total_fetched >= total_count or len(policies) < page_size:
                    print(f"[YouthPolicy] 모든 페이지 조회 완료: 총 {total_fetched}개 정책, {len(all_keywords)}개 unique 키워드")
                    break
                
                page_num += 1
                
                # 무한 루프 방지 (최대 100페이지)
                if page_num > 100:
                    print(f"[YouthPolicy] 경고: 최대 페이지 수(100) 도달, 중단")
                    break
                    
                # API 호출 제한을 위해 약간의 딜레이
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"[YouthPolicy] 페이지 {page_num} 조회 중 오류: {str(e)}")
                break
        
        # 정렬된 리스트로 반환
        sorted_keywords = sorted(list(all_keywords))
        print(f"[YouthPolicy] 키워드 추출 완료: {len(sorted_keywords)}개 unique 키워드")
        
        return sorted_keywords
    
    async def get_all_policies_lclsf_nm(self) -> List[str]:
        """
        모든 정책을 조회하여 lclsfNm 필드의 unique 키워드 리스트를 반환합니다.
        """
        all_lclsf_nm = set()
        page_size = 100  # 최대 페이지 사이즈
        page_num = 1
        total_fetched = 0
        
        print(f"[YouthPolicy] 전체 정책에서 lclsfNm 추출 시작...")
        
        while True:
            try:
                # 한 페이지씩 조회
                result = await self.search_policy(
                    keyword=None,
                    page_index=page_num,
                    display=page_size
                )
                
                policies = result.get("policies", [])
                total_count = result.get("total_count", 0)
                
                if not policies:
                    print(f"[YouthPolicy] 페이지 {page_num}: 정책이 없음, 중단")
                    break
                
                # 각 정책에서 lclsfNm 추출
                for policy in policies:
                    if isinstance(policy, dict):
                        lclsf_nm = policy.get("lclsfNm")
                        
                        if lclsf_nm:
                            # lclsfNm이 콤마로 구분된 여러 키워드일 수 있음
                            keywords = [k.strip() for k in str(lclsf_nm).split(",") if k.strip()]
                            all_lclsf_nm.update(keywords)
                
                total_fetched += len(policies)
                print(f"[YouthPolicy] 페이지 {page_num}: {len(policies)}개 정책 처리, 누적: {total_fetched}개, 수집된 lclsfNm: {len(all_lclsf_nm)}개")
                
                # 더 이상 가져올 정책이 없으면 중단
                if total_fetched >= total_count or len(policies) < page_size:
                    print(f"[YouthPolicy] 모든 페이지 조회 완료: 총 {total_fetched}개 정책, {len(all_lclsf_nm)}개 unique lclsfNm")
                    break
                
                page_num += 1
                
                # 무한 루프 방지 (최대 100페이지)
                if page_num > 100:
                    print(f"[YouthPolicy] 경고: 최대 페이지 수(100) 도달, 중단")
                    break
                    
                # API 호출 제한을 위해 약간의 딜레이
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"[YouthPolicy] 페이지 {page_num} 조회 중 오류: {str(e)}")
                break
        
        # 정렬된 리스트로 반환
        sorted_lclsf_nm = sorted(list(all_lclsf_nm))
        print(f"[YouthPolicy] lclsfNm 추출 완료: {len(sorted_lclsf_nm)}개 unique lclsfNm")
        
        return sorted_lclsf_nm
    
    async def get_all_policies_mclsf_nm(self) -> List[str]:
        """
        모든 정책을 조회하여 mclsfNm 필드의 unique 키워드 리스트를 반환합니다.
        """
        all_mclsf_nm = set()
        page_size = 100  # 최대 페이지 사이즈
        page_num = 1
        total_fetched = 0
        
        print(f"[YouthPolicy] 전체 정책에서 mclsfNm 추출 시작...")
        
        while True:
            try:
                # 한 페이지씩 조회
                result = await self.search_policy(
                    keyword=None,
                    page_index=page_num,
                    display=page_size
                )
                
                policies = result.get("policies", [])
                total_count = result.get("total_count", 0)
                
                if not policies:
                    print(f"[YouthPolicy] 페이지 {page_num}: 정책이 없음, 중단")
                    break
                
                # 각 정책에서 mclsfNm 추출
                for policy in policies:
                    if isinstance(policy, dict):
                        mclsf_nm = policy.get("mclsfNm")
                        
                        if mclsf_nm:
                            # mclsfNm이 콤마로 구분된 여러 키워드일 수 있음
                            keywords = [k.strip() for k in str(mclsf_nm).split(",") if k.strip()]
                            all_mclsf_nm.update(keywords)
                
                total_fetched += len(policies)
                print(f"[YouthPolicy] 페이지 {page_num}: {len(policies)}개 정책 처리, 누적: {total_fetched}개, 수집된 mclsfNm: {len(all_mclsf_nm)}개")
                
                # 더 이상 가져올 정책이 없으면 중단
                if total_fetched >= total_count or len(policies) < page_size:
                    print(f"[YouthPolicy] 모든 페이지 조회 완료: 총 {total_fetched}개 정책, {len(all_mclsf_nm)}개 unique mclsfNm")
                    break
                
                page_num += 1
                
                # 무한 루프 방지 (최대 100페이지)
                if page_num > 100:
                    print(f"[YouthPolicy] 경고: 최대 페이지 수(100) 도달, 중단")
                    break
                    
                # API 호출 제한을 위해 약간의 딜레이
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"[YouthPolicy] 페이지 {page_num} 조회 중 오류: {str(e)}")
                break
        
        # 정렬된 리스트로 반환
        sorted_mclsf_nm = sorted(list(all_mclsf_nm))
        print(f"[YouthPolicy] mclsfNm 추출 완료: {len(sorted_mclsf_nm)}개 unique mclsfNm")
        
        return sorted_mclsf_nm
    
    def _analyze_redirect_error(self, location: str, headers: dict, status_code: int, masked_key: str, params: dict) -> str:
        """302 리다이렉트 오류 분석 및 상세 안내"""
        error_reasons = []
        
        # 리다이렉트 위치 분석
        if ":8080" in location.lower():
            error_reasons.append("API 키 인증 실패 또는 IP 차단 가능성")
        
        if not location.startswith("https://"):
            error_reasons.append("프로토콜 불일치 (HTTP/HTTPS 문제)")
        
        # 응답 헤더 분석
        retry_after = headers.get("Retry-After")
        if retry_after:
            error_reasons.append(f"과도한 요청으로 인한 임시 차단 (재시도 대기: {retry_after}초)")
        
        # Rate limit 관련 헤더 확인
        rate_limit_remaining = headers.get("X-RateLimit-Remaining")
        rate_limit_reset = headers.get("X-RateLimit-Reset")
        if rate_limit_remaining == "0" or rate_limit_reset:
            error_reasons.append(f"API 호출 한도 초과 (재설정 시간 확인 필요)")
        
        reason_text = "\n".join([f"   - {reason}" for reason in error_reasons]) if error_reasons else "   - API 키 인증 실패 또는 서버 설정 문제"
        
        return f"""온통청년 API 인증 실패 - 302 리다이렉트 발생

현재 상황:
- API 키: {masked_key} (승인 상태 확인됨)
- 유효 기간: 2025-10-14 ~ 2026-10-14
- 리다이렉트 위치: {location}
- HTTP 상태 코드: {status_code}

발견된 문제점:
{reason_text}

주요 원인 및 해결 방법:

1. 콜백(Redirect) URI 설정 확인:
   → 온통청년 마이페이지 > 오픈(OPEN) API > 청년정책 API
   → 등록된 redirect_uri 확인
   → API 요청 시 redirect_uri 파라미터 필요 여부 확인
   → 현재 코드는 redirect_uri를 보내지 않고 있음

2. IP 주소 차단 확인:
   → 과도한 API 호출로 인한 IP 차단 가능성
   → 잠시 대기 후 재시도 (최소 1시간)
   → 다른 네트워크 환경에서 테스트
   → 온통청년 담당자에게 IP 차단 여부 문의

3. HTTPS 프로토콜 확인:
   → 현재 사용 중: {self.base_url}
   → HTTPS 사용 확인: ✓
   → HTTP 프로토콜 사용 안 함: ✓

4. API 호출 빈도 제한:
   → API 호출 빈도 줄이기
   → Rate limiting 준수
   → 과도한 요청 방지
   → 현재 요청 파라미터: {list(params.keys())}

5. 온통청년 포털에서 추가 확인:
   → 마이페이지 > 오픈(OPEN) API > 청년정책 API
   → 인증키 상세 정보 확인
   → '사용 가능' 또는 '활성화' 상태 확인
   → API 키 다시 복사 후 config.ini 재설정
   → redirect_uri 설정 여부 확인

6. 온통청년 고객 지원 문의 (필수):
   → 전화: 1670-1839 (평일 09시~18시)
   → 이메일: ycmaster@keis.or.kr
   → 문의 내용:
     "API 키는 승인되었지만 302 리다이렉트 발생
     API 키: be3a6d8e-28c5-4b43-9f76-1746e52d0d9f
     승인일: 2025-10-14
     리다이렉트 위치: {location}
     IP 차단 여부 및 redirect_uri 설정 확인 요청"

7. API 서버 상태 확인:
   → 온통청년 포털 공지사항 확인
   → API 서비스 점검 또는 장애 공지 확인

참고:
- API 문서: https://www.youthcenter.go.kr/cmnFooter/openapiIntro/oaiDoc
- API 호출 URL: {self.base_url}
- 사용 파라미터: {list(params.keys())}"""

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
# config.ini 경로를 안정적으로 찾기
current_file_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_file_dir))  # server/router -> server -> backend
config_path = os.path.join(backend_dir, "config.ini")

# config.ini 파일 읽기
read_files = parser.read(config_path)
if not read_files:
    # 파일을 찾지 못한 경우 경고
    import warnings
    warnings.warn(f"config.ini 파일을 찾을 수 없습니다. 경로: {config_path}")

# config.ini 섹션과 키 확인
if not parser.has_section("youth_policy"):
    print(f"[YouthPolicy] 경고: config.ini에 [youth_policy] 섹션이 없습니다. 경로: {config_path}")
elif not parser.has_option("youth_policy", "api_key"):
    print(f"[YouthPolicy] 경고: config.ini의 [youth_policy] 섹션에 api_key가 없습니다. 경로: {config_path}")

api_key = parser.get("youth_policy", "api_key", fallback="YOUR_API_KEY")
# redirect_uri는 선택적 (온통청년 포털에서 등록된 경우에만 필요)
redirect_uri = parser.get("youth_policy", "redirect_uri", fallback=None)
if redirect_uri and redirect_uri.strip():
    redirect_uri = redirect_uri.strip()
else:
    redirect_uri = None

# 디버깅: API 키가 제대로 읽혔는지 확인 (민감한 정보는 마스킹)
if api_key and api_key != "YOUR_API_KEY" and api_key.strip():
    masked_key = api_key[:8] + "..." if len(api_key) > 8 else "***"
    print(f"[YouthPolicy] API 키 로드 완료: {masked_key}")
    if redirect_uri:
        print(f"[YouthPolicy] redirect_uri 로드 완료: {redirect_uri}")
    else:
        print(f"[YouthPolicy] redirect_uri 미설정 (온통청년 포털에서 등록 여부 확인 필요)")
else:
    print(f"[YouthPolicy] 경고: API 키가 설정되지 않았거나 비어있습니다.")
    print(f"[YouthPolicy] config.ini 경로: {config_path}")
    print(f"[YouthPolicy] 읽은 파일 목록: {read_files}")
    if parser.has_section("youth_policy"):
        print(f"[YouthPolicy] [youth_policy] 섹션의 키들: {parser.options('youth_policy')}")

youth_policy_service = YouthPolicyService(api_key, redirect_uri=redirect_uri)

@router.get("/search/lclsf/{lclsf_nm}", response_model=PolicySearchResponse)
async def search_youth_policy_by_lclsf(
    lclsf_nm: str,
    page_index: Optional[int] = Query(None, ge=1, description="페이지 번호 (없으면 전체 조회)"),
    display: Optional[int] = Query(None, ge=1, le=100, description="한 페이지당 결과 수 (없으면 전체 조회)")
):
    """
    정책 대주제(lclsfNm)로 청년정책을 검색합니다.
    
    사용 가능한 대주제:
    - 교육
    - 복지문화
    - 일자리
    - 주거
    - 참여권리
    """
    result = await youth_policy_service.search_policy(
        keyword=None,
        page_index=page_index,
        display=display,
        lclsf_nm=lclsf_nm
    )
    
    return PolicySearchResponse(**result)

@router.get("/search/mclsf/{mclsf_nm}", response_model=PolicySearchResponse)
async def search_youth_policy_by_mclsf(
    mclsf_nm: str,
    page_index: Optional[int] = Query(None, ge=1, description="페이지 번호 (없으면 전체 조회)"),
    display: Optional[int] = Query(None, ge=1, le=100, description="한 페이지당 결과 수 (없으면 전체 조회)")
):
    """
    정책 중주제(mclsfNm)로 청년정책을 검색합니다.
    
    사용 가능한 중주제:
    - 건강, 교육비지원, 권익보호, 기숙사, 문화활동
    - 미래역량강화, 예술인지원, 온라인교육, 재직자
    - 전월세 및 주거급여 지원, 정책인프라구축, 주택 및 거주지
    - 창업, 청년국제교류, 청년참여, 취약계층 및 금융지원, 취업
    """
    # 디버깅: 받은 mclsf_nm 값 확인
    import urllib.parse
    print(f"[YouthPolicy] ========== 중주제 검색 시작 ==========")
    print(f"[YouthPolicy] 원본 mclsf_nm (받은 값): '{mclsf_nm}'")
    print(f"[YouthPolicy] mclsf_nm 길이: {len(mclsf_nm)}")
    print(f"[YouthPolicy] mclsf_nm 띄어쓰기 포함 여부: {'띄어쓰기 있음' if ' ' in mclsf_nm else '띄어쓰기 없음'}")
    print(f"[YouthPolicy] mclsf_nm URL 인코딩 후: '{urllib.parse.quote(mclsf_nm)}'")
    print(f"[YouthPolicy] =====================================")
    
    result = await youth_policy_service.search_policy(
        keyword=None,
        page_index=page_index,
        display=display,
        mclsf_nm=mclsf_nm
    )
    
    return PolicySearchResponse(**result)

@router.get("/lclsf-nm/from-api")
async def get_lclsf_nm_from_api():
    """
    정책 대주제 검색 분류 리스트를 반환합니다.
    """
    # 정책 대주제 검색 분류
    lclsf_nm_list = [
        "교육",
        "복지문화",
        "일자리",
        "주거",
        "참여권리"
    ]
    
    return {
        "lclsf_nm": lclsf_nm_list,
        "total_count": len(lclsf_nm_list),
        "message": f"정책 대주제 검색 분류 {len(lclsf_nm_list)}개입니다."
    }

@router.get("/mclsf-nm/from-api")
async def get_mclsf_nm_from_api():
    """
    정책 중주제 검색 분류 리스트를 반환합니다.
    """
    # 정책 중주제 검색 분류
    mclsf_nm_list = [
        "건강",
        "교육비지원",
        "권익보호",
        "기숙사",
        "문화활동",
        "미래역량강화",
        "예술인지원",
        "온라인교육",
        "재직자",
        "전월세 및 주거급여 지원",
        "정책인프라구축",
        "주택 및 거주지",
        "창업",
        "청년국제교류",
        "청년참여",
        "취약계층 및 금융지원",
        "취업"
    ]
    
    return {
        "mclsf_nm": mclsf_nm_list,
        "total_count": len(mclsf_nm_list),
        "message": f"정책 중주제 검색 분류 {len(mclsf_nm_list)}개입니다."
    }


