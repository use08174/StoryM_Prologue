import { chat, extractPolicyContext, searchByLclsf, searchByMclsf, PolicyDoc } from "./client";
import { http } from "./http";

export type TopicType = "lclsf" | "mclsf";
export type YouthPolicyTip = {
  title: string;
  bullets: { title: string; summary?: string }[];
  raw?: string;
};

// 1) 백엔드 단일 엔드포인트 직접 호출 (간단/빠름)
export async function getYouthPolicyTipHttp(params: {
  topicType: TopicType;
  topicName: string;
  characterMeta?: { gender?: string; region?: string; job?: string };
  userId?: string;
  characterId?: number;
}): Promise<YouthPolicyTip> {
  const { topicType, topicName, ...q } = params;
  const res = await http.get(
    `/youth-policy/search/${topicType}/${encodeURIComponent(topicName)}`,
    { params: q }
  );
  return res.data as YouthPolicyTip;
}

// 2) 클라이언트에서 검색→추출→LLM까지 조립 (백엔드 경량일 때)
const whoLine = (c?: { gender?: string; region?: string; job?: string }) =>
  `캐릭터 정보: 성별=${c?.gender ?? "미상"}, 지역=${c?.region ?? "미상"}, 직업=${c?.job ?? "미상"}.`;

export async function getYouthPolicyTip(params: {
  topicType: TopicType;
  topicName: string;
  characterMeta?: { gender?: string; region?: string; job?: string };
  userId?: string;
  characterId?: number;
}): Promise<YouthPolicyTip> {
  const { topicType, topicName, characterMeta, userId, characterId } = params;

  const bulk: PolicyDoc[] =
    topicType === "lclsf" ? await searchByLclsf(topicName) : await searchByMclsf(topicName);

  const extract = await extractPolicyContext(
    `${whoLine(characterMeta)}\n주제="${topicName}" 관련 실제 도움이 되는 정책만 간결 정리해줘.`,
    bulk
  );

  const final = await chat(extract.prompt, { userId, characterId });

  const bullets = final.content
    .split(/\n+/)
    .map((s) => s.replace(/^[\-\*\d\).\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((t) => ({ title: t }));

  return { title: "💡 청년정책 Tip", bullets, raw: final.content };
}
