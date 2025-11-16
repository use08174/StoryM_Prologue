// src/lib/useSfx.ts
import { useCallback, useEffect, useRef } from "react";
import { useBgm } from "../BgmProvider"; 

type PlayOptions = {
  volume?: number;     // SFX 볼륨 (0~1) 기본 1
  duck?: number;       // BGM을 몇 %로 낮출지 (0.0~1.0) 기본 0.35
  restoreMs?: number;  // SFX 끝나고 복구까지 대기시간(ms) 기본 250
  honorMute?: boolean; // BGM이 muted면 SFX도 끌지 여부(기본 true=안 울림)
};

export function useSfx() {
  const { volume: bgmVol, fadeTo, muted } = useBgm();
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const restoreToken = useRef(0); // 덕킹 복구 경쟁 방지용 토큰

  // 언마운트 시 SFX 정리
  useEffect(() => {
    return () => {
      try {
        sfxRef.current?.pause();
        sfxRef.current = null;
      } catch {}
    };
  }, []);

  const play = useCallback((url?: string, opt: PlayOptions = {}) => {
    if (!url) return;

    const {
      volume = 100 / 100,
      duck = 0.01,
      restoreMs = 10,
      honorMute = true,
    } = opt;

    // 전체 음소거 정책을 따를지 여부
    if (honorMute && muted) return;

    // 이전 SFX 정리
    try {
      sfxRef.current?.pause();
      sfxRef.current = null;
    } catch {}

    // BGM 덕킹
    const prevVol = bgmVol; // 사용자가 설정한 현재 볼륨
    fadeTo(Math.max(0, Math.min(1, prevVol * duck)), 10);
    const myToken = ++restoreToken.current;

    // SFX 재생
    const a = new Audio(url);
    a.volume = volume;
    sfxRef.current = a;

    const restore = () => {
      // 마지막으로 시작된 SFX만 복구 권한
      if (restoreToken.current === myToken) {
        fadeTo(prevVol, 160);
      }
    };

    a.addEventListener("ended", () => {
      setTimeout(restore, restoreMs);
    });
    a.addEventListener("pause", () => {
      setTimeout(restore, restoreMs);
    });
    a.addEventListener("error", () => {
      setTimeout(restore, restoreMs);
    });

    a.play().catch(() => {
      // 재생 실패해도 복구는 해둔다
      setTimeout(restore, restoreMs);
    });
  }, [bgmVol, fadeTo, muted]);

  // 간단 프리로드
  const preload = useCallback((urls: (string | undefined)[]) => {
    urls.filter(Boolean).forEach((u) => {
      const a = new Audio(u as string);
      a.preload = "auto";
    });
  }, []);

  return { play, preload };
}
