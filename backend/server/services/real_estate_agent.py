from typing import List, Dict
from server.router.youth_policy_handlers import YouthPolicyService, REAL_ESTATE_KEYWORDS

class RealEstateGameAgent:
    def __init__(self, policy_service: YouthPolicyService):
        self.policy_service = policy_service
    
    async def get_policy_context(self, user_question: str) -> str:
        """사용자 질문에 맞는 정책 정보를 가져와서 컨텍스트로 구성"""
        # 1. 키워드 매핑
        keywords = self._extract_keywords(user_question)
        
        # 2. 각 키워드로 정책 검색
        all_policies = []
        for keyword in keywords:
            try:
                result = await self.policy_service.search_policy(keyword, display=5)
                all_policies.extend(result["policies"])
            except Exception as e:
                print(f"키워드 '{keyword}' 검색 실패: {e}")
                continue
        
        # 3. 중복 제거
        unique_policies = self._remove_duplicates(all_policies)
        
        # 4. 컨텍스트 구성
        return self._format_policy_context(unique_policies)
    
    def _extract_keywords(self, question: str) -> List[str]:
        """질문에서 키워드 추출"""
        keywords = []
        
        # 정확한 키워드 매칭
        for keyword in REAL_ESTATE_KEYWORDS:
            if keyword in question:
                keywords.append(keyword)
        
        # 기본 키워드 추가 (매칭되는 키워드가 없는 경우)
        if not keywords:
            if any(word in question for word in ['전세', '전세자금', '전세보증금']):
                keywords.append('전세')
            elif any(word in question for word in ['임대', '월세', '임대료']):
                keywords.append('임대')
            elif any(word in question for word in ['주거', '집', '살 곳', '주택']):
                keywords.append('주거')
            elif any(word in question for word in ['청년주택', '희망키움']):
                keywords.append('청년주택')
            elif any(word in question for word in ['주거급여', '주거비', '주거지원']):
                keywords.append('주거급여')
            elif any(word in question for word in ['대출', '자금', '도약계좌']):
                keywords.append('대출')
        
        return keywords[:3]  # 최대 3개 키워드만 사용
    
    def _remove_duplicates(self, policies: List[Dict]) -> List[Dict]:
        """중복 정책 제거"""
        seen = set()
        unique_policies = []
        
        for policy in policies:
            policy_id = policy.get('polyBizSjnm', '') + policy.get('polyItcnCn', '')
            if policy_id not in seen:
                seen.add(policy_id)
                unique_policies.append(policy)
        
        return unique_policies
    
    def _format_policy_context(self, policies: List[Dict]) -> str:
        """정책 정보를 프롬프트 컨텍스트로 포맷팅"""
        if not policies:
            return "관련 정책 정보를 찾을 수 없습니다."
        
        context_parts = ["=== 청년 부동산 정책 정보 ==="]
        
        for i, policy in enumerate(policies[:5], 1):  # 최대 5개 정책만
            context_parts.append(f"""
정책 {i}:
- 정책명: {policy.get('polyBizSjnm', 'N/A')}
- 내용: {policy.get('polyItcnCn', 'N/A')}
- 지원내용: {policy.get('sporCn', 'N/A')}
- 신청방법: {policy.get('rqutPrcnCn', 'N/A')}
- 지원기관: {policy.get('sporScvl', 'N/A')}
- 연락처: {policy.get('ctpvNm', 'N/A')}
            """)
        
        return "\n".join(context_parts)
    
    async def get_enhanced_system_prompt(self, base_prompt: str, user_question: str) -> str:
        """정책 정보가 포함된 시스템 프롬프트를 생성합니다."""
        policy_context = await self.get_policy_context(user_question)
        
        return f"""
{base_prompt}

{policy_context}

위의 청년 부동산 정책 정보를 바탕으로 플레이어에게 정확하고 유용한 조언을 제공해주세요.
정책의 구체적인 내용, 신청 방법, 지원 기관 등을 참고하여 답변해주세요.
실제 정책 정보를 바탕으로 정확한 정보를 제공하고, 신청 방법이나 연락처가 있다면 구체적으로 안내해주세요.
"""
