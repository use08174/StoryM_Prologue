// src/components/PolicyTipIcon.tsx
import { useState, useEffect } from "react";
import {
  Box, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, List, ListItem, Text, useDisclosure,
  useToast, HStack, Button, Tag, keyframes
} from "@chakra-ui/react";
import { TopicType, YouthPolicyTip } from "../api/getYouthPolicyTip";
import { getYouthPolicyTip } from "../api/getYouthPolicyTip";

const C = {
  primary: "#7E44A8",
  accent: "#FCCFDB",
  mid: "#A372C2",
  dark: "#121318",
  panel: "#1A1B22",
};

const pixelBorder = (outer = C.primary, inner = C.mid) => ({
  border: "0",
  boxShadow: `
    0 0 0 2px ${outer},
    0 0 0 4px ${inner},
    inset 0 0 0 2px ${inner}
  `,
  borderRadius: "0",
});

// 픽셀 로딩 애니메이션
const blink = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
`;

type Props = {
  topicType: TopicType;
  topicName: string;
  characterId?: number;
  userId?: string;
  characterMeta?: { gender?: string; region?: string; job?: string };
  boxSize?: string;
  src?: string;
};

export default function PolicyTipIcon({
  topicType, topicName,
  characterId, userId, characterMeta,
  boxSize = "60px",
  src = "/assets/sprites/storym_scenario.png",
}: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<YouthPolicyTip | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getYouthPolicyTip({
          topicType, topicName, characterId, userId, characterMeta,
        });
        setTip(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail ?? e?.message ?? "잠시 후 다시 시도해주세요.";
        toast({ title: "Tip 불러오기 실패", description: msg, status: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, topicType, topicName, characterId, userId, characterMeta, toast]);

  return (
    <>
      {/* API 아이콘 (살짝 커지는 픽셀 버튼 느낌) */}
      <Box
        as="button"
        onClick={onOpen}
        cursor="pointer"
        _hover={{ transform: "scale(1.06)" }}
        transition="transform 80ms steps(4)"
      >
        <Image src={src} alt="info" boxSize={boxSize} pointerEvents="none" />
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(0px)" />
        <ModalContent
          bg={C.panel}
          color={C.accent}
          maxW="680px"
          {...pixelBorder(C.primary, C.mid)}
          position="relative"
        >
          {/* 상단 픽셀 바 */}
          <Box h="28px" bg={C.primary} />

          <ModalCloseButton
            sx={pixelBorder(C.accent, C.primary)}
            bg={C.accent}
            color={C.primary}
            _hover={{ bg: C.accent }}
            top="8px"
            right="8px"
          />

          <ModalHeader
            pt="10px"
            pb="0"
            fontFamily="neodgm"
            fontSize="20px"
            letterSpacing="0.5px"
            color={C.accent}
          >
            {tip?.title ?? "💡 청년정책 TIP"}
          </ModalHeader>

          <ModalBody pt="14px" pb="16px">
            {/* 헤더 라벨 영역 */}
            <HStack spacing={2} mb={4} flexWrap="wrap">
              <Tag size="sm" bg={C.mid} color="white"  {...pixelBorder(C.primary, C.primary)}>
                {topicType === "lclsf" ? "대주제" : "중주제"}
              </Tag>
              <Tag size="sm" bg={C.accent} color={C.primary} {...pixelBorder(C.primary, C.primary)}>
                {topicName}
              </Tag>
            </HStack>

            {/* 로딩 */}
            {loading && (
              <Box
                bg={C.dark}
                p="16px"
                {...pixelBorder(C.mid, C.primary)}
                fontFamily="neodgm"
                fontSize="20px"
                letterSpacing="0.5px"
              >
                LOADING
                <Box as="span" animation={`${blink} 1s infinite`} ml="2px">.</Box>
                <Box as="span" animation={`${blink} 1s infinite .15s`}>. </Box>
                <Box as="span" animation={`${blink} 1s infinite .3s`}>.</Box>
              </Box>
            )}

            {/* 내용 */}
            {!loading && tip && (
              <Box
                bg={C.dark}
                p="14px"
                {...pixelBorder(C.mid, C.primary)}
              >
                <List spacing={3}>
                  {tip.bullets.map((b, i) => (
                    <ListItem key={i}>
                      <HStack align="start" spacing={3}>
                        <Box
                          w="10px"
                          h="10px"
                          bg={C.accent}
                          boxShadow={`
                            0 0 0 2px ${C.primary},
                            0 0 0 4px ${C.mid}
                          `}
                          flexShrink={0}
                        />
                        <Box>
                          <Text
                            as="span"
                            fontWeight="bold"
                            color={C.accent}
                            fontFamily="neodgm"
                            fontSize="12px"
                          >
                            {i + 1}. {b.title}
                          </Text>
                          {b.summary && (
                            <Text mt="4px" fontSize="12px" color="#CFCFD6">
                              — {b.summary}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
