import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  HStack,
  Button,
  Image,
} from "@chakra-ui/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;     // 메인으로 (Space 힌트 띄우기 등은 상위에서 처리)
  onOpenChat: () => void;  // 챗봇 바로 열기
};

const C = { primary: "#7E44A8", accent: "#FCCFDB" };

export default function PhoneIntroModal({ isOpen, onClose, onOpenChat }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="#121318"
        color="white"
        border={`2px solid ${C.primary}`}
        borderRadius="xl"
      >
        <ModalHeader fontFamily="NeoDGM">📱 StoryM 사용법 안내</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <HStack spacing={3}>
              <Image src="/assets/sprites/storym_chat.png" alt="chat" boxSize="42px" />
              <Text fontSize="md" lineHeight="1.6">
                상단의 <b style={{ color: C.accent }}>챗봇 아이콘</b>을 클릭하면
                언제든지 챗봇을 열어서 궁금한 부분을 질문할 수 있어.<br />뉴스 아이콘을 누르면 서류 확인, 계약 팁, 정책 추천을 실시간으로 도와줄게!
              </Text>
            </HStack>

            <Text fontSize="md" lineHeight="1.6">
              자, 이제 메인으로 돌아가서 <b>Space</b> 키를 눌러 <b>퀘스트 1</b>을 시작해 볼까?
            </Text>

            <HStack justify="flex-end" spacing={3} mt={2}>
              <Button onClick={onOpenChat} colorScheme="purple" variant="solid">
                챗봇 바로 열기
              </Button>
              <Button onClick={onClose} colorScheme="teal" variant="outline">
                메인으로 (Space 시작)
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
