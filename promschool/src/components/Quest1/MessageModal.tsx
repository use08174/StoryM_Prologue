// components/MessageModal.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
  Icon,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { FiChevronRight } from "react-icons/fi";
import { PIXEL_PALETTE as C } from "../pixelpalette"; // 경로는 프로젝트에 맞게

export interface MessageModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  /** 커스텀 메시지를 넘기면 이 배열이 표시됩니다. */
  messages?: string[];
  /** 좌측 아바타 이미지 경로(선택) */
  avatarSrc?: string;
  /** 상단 말풍선 제목(선택) */
  title?: string;

  /** --- 확장 옵션들 (전부 선택) --- */
  /** 타이핑 속도(ms/글자). 0이면 즉시 출력 */
  typingSpeed?: number;
  /** 클릭으로도 진행 가능 여부 (기본 true) */
  clickToAdvance?: boolean;
  /** 오버레이 클릭으로 진행 (기본 true) */
  overlayClickAdvance?: boolean;
  /** 열림 효과음 경로 */
  sfxOpenSrc?: string;
  /** 다음으로 넘길 때 효과음 경로 */
  sfxAdvanceSrc?: string;
  /** 사운드 볼륨 (0~1) */
  sfxVolume?: number;
  /** 메인 테마 색상(리본/보더) */
  themeColor?: string;
}

const DEFAULT_MESSAGES: string[] = [
  "너의 첫 독립을 축하해! 🏠",
  "우선, 너의 보금자리를 같이 찾아보자.",
  "자취 예산은 크게 ‘고정비용’과 ‘변동비용’으로 나뉘어.",
  "고정비용: 월세/전세 이자, 관리비, 인터넷·통신, 전기·가스·수도 같은 공과금이야.",
  "변동비용: 식비, 교통비, 생활용품, 취미·구독, 예비비(비상자금). 소비 습관에 따라 달라져.",
  "팁) 먼저 고정비용을 안정적으로 감당 가능한 수준으로 정하고, 남은 금액에서 변동비용을 배분해봐.",
  "좋아! 이제 작은 미니게임으로 예산 감각을 키워보자. (Enter로 진행)",
];

