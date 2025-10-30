// bgm.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type BgmCtx = {
  muted: boolean;
  setMuted: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  play: (src?: string) => Promise<void>;
  pause: () => void;
  fadeTo: (target: number, ms: number) => void;
};

const Ctx = createContext<BgmCtx | null>(null);

export const BgmProvider: React.FC<{ children: React.ReactNode; src: string }> = ({ children, src }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const [muted, setMuted] = useState(false);   // 기본 ON
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const a = new Audio(src);
    a.loop = true;
    a.preload = "auto";
    a.volume = volume;
    a.muted = muted;
    audioRef.current = a;

    // 가급적 즉시 자동재생 시도(허용되는 브라우저/환경)
    const tryAutoplay = async () => {
      if (!audioRef.current || muted) return;
      try {
        startedRef.current = true;
        await audioRef.current.play();
      } catch {
        // 정책상 거부되면 조용히 무시 -> unlock에서 재시도
      }
    };
    if (document.visibilityState === "visible") {
      void tryAutoplay();
    }

    // 탭 전환 대응
    const onVisibility = () => {
      const el = audioRef.current;
      if (!el) return;
      if (document.hidden) el.pause();
      else if (startedRef.current && !muted) el.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 첫 사용자 입력 이후 재생 (오토플레이 정책 대응)
    const unlock = () => {
      const el = audioRef.current;
      if (!el) return;
      startedRef.current = true;
      if (!muted) el.play().catch(() => {});
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
    // src 바뀌면 새 오디오로 교체
  }, [src, muted, volume]);

  // 🔴 음소거 토글 시 실제 동작
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (muted) {
      el.pause();                   // 음소거면 일시정지
    } else if (startedRef.current) {
      el.play().catch(() => {});    // 음소거 해제 시 재생 재시도
    }
  }, [muted]);

  // 볼륨 변경 즉시 반영
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // 외부에서 재생 요청
  const play = useCallback(async (newSrc?: string) => {
    const el = audioRef.current;
    if (!el) return;
    if (newSrc) el.src = newSrc;
    startedRef.current = true;
    if (muted) return;              // 음소거면 재생하지 않음
    try {
      await el.play();
    } catch {
      // 사용자 입력 후에 다시 시도될 것
    }
  }, [muted]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  // 부드러운 볼륨 페이드
  const fadeTo = useCallback((target: number, ms: number) => {
    const el = audioRef.current;
    if (!el) return;
    const start = el.volume;
    const diff = Math.max(0, Math.min(1, target)) - start;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      el.volume = start + diff * p;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  return (
    <Ctx.Provider value={{ muted, setMuted, volume, setVolume, play, pause, fadeTo }}>
      {children}
    </Ctx.Provider>
  );
};

export const useBgm = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBgm must be used within BgmProvider");
  return ctx;
};
