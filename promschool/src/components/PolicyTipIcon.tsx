// src/components/PolicyTipIcon.tsx
import { useState, useEffect } from "react";
import {
  Box, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, List, ListItem, Text, Spinner,
  useDisclosure, useToast
} from "@chakra-ui/react";
import { TopicType, YouthPolicyTip } from "../api/getYouthPolicyTip";
import { getYouthPolicyTip } from "../api/getYouthPolicyTip";

type Props = {
  topicType: TopicType;          // "lclsf" | "mclsf"
  topicName: string;             // 예: "주거", "취업"  <-- 유지 필수
  // ↓ 캐릭터 객체는 제거하고, 선택적으로 ID/메타만 넘길 수 있게
  characterId?: number;          // /llm/chat에서 사용할 캐릭터 ID
  userId?: string;               // /llm/chat에서 사용할 유저 ID
  characterMeta?: { gender?: string; region?: string; job?: string }; // 추출 프롬프트용(선택)
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
          topicType,
          topicName,          // 필수
          characterId,        // 선택
          userId,             // 선택
          characterMeta,      // 선택
        });
        setTip(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail ?? e?.message ?? "잠시 후 다시 시도해주세요.";
        toast({ title: "Tip 불러오기 실패", description: msg, status: "error" });
      } finally {
        setLoading(false);
      }
    })();
  // 의존성에 ID/메타도 포함
  }, [isOpen, topicType, topicName, characterId, userId, characterMeta, toast]);

  return (
    <>
      <Box as="button" onClick={onOpen} cursor="pointer" _hover={{ transform: "scale(1.06)" }}>
        <Image src={src} alt="info" boxSize={boxSize} pointerEvents="none" />
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{tip?.title ?? "청년정책 Tip"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            {loading && (
              <Box display="flex" gap="8px" alignItems="center">
                <Spinner /> <Text>불러오는 중…</Text>
              </Box>
            )}
            {!loading && tip && (
              <List spacing={2}>
                {tip.bullets.map((b, i) => (
                  <ListItem key={i}>
                    <Text as="span" fontWeight="semibold">{i + 1}. {b.title}</Text>
                    {b.summary && <Text fontSize="sm" color="gray.600">— {b.summary}</Text>}
                  </ListItem>
                ))}
              </List>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
