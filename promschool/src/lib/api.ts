// src/lib/api.ts
const BASE_URL = ""; // 프록시 사용시 절대주소 금지

type Method = "GET" | "POST";
interface FetchJSONOptions {
  method?: Method;
  body?: unknown;
  token?: string | null;
  includeCredentials?: boolean;
}

const isDev = process.env.NODE_ENV !== "production";

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") return value.length > 8 ? value.slice(0, 4) + "•••" : "•••";
  if (Array.isArray(value)) return (value as unknown[]).map((v) => redact(v));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = /(password|pwd|token|authorization)/i.test(k) ? "•••" : redact(v);
    }
    return out;
  }
  return value;
}
function short(text: string, limit = 400): string {
  return text.length <= limit ? text : text.slice(0, limit) + `… [+${text.length - limit}]`;
}
function rid(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function fetchJSON<T = unknown>(
  path: string,
  { method = "GET", body, token, includeCredentials = true }: FetchJSONOptions = {}
): Promise<T> {
  const id = rid();

  // --- [수정 1] url을 'let'으로 선언하여 변경 가능하게 함 ---
  let url = `${BASE_URL}${path}`;

  // --- [수정 2] GET 요청이고 토큰이 있으면, URL에 쿼리 파라미터로 추가 ---
  // 백엔드가 "Provide token as query..."라고 요청했기 때문입니다.
  if (method === "GET" && token) {
    // 이미 다른 쿼리가 있을 수도 있으니 '?' 대신 '&'를 써야할지 확인
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}token=${encodeURIComponent(token)}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",

    // --- [수정 3] GET 요청이 '아닌' 경우(POST 등)에만 헤더에 토큰 추가 ---
    ...(token && method !== "GET" ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (isDev) {
    console.log(
      `%c[API->][${id}] ${method} ${url}`, // 👈 이제 /auth/me?token=... 형태로 로그가 찍힐 겁니다.
      "color:#8be9fd",
      {
        headers: {
          ...headers,
          Authorization: headers.Authorization ? "Bearer •••" : undefined,
        },
        body: redact(body),
        credentials: includeCredentials ? "include" : "same-origin",
      }
    );
  }

  const res = await fetch(url, { // 👈 수정된 url이 여기서 사용됩니다.
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: includeCredentials ? "include" : "same-origin",
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data: any = await res.json();
        // FastAPI 스타일(detail 배열) 우선 처리
        if (Array.isArray(data?.detail)) {
          msg = data.detail.map((d: any) => d?.msg || d).join(", ");
        } else if (typeof data?.detail === "string") {
          msg = data.detail;
        } else {
          msg = data.message || data.error || msg;
        }
      } else {
        msg = short(await res.text());
      }
    } catch {}
    if (isDev) {
      console.warn(`%c[API× ][${id}] ${method} ${url} ${res.status}`, "color:#ff5555", msg);
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);

  if (isDev)
    console.log(`%c[API<-][${id}] ${method} ${url} ${res.status}`, "color:#50fa7b", redact(data));
  return data;
}

// API wrappers
export async function apiSignup(input: { id: string; email: string; password: string }) {
  return fetchJSON<{ user_id: string; email: string }>("/auth/signup", { method: "POST", body: input });
}
export async function apiLogin(input: { id: string; password: string }) {
  return fetchJSON<{ token?: string; [k: string]: unknown }>("/auth/login", { method: "POST", body: input });
}
export async function apiMe(token?: string | null) {
  return fetchJSON<{ user_id: string; email: string }>("/auth/me", { method: "GET", token: token ?? null });
}
