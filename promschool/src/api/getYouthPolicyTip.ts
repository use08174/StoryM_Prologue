// src/features/policy/getYouthPolicyTip.ts
import {
  chat,
  extractPolicyContext,
  searchByLclsf,
  searchByMclsf,
  PolicyDoc,
} from "./client";

export type TopicType = "lclsf" | "mclsf";
export type YouthPolicyTip = { title: string; bullets: { title: string; summary?: string }[]; raw?: string };

const whoLine = (c?: { gender?: string; region?: string; job?: string }) =>
  `캐릭터 정보: 성별=${c?.gender ?? "미상"}, 지역=${c?.region ?? "미상"}, 직업=${c?.job ?? "미상"}.`;

export async function getYouthPolicyTip(params: {
  topicType: TopicType;
  topicName: string;                    // 예: "주거" | "취업"
  characterMeta?: { gender?: string; region?: string; job?: string }; // 추출 단계에서만 사용(선택)
  userId?: string;                      // /llm/chat로 전달할 user_id (선택)
  characterId?: number;                 // /llm/chat로 전달할 character_id (선택)
}): Promise<YouthPolicyTip> {
  const { topicType, topicName, characterMeta, userId, characterId } = params;

  // 1) Bulk 검색 (백엔드 스키마에 맞게 policies 배열만 받음)
  const bulk: PolicyDoc[] =
    topicType === "lclsf" ? await searchByLclsf(topicName) : await searchByMclsf(topicName);

  // 2) 컨텍스트 추출(최종 프롬프트 생성)
  const extract = await extractPolicyContext(
    `${whoLine(characterMeta)}\n주제="${topicName}" 관련 실제 도움이 되는 정책만 간결 정리해줘.`,
    bulk
  );

  // 3) LLM 호출 (백엔드가 character_id/user_id 컨텍스트를 붙여 처리)
  const final = await chat(extract.prompt, { userId, characterId });

  // 4) 간단 파서: 줄바꿈 기준 bullet 생성
  const lines = final.content
    .split(/\n+/)
    .map((s) => s.replace(/^[\-\*\d\).\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const bullets = lines.map((t) => ({ title: t }));

  return {
    title: "💡 청년정책 Tip",
    bullets,
    raw: final.content,
  };
}
