// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000",
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("auth_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ---- 타입
export type Character = { id?: number; gender?: string; region?: string; job?: string };

export type PolicyDoc = {
  plcyNm?: string;
  plcyExplnCn?: string;
  plcyKywdNm?: string;
  plcySprtCn?: string;
  lclsfNm?: string;
  mclsfNm?: string;
  // 필요한 필드 더 추가
};

export type YouthPolicySearchResp = { policies: PolicyDoc[] };

// ---- Youth Policy 검색
export const searchByLclsf = (lclsf_nm: string) =>
  api
    .get<YouthPolicySearchResp>(`/youth-policy/search/lclsf/${encodeURIComponent(lclsf_nm)}`)
    .then((r) => r.data.policies);

export const searchByMclsf = (mclsf_nm: string) =>
  api
    .get<YouthPolicySearchResp>(`/youth-policy/search/mclsf/${encodeURIComponent(mclsf_nm)}`)
    .then((r) => r.data.policies);

// ---- LLM: 컨텍스트 추출 → 최종 프롬프트
export type ExtractPolicyContextResp = { prompt: string };

export const extractPolicyContext = (prompt: string, context: PolicyDoc[]) =>
  api
    .post<ExtractPolicyContextResp>("/llm/extract-policy-context", { prompt, context })
    .then((r) => r.data);

// ---- LLM: 채팅
export type ChatResp = { content: string };

export const chat = (prompt: string, opts?: { userId?: string; characterId?: number }) =>
  api
    .post<ChatResp>("/llm/chat", {
      prompt,
      user_id: opts?.userId,
      character_id: opts?.characterId,
    })
    .then((r) => r.data);
