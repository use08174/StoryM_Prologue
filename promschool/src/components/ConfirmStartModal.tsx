// src/components/ConfirmStartModal.tsx
import { useEffect, useRef, useMemo } from "react";
import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  Icon,
  usePrefersReducedMotion,
  Flex,
} from "@chakra-ui/react";
import { FiCheck, FiX } from "react-icons/fi";
import { PIXEL_PALETTE as C } from "./pixelpalette";

type Props = {
  isOpen: boolean;
  title?: string;
  message?: string;
  onYes: () => void;
  onNo: () => void;
  sfxOpenSrc?: string;
  sfxYesSrc?: string;
  sfxNoSrc?: string;
};

export default function ConfirmStartModal({
  isOpen,
  title = "퀘스트 1",
  message = "퀘스트 1을 시작하시겠습니까?",
  onYes,
  onNo,
  sfxOpenSrc = "/assets/sfx/twinkle.mp3",
  sfxYesSrc = "/assets/sfx/confirm.wav",
  sfxNoSrc = "/assets/sfx/cancel.wav",
}: Props) {
  const reduce = usePrefersReducedMotion();
  const openSfxRef = useRef<HTMLAudioElement | null>(null);
  const yesSfxRef = useRef<HTMLAudioElement | null>(null);
  const noSfxRef = useRef<HTMLAudioElement | null>(null);

  // 효과음 준비
  useEffect(() => {
    if (!isOpen) return;
    openSfxRef.current = sfxOpenSrc ? new Audio(sfxOpenSrc) : null;
    yesSfxRef.current = sfxYesSrc ? new Audio(sfxYesSrc) : null;
    noSfxRef.current = sfxNoSrc ? new Audio(sfxNoSrc) : null;
    openSfxRef.current?.play().catch(() => {});
    return () => {
      openSfxRef.current = null;
      yesSfxRef.current = null;
      noSfxRef.current = null;
    };
  }, [isOpen, sfxOpenSrc, sfxYesSrc, sfxNoSrc]);

  // 키보드: Enter=YES, Esc=NO
  useEffect(() => {
    if (!isOpen) return;

    const fn = (e: KeyboardEvent) => {
      e.stopPropagation(); // ✅ ImmediatePropagation 대신 Propagation만 중단
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        if (yesSfxRef.current) yesSfxRef.current.currentTime = 0;
        yesSfxRef.current?.play().catch(() => {});
        onYes();
      } else if (e.code === "Escape") {
        e.preventDefault();
        if (noSfxRef.current) noSfxRef.current.currentTime = 0;
        noSfxRef.current?.play().catch(() => {});
        onNo();
      }
    };

    setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 50);

    document.addEventListener("keydown", fn, true);
    return () => document.removeEventListener("keydown", fn, true);
  }, [isOpen, onYes, onNo]);


  // 버튼 스타일(shine 애니메이션은 reduce 설정을 따름)
  const { btnBase, yesStyle, noStyle } = useMemo(() => {
    const base = {
      position: "relative" as const,
      fontFamily: "neodgm",
      fontWeight: 800,
      letterSpacing: "0.06em",
      borderRadius: "14px",
      px: [7, 9],
      py: [5, 6],
      transform: "translateY(0)",
      transition: "transform 120ms ease, box-shadow 160ms ease, background 160ms ease",
      boxShadow: `0 12px 28px ${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
      _focusVisible: {
        outline: "none",
        boxShadow: `0 0 0 3px ${C.ribbon}, 0 12px 28px ${C.shadow}`,
      },
      _before: {
        // 상단 글로시 하이라이트
        content: '""',
        position: "absolute",
        inset: "3px 3px auto 3px",
        height: "40%",
        borderRadius: "10px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.05))",
        pointerEvents: "none",
        mixBlendMode: "screen",
      },
      _after: reduce
        ? undefined
        : {
            // 사선 스윕(shine)
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.2) 30%, transparent 60%)",
            backgroundSize: "300% 100%",
            backgroundPosition: "200% 0",
            mixBlendMode: "screen",
            pointerEvents: "none",
            animation: "shine 2.6s linear infinite",
          },
      // 눌림 효과
      _active: {
        transform: "translateY(2px) scale(0.98)",
        boxShadow: `0 6px 18px ${C.shadow}, inset 0 2px 0 rgba(0,0,0,0.15)`,
      },
    };

    const yes = {
      color: C.border,
      bg: `linear-gradient(180deg, ${C.tileMid}, ${C.tileLight})`,
      border: `2px solid ${C.border}`,
      // 더블 보더 느낌
      boxShadow: `0 0 0 3px ${C.ribbon}AA, 0 12px 28px ${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
      textShadow: "0 1px 0 rgba(0,0,0,0.2)",
      _hover: {
        bg: `linear-gradient(180deg, ${C.tileMid} , ${C.tileLight} )`,
        filter: "saturate(1.15)",
        boxShadow: `0 0 12px ${C.border}99, 0 16px 36px ${C.shadow}`,
        transform: "translateY(-1px)",
      },
    };

    const no = {
      color: C.ink,
      bg: `linear-gradient(180deg, ${C.ribbon}EE, ${C.tileLight})`,
      border: `2px solid ${C.border}`,
      boxShadow: `0 0 0 3px ${C.border}55, 0 12px 28px ${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
      _hover: {
        bg: `linear-gradient(180deg, ${C.ribbon}FF, ${C.tileLight})`,
        boxShadow: `0 0 12px ${C.ink}66, 0 16px 36px ${C.shadow}`,
        transform: "translateY(-1px)",
      },
    };

    return { btnBase: base, yesStyle: yes, noStyle: no };
  }, [reduce]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      role="dialog"
      aria-modal="true"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/assets/background/quest1_back.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        boxShadow: `inset 0 0 200px ${C.shadow}`,
        backgroundImage: reduce
          ? undefined
          : "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 4px)",
        mixBlendMode: "overlay",
        opacity: 0.34,
      }}
      onClick={onNo}
    >
      <Box
        as="section"
        position="absolute"
        inset={0}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        borderRadius={0}
      >
        {/* 중앙 콘텐츠 + 버튼(바로 아래 배치) */}
        <Flex
          as="main"
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          px={[6, 10]}
          py={[8, 12]}
          minH="100vh"
          gap={6}
        >
          {/* 메시지 */}
          <Text
            fontSize={["2xl", "4xl", "5xl"]} // base, md, lg
            color="#f6e7ffff"
            lineHeight="1.3"
            maxW="1100px"
            textShadow="0 2px 8px rgba(0, 0, 0, 0.7)"
            fontFamily="neodgm"
          >
            {message}
          </Text>

          {/* 버튼들을 메시지 바로 아래에 */}
          <VStack spacing={4} mt={2}>
            <HStack spacing={[4, 7]}>
              {/* YES */}
              <Button
                size="lg"
                onClick={() => {
                  if (yesSfxRef.current) yesSfxRef.current.currentTime = 0;
                  yesSfxRef.current?.play().catch(() => {});
                  requestAnimationFrame(() => onYes());
                }}
                leftIcon={<Icon as={FiCheck} />}
                sx={{ ...btnBase, ...yesStyle }}
              >
                YES{" "}
                <Text as="span" opacity={0.85} ml={2} fontFamily="neodgm">
                  (Enter)
                </Text>
              </Button>

              {/* NO */}
              <Button
                size="lg"
                variant="solid"
                onClick={() => {
                  if (noSfxRef.current) noSfxRef.current.currentTime = 0;
                  noSfxRef.current?.play().catch(() => {});
                  onNo();
                }}
                leftIcon={<Icon as={FiX} />}
                sx={{ ...btnBase, ...noStyle }}
              >
                NO{" "}
                <Text as="span" opacity={0.85} ml={2} fontFamily="neodgm">
                  (Esc)
                </Text>
              </Button>
            </HStack>
          </VStack>
        </Flex>
      </Box>

      {/* keyframes */}
      <style>{`
        @keyframes shine {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </Box>
  );
}
