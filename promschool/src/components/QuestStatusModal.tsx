// src/components/QuestStatusModal.tsx
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Tag,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { CheckCircleIcon, LockIcon, TimeIcon } from "@chakra-ui/icons";

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

type QuestStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentQuest: number; // 1~3
};

export default function QuestStatusModal({
  isOpen,
  onClose,
  currentQuest,
}: QuestStatusModalProps) {
  const quests = [
    { id: 1, title: "예산 정하기", desc: "월세/전세, 보증금, 관리비 등을 고려해 예산 설정" },
    { id: 2, title: "집 확인하기", desc: "누수, 소음, 창문 틈 확인하기 미션" },
    { id: 3, title: "부동산 찾아가기", desc: "계약서 속 위험 단어 체크 미션" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={C.panel} color={C.accent} {...pixelBorder(C.primary, C.mid)} maxW="720px">
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
        
        <ModalHeader pt="10px" pb="0" fontFamily="NeoDGM" letterSpacing="0.5px">
          퀘스트 진행 현황
        </ModalHeader>

        <ModalBody pt="14px" pb="16px">
          <VStack spacing={3} align="stretch">
            {quests.map((q) => {
              const unlocked = q.id <= currentQuest;
              const isCurrent = q.id === currentQuest;

              return (
                <Box
                  key={q.id}
                  bg={C.dark}
                  p="12px"
                  {...pixelBorder(unlocked ? C.primary : "#3b2c49", C.mid)}
                >
                  <HStack justify="space-between" align="start">
                    <Box>
                      <HStack spacing={2} mb={1}>
                        <Text
                          fontWeight="bold"
                          color={C.accent}
                          fontFamily="NeoDGM"
                          fontSize="14px"
                        >
                          퀘스트 {q.id}. {q.title}
                        </Text>
                        
                      </HStack>

                      <Text fontSize="13px" color="#CFCFD6" fontFamily="NeoDGM">
                        {q.desc}
                      </Text>
                    </Box>

                    <Icon
                      as={unlocked ? (isCurrent ? TimeIcon : CheckCircleIcon) : LockIcon}
                      boxSize={6}
                      color={unlocked ? C.accent : "#9A90A8"}
                    />
                  </HStack>

                  {q.id < quests.length && <Divider mt={3} borderColor="#2e2f3a" />}
                </Box>
              );
            })}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
