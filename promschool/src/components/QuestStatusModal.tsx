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
  Image,
  Icon,
} from "@chakra-ui/react";
import { CheckCircleIcon, LockIcon } from "@chakra-ui/icons";

type QuestStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentQuest: number; // 현재까지 진행한 퀘스트 번호 (1~3)
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={4} bg="white">
        <ModalHeader fontWeight="bold" textAlign="center">
          📜 퀘스트 진행 현황
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {quests.map((q) => {
              const unlocked = q.id <= currentQuest;
              return (
                <HStack
                  key={q.id}
                  justify="space-between"
                  p={3}
                  borderRadius="lg"
                  bg={unlocked ? "gray.50" : "gray.100"}
                  borderWidth={1}
                  borderColor={unlocked ? "green.300" : "gray.300"}
                >
                  <Box>
                    <Text fontWeight="bold">
                      퀘스트 {q.id}. {q.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {q.desc}
                    </Text>
                  </Box>
                  <Icon
                    as={unlocked ? CheckCircleIcon : LockIcon}
                    color={unlocked ? "green.400" : "gray.500"}
                    boxSize={6}
                  />
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
