import { useState } from "react";
import {
  Box, Button, HStack, VStack, Text, Image, Modal, ModalOverlay, ModalContent, Tag, Icon,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import StageScene from "../../StageScene";
import DocDeunggi from "./DocDeunggi";
import DocBuilding from "./DocBuilding";
import DocContract from "./DocContract";

export type DocKey = "deunggi" | "building" | "contract";

const C = {
  primary: "#7E44A8",  
  accent:  "#FCCFDB",  
  mid:     "#A372C2",  
  dark:    "#121318",  
  panel:   "#1A1B22", 
  buddyTint: "#e1d2f9" 
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

export default function Mission2({ onResult }: { onResult: () => void }) {
  const [opened, setOpened] = useState<DocKey | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<DocKey[]>([]);
  const [buddyMsg, setBuddyMsg] = useState("중개인이 제시한 서류를 꼼꼼히 살펴보세요.");

  const docs = [
    { key: "deunggi" as const,  name: "등기부등본",   img: "/assets/quest3_scenes/deunggi.png" },
    { key: "building" as const, name: "건축물대장",   img: "/assets/quest3_scenes/building.png" },
    { key: "contract" as const, name: "임대차계약서", img: "/assets/quest3_scenes/contract.png" },
  ];

  const openDoc  = (k: DocKey) => setOpened(k);
  const markChecked = (k: DocKey) => {
    setCheckedDocs((prev) => (prev.includes(k) ? prev : [...prev, k]));
    setOpened(null);
  };

  const allDone = checkedDocs.length === docs.length;

  return (
    <StageScene bg="/assets/background/quest_back.png" width={1100}>
      {/* 아우터 픽셀 프레임 */}
      <Box
        w="min(1100px, 95vw)"
        h="720px"
        position="relative"
        bg={C.panel}
        color="white"
        {...pixelBorder(C.primary, C.mid)}
      >
        {/* 상단 타이틀 바 */}
        <Box
          h="36px"
          bg={C.primary}
          px={4}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text fontFamily="NeoDGM" fontSize="20px">[MISSION 2] 계약 관련 서류 점검하기</Text>
          <Tag bg={C.accent} color={C.primary} fontFamily="NeoDGM" {...pixelBorder(C.primary, C.primary)}>
            완료 {checkedDocs.length}/{docs.length}
          </Tag>
        </Box>

        {/* 안내 바 */}
        <Box
          bg={C.dark}
          px={4}
          py={2}
          position="absolute"
          left="12px"
          right="12px"
          top="52px"
        >
          <Text fontSize="15px" fontFamily="NeoDGM">
            중개인이 제시한 서류를 꼼꼼히 살펴보고, 의심스러운 점이 있다면 수정을 요청하세요.
          </Text>
        </Box>

        {/* 썸네일 3개 영역 */}
        <HStack
          position="absolute"
          left="12px"
          right="12px"
          top="110px"
          spacing={6}
          justify="center"
        >
          {docs.map((doc) => {
            const done = checkedDocs.includes(doc.key);
            return (
              <Box
                key={doc.key}
                position="relative"
                cursor="pointer"
                onClick={() => openDoc(doc.key)}
                transform={done ? "scale(1.04)" : "none"}
                transition="transform 120ms"
                bg="#0e0f14"
                {...pixelBorder(C.mid, C.primary)}
                _hover={{ transform: "scale(1.03)" }}
              >
                {/* 체크 뱃지 */}
                {done && (
                  <HStack position="absolute" top="8px" right="8px" bg="rgba(0,0,0,0.6)" px="8px" py="2px" borderRadius="8px" spacing={1}>
                    <Icon as={CheckCircleIcon} color="#3DBE8B" />
                    <Text fontSize="xs" fontFamily="NeoDGM">확인됨</Text>
                  </HStack>
                )}
                <Image src={doc.img} w="280px" h="180px" objectFit="cover" draggable={false} />
                <Box px={3} py={2}>
                  <Text textAlign="center" fontFamily="NeoDGM" color="#EDEDF2">
                    {doc.name}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </HStack>

        {/* 하단 버디 바(디자인 통일: 말풍선 톤) */}
        <Box
          position="absolute"
          left="12px"
          right="12px"
          bottom="64px"
          bg={`${C.buddyTint}E6`}
          color="#2b2250"
          border="0"
          borderRadius="14px"
          px={4}
          py={3}
          boxShadow="0 8px 22px rgba(0,0,0,0.4)"
          sx={{ backdropFilter: "blur(2px)" }}
        >
          <HStack spacing={3}>
            <Image src="/assets/quest3_scenes/buddy.png" w="48px" draggable={false} />
            <Text fontFamily="NeoDGM" whiteSpace="pre-wrap">{buddyMsg}</Text>
          </HStack>
        </Box>

        {/* 하단 액션 바 */}
        <HStack
          position="absolute"
          bottom="12px"
          left="12px"
          right="12px"
          justify="flex-end"
          bg={C.dark}
          px={3}
          py={2}
        >
          <Button
            colorScheme="purple"
            fontFamily="NeoDGM"
            isDisabled={!allDone}
            onClick={onResult}
            bg={allDone ? C.accent : "gray.600"}
            color={allDone ? C.primary : "gray.200"}
            _hover={{ bg: allDone ? C.accent : "gray.600" }}
            {...pixelBorder(C.primary, C.primary)}
          >
            미션 완료
          </Button>
        </HStack>
      </Box>

      <Modal isOpen={!!opened} onClose={() => setOpened(null)} size="6xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.75)" sx={{ backdropFilter: "blur(3px)" }} />
        <ModalContent bg="transparent" boxShadow="none" p={0}>
          {opened === "deunggi"  && <DocDeunggi  onComplete={() => markChecked("deunggi")}  setBuddyMsg={setBuddyMsg} />}
          {opened === "building" && <DocBuilding onComplete={() => markChecked("building")} setBuddyMsg={setBuddyMsg} />}
          {opened === "contract" && <DocContract onComplete={() => markChecked("contract")} setBuddyMsg={setBuddyMsg} />}
        </ModalContent>
      </Modal>
    </StageScene>
  );
}
