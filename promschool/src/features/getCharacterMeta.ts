export type CharacterMeta = {
  character_id: number;
  user_id: string;
  gender?: string;
  region?: string;
  job?: string;
};

export async function getCharacterMeta(characterId: number): Promise<CharacterMeta> {
  const res = await fetch(`/api/character/${characterId}`);
  if (!res.ok) throw new Error(`캐릭터 조회 실패: ${res.status}`);
  return res.json();
}

export async function createCharacter(payload: {
  user_id: string;
  gender?: string;
  region?: string;
  job?: string;
}): Promise<{ character_id: number }> {
  const res = await fetch(`/api/character`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`캐릭터 생성 실패: ${res.status}`);
  return res.json(); // { character_id: number }
}