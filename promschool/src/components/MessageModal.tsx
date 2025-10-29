// components/MessageModal.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";

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
}

/** 기본 대사 (고정/변동비용 튜토) */
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
  avatarSrc = "/assets/sprites/npc_default.png", // 없으면 교체해서 쓰세요
  title = "메시지",
}: MessageModalProps) {
  const [idx, setIdx] = useState(0);

  const advance = useCallback(() => {
    if (!isOpen) return;
    if (idx < messages.length - 1) {
      setIdx((v) => v + 1);
    } else {
      onComplete();
      setIdx(0);
      onClose?.();
    }
  }, [idx, isOpen, messages.length, onComplete, onClose]);

  // Enter 키로 진행
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        advance();
      }
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, advance, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      // 어두운 오버레이
      bg="rgba(0,0,0,0.45)"
      // 오버레이 클릭 시에도 한 단계 진행 (원하지 않으면 onClick 제거)
      onClick={advance}
    >
      <Flex
        // 아래 중앙 말풍선
        position="absolute"
        left="50%"
        bottom="28px"
        transform="translateX(-50%)"
        maxW="780px"
        w={["92%", "86%", "780px"]}
        bg="rgba(255,255,255,0.95)"
        borderRadius="24px"
        boxShadow="xl"
        border="2px solid #815b3a"
        // 내부 클릭은 버블링 막아 진행되지 않게
        onClick={(e) => e.stopPropagation()}
      >
        {/* 좌측 아바타 영역 */}
        <HStack align="stretch" spacing={0} w="100%">
          <Flex
            align="center"
            justify="center"
            p={4}
            minW="96px"
          >
            <Image
              src={avatarSrc}
              alt="avatar"
              boxSize="72px"
              objectFit="contain"
            />
          </Flex>

          {/* 말풍선 본문 */}
          <VStack align="stretch" spacing={0} flex={1} pr={4} py={3}>
            {/* 상단 제목 리본 느낌 */}
            <Box
              alignSelf="flex-start"
              bg="#f6e7cf"
              border="2px solid #815b3a"
              borderRadius="12px"
              px={3}
              py={1}
              mt={2}
              mb={3}
              boxShadow="sm"
            >
              <Text fontWeight="bold" color="#5b4633" fontSize="sm">
                {title}
              </Text>
            </Box>

            {/* 메시지 텍스트 */}
            <Box pb={3} pr={2}>
              <Text
                fontSize="md"
                color="gray.800"
                lineHeight="1.6"
                whiteSpace="pre-wrap"
              >
                {messages[idx]}
              </Text>
            </Box>

            {/* 하단 힌트 */}
            <Flex justify="flex-end" align="center" pb={2} pr={1}>
              <Text fontSize="sm" color="gray.500">
                Enter 키로 다음 ▶
              </Text>
            </Flex>
          </VStack>
        </HStack>
      </Flex>
    </Box>
  );
}
