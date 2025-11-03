import { useEffect, useRef } from "react";
import Phaser from "phaser";
import scenes from "rpg/scenes";
import { isDevelopment, isProduction } from "env";
import { Box } from "@chakra-ui/react";

export const Game = ({ paused = false }: { paused?: boolean }) => {
  const phaserContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // 컨테이너 기준으로 가로 계산 (세로 768 고정 설계 유지)
  const calculateWidth = () => {
    const el = phaserContainer.current!;
    const h = Math.max(el.clientHeight, 180); // 최소값으로 0x0 회피
    const w = Math.max(el.clientWidth, 320);
    return w / (h / 768);
  };

  useEffect(() => {
    const host = phaserContainer.current;
    if (!host) return;

    let mounted = true;

    // 컨테이너가 0x0이면 잠시 대기 후 생성 (레이아웃 완료 기다리기)
    const waitForNonZeroSize = (cb: () => void) => {
      const tryInit = () => {
        if (!mounted) return;
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w > 0 && h > 0) cb();
        else requestAnimationFrame(tryInit);
      };
      tryInit();
    };

    waitForNonZeroSize(() => {
      if (!mounted) return;

      // 고정 정수 배율(1 또는 2). 너무 높이면 FBO 실패 위험
      const zoom = Math.min(2, Math.floor(window.devicePixelRatio || 1));

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,                   // ✅ WebGL 강제
        parent: host,                         // DOM 엘리먼트를 직접 참조
        width: calculateWidth(),
        height: 768,
        title: "Phaser RPG",
        url: process.env.URL,
        version: process.env.VERSION,
        scene: scenes,
        physics: {
          default: "arcade",
          arcade: { debug: isDevelopment },
        },
        disableContextMenu: isProduction,
        backgroundColor: "#000000",
        // resolution: 1, // (원하면 타입 보강 후 사용)
        render: {
          antialias: false,                   // ✅ 보수화
          pixelArt: true,                     // ✅ NPOT+mipmap 이슈 완화
          roundPixels: true,
          powerPreference: "high-performance",
          transparent: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
        },
        scale: {
          mode: Phaser.Scale.FIT,             // 기존 설계 유지
          autoCenter: Phaser.Scale.CENTER_BOTH,
          zoom,                               // 1 또는 2
        },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      const handleResize = () => {
        if (!game || !host) return;
        // FIT 모드에서는 resize 사용 권장
        game.scale.resize(calculateWidth(), 768);
      };

      window.addEventListener("resize", handleResize);

      // 클린업
      const cleanup = () => {
        window.removeEventListener("resize", handleResize);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };

      // 언마운트 시 정리
      const unmountCleanup = () => {
        mounted = false;
        cleanup();
      };

      (Game as any)._unmountCleanup = unmountCleanup;
    });

    return () => {
      mounted = false;
      if ((Game as any)._unmountCleanup) (Game as any)._unmountCleanup();
    };
  }, []);

  // ✅ 추가: paused 변경 시 입력/물리 토글
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    // 1) 전역 입력 토글 (포인터 + 키보드)
    if (game.input) {
      game.input.enabled = !paused;

      if (game.input.keyboard) {
        game.input.keyboard.enabled = !paused;

        if (paused) {
          // 눌린 채 남아있는 키/캡처 정리(잔상 방지)
          try {
            game.input.keyboard.clearCaptures();
          } catch {}
        }
      }
    }

    // 2) 모든 활성 씬의 물리 월드 토글 + 씬 입력 토글
    const activeScenes = game.scene.getScenes(true);
    activeScenes.forEach((s: any) => {
      // 물리 월드
      if (s.physics && s.physics.world) {
        if (paused) s.physics.world.pause();
        else s.physics.world.resume();
      }
      // 씬 입력
      if (s.input) {
        if (s.input.keyboard) s.input.keyboard.enabled = !paused;
        s.input.enabled = !paused;
      }

      // (선택) 일시정지 순간 캐릭터 속도 0으로
      if (paused) s.events?.emit?.("PAUSE_APPLIED");
    });
  }, [paused]);

  return (
    <Box
      ref={phaserContainer}
      id="phaser-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