export default function MessageModal({
  isOpen,
  onComplete,
  onClose,
  messages = DEFAULT_MESSAGES,
  avatarSrc = "/assets/quest2_scenes/agent.png",
  title = "마을 이장님",
  typingSpeed = 16,
  clickToAdvance = true,
  overlayClickAdvance = true,
  sfxOpenSrc,
  sfxAdvanceSrc,
  sfxVolume = 0.6,
  themeColor = "#815b3a",
}: MessageModalProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");       // 현재 줄에서 화면에 보여지는 문자열
  const [isTyping, setIsTyping] = useState(false);
  const openSfxRef = useRef<HTMLAudioElement | null>(null);
  const advanceSfxRef = useRef<HTMLAudioElement | null>(null);
  const typingTimer = useRef<number | null>(null);

  const total = messages.length;
  const currentMsg = useMemo(() => messages[idx] ?? "", [messages, idx]);

  // SFX 준비
  useEffect(() => {
    if (!isOpen) return;
    if (sfxOpenSrc) {
      openSfxRef.current = new Audio(sfxOpenSrc);
      openSfxRef.current.volume = sfxVolume;
      openSfxRef.current.play().catch(() => {});
    }
    if (sfxAdvanceSrc) {
      advanceSfxRef.current = new Audio(sfxAdvanceSrc);
      advanceSfxRef.current.volume = sfxVolume;
    }
    return () => {
      openSfxRef.current = null;
      advanceSfxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sfxOpenSrc, sfxAdvanceSrc]);

  // 타자기 효과
  const startTyping = useCallback(
    (text: string) => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
      if (typingSpeed <= 0 || prefersReducedMotion) {
        setShown(text);
        setIsTyping(false);
        return;
      }
      setShown("");
      setIsTyping(true);
      let i = 0;
      typingTimer.current = window.setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          setIsTyping(false);
          if (typingTimer.current) {
            window.clearInterval(typingTimer.current);
            typingTimer.current = null;
          }
        }
      }, typingSpeed) as unknown as number;
    },
    [typingSpeed, prefersReducedMotion]
  );

  // 줄 바뀔 때마다 타이핑 시작
  useEffect(() => {
    if (!isOpen) return;
    startTyping(currentMsg);
    return () => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
    };
  }, [idx, isOpen, currentMsg, startTyping]);

  const playAdvance = () => {
    advanceSfxRef.current?.currentTime && (advanceSfxRef.current.currentTime = 0);
    advanceSfxRef.current?.play().catch(() => {});
  };

  const completeOrNext = useCallback(() => {
    if (!isOpen) return;

    // 1) 타이핑 중이면 즉시 완성
    if (isTyping && shown !== currentMsg) {
      setShown(currentMsg);
      setIsTyping(false);
      return;
    }

    // 2) 다음 줄 또는 완료
    if (idx < total - 1) {
      playAdvance();
      setIdx((v) => v + 1);
    } else {
      playAdvance();
      onComplete();
      setIdx(0);
      setShown("");
      onClose?.();
    }
  }, [isOpen, isTyping, shown, currentMsg, idx, total, onComplete, onClose]);

  // 키 핸들링
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        completeOrNext();
      } else if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, completeOrNext, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      role="dialog"
      aria-modal="true"
      // 오버레이: 그라데이션 + 블러 + 비네팅
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        bgGradient:
          "linear(to-b, rgba(0,0,0,0.65), rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.75))",
        backdropFilter: "blur(3px)",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        boxShadow: "inset 0 0 140px rgba(0,0,0,0.6)",
      }}
      onClick={overlayClickAdvance ? completeOrNext : undefined}
    >
    <Flex
      position="absolute"
      left="50%"
      bottom={`max(16px, env(safe-area-inset-bottom))`}
      transform="translateX(-50%)"
      maxW="860px"
      w={["94%", "88%", "860px"]}
      // 카드: 연핑크 바탕 + 진한 보라 테두리
      bg={`${C.tileLight}F2`}                 // 약간 투명
      borderRadius="16px"
      border={`3px solid ${C.border}`}
      boxShadow={`0 14px 40px ${C.shadow}, 0 4px 12px ${C.shadow}`}
      overflow="hidden"
      // 말풍선 꼬리
      _after={{
        content: '""',
        position: "absolute",
        bottom: "-12px",
        left: "80px",
        borderWidth: "12px 10px 0 10px",
        borderStyle: "solid",
        borderColor: `${C.border} transparent transparent transparent`,
        filter: `drop-shadow(0 2px 2px ${C.shadow})`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <HStack align="stretch" spacing={0} w="100%">
        {/* 아바타 영역 */}
        <Flex
            align="center"
            justify="center"
            p={[3, 4]}
            minW={["88px", "110px"]}
            bg="transparent"            // 배경도 깔끔히
          >
            <Image
              src={avatarSrc}
              alt="avatar"
              boxSize={["68px", "86px"]}
              objectFit="contain"       // 픽셀/일러스트 비율 유지
              borderRadius="0"          // ← 원 제거 (완전 네모)
              draggable={false}
            />
          </Flex>
        {/* 텍스트 영역 */}
        <VStack align="stretch" spacing={0} flex={1} pr={[2, 3, 4]} py={[2, 3]}>
          {/* 리본 타이틀 */}
          {/* 제목: 리본 박스 제거, 검정 텍스트, 크기 업 */}
          <Text
            fontWeight="bold"
            color="#000"
            fontSize={["sm","sm","md"]}   // 기존 ["sm","sm","md"] → 키움
            mt={[2, 3]}
            mb={[2, 3]}
          >
            {title}
          </Text>

          {/* 메시지 본문: 검정 텍스트, 크기 약간 키움 */}
          <Box pb={[2, 3]} pr={[1, 2]}>
            <Text
              fontSize={["md","lg"]}       // 기존 ["md","lg"] → 한 단계 업
              color="#000"
              lineHeight="1.7"             // 가독성 약간 증가
              whiteSpace="pre-wrap"
              userSelect="none"
            >
              {shown}
              {/* 커서: 검정으로 통일 */}
              <Box
                as="span"
                ml="6px"                    // 글자와 살짝 띄움
                display="inline-block"
                w="10px"
                h="1em"
                transform="translateY(2px)"
                bg="#000"
                opacity={isTyping ? 1 : 0}
                animation={prefersReducedMotion ? undefined : "blink 1s steps(2, start) infinite"}
              />
            </Text>
          </Box>


          {/* 하단 UI */}
          <Flex align="center" justify="space-between" pb={[2, 3]} pr={[1, 2]}>
            <Text fontSize="xs" color={`${C.ink}B3`}>
              {idx + 1} / {total}
            </Text>

            <Flex
              align="center"
              gap={1}
              onClick={clickToAdvance ? completeOrNext : undefined}
              cursor={clickToAdvance ? "pointer" : "default"}
              userSelect="none"
            >
              <Text
                fontSize="sm"
                color={`${C.ink}CC`}
                mr={1}
                opacity={0.95}
                animation={prefersReducedMotion ? undefined : "pulse 1.6s ease-in-out infinite"}
              >
                Press Enter
              </Text>
              <Icon
                as={FiChevronRight}
                boxSize={5}
                color={C.ink}
                animation={prefersReducedMotion ? undefined : "nudge 1.2s ease-in-out infinite"}
              />
            </Flex>
          </Flex>
        </VStack>
      </HStack>
    </Flex>


      {/* keyframes */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.65; transform: translateZ(0); }
          50% { opacity: 1; transform: translateZ(0) scale(1.02); }
          100% { opacity: 0.65; transform: translateZ(0); }
        }
        @keyframes nudge {
          0% { transform: translateX(0); }
          50% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </Box>
  );
}
