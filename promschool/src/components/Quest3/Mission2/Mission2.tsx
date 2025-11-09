// src/components/Mission2.tsx
import { useState } from "react";
import { Box, Button, HStack, VStack, Text, Image, Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";
import StageScene from "../../StageScene";
import DocDeunggi from "./DocDeunggi";
import DocBuilding from "./DocBuilding";
import DocContract from "./DocContract";
export type DocKey = "deunggi" | "building" | "contract";

export default function Mission2({ onResult }: { onResult: () => void }) {
  const [opened, setOpened] = useState<DocKey | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<DocKey[]>([]);
  const [buddyMsg, setBuddyMsg] = useState("중개인이 제시한 서류를 꼼꼼히 살펴보세요.");

  const docs = [
    { key: "deunggi" as const,  name: "등기부등본",     img: "/assets/quest3_scenes/deunggi.png" },
    { key: "building" as const, name: "건축물대장",     img: "/assets/quest3_scenes/building.png" },
    { key: "contract" as const, name: "임대차계약서",   img: "/assets/quest3_scenes/contract.png" },
  ];

  const openDoc  = (k: DocKey) => setOpened(k);
  const markChecked = (k: DocKey) => {
    setCheckedDocs((prev) => (prev.includes(k) ? prev : [...prev, k]));
    setOpened(null);
  };

  const allDone = checkedDocs.length === docs.length;

  return (
    <StageScene bg="/assets/quest3_scenes/desk_bg.png" width={980}>
      <VStack
        align="stretch"
        bg="rgba(0,0,0,0.35)"
        border="1px solid rgba(255,255,255,0.15)"
        borderRadius="12px"
        p={4}
        color="white"
      >
        <VStack spacing={1} textAlign="center">
          <Text fontSize="xl" fontWeight="bold">[MISSION 2] 계약 관련 서류 점검하기</Text>
          <Text>중개인이 제시한 서류를 꼼꼼히 살펴보고, 의심스러운 점이 있다면 수정을 요청하세요.</Text>
        </VStack>

        {/* 썸네일 3개 */}
        <HStack justify="center" spacing={8} pt={4} pb={2}>
          {docs.map((doc) => (
            <Box
              key={doc.key}
              onClick={() => openDoc(doc.key)}
              cursor="pointer"
              transform={checkedDocs.includes(doc.key) ? "scale(1.04)" : "none"}
              transition="transform 120ms"
            >
              <Image src={doc.img} w="220px" borderRadius="8px" shadow="md" />
              <Text textAlign="center" mt={2}>
                {doc.name} {checkedDocs.includes(doc.key) ? "✅" : ""}
              </Text>
            </Box>
          ))}
        </HStack>

        {/* 하단 버디 바(간단 버전, 말풍선은 나중에 교체) */}
        <Box bg="rgba(0,0,0,0.5)" px={4} py={3} borderRadius="10px">
          <HStack spacing={3}>
            <Image src="/assets/quest3_scenes/buddy.png" w="48px" />
            <Text>{buddyMsg}</Text>
          </HStack>
        </Box>

        {/* 완료 버튼 */}
        {allDone && (
          <HStack justify="flex-end">
            <Button colorScheme="purple" onClick={onResult}>미션 완료</Button>
          </HStack>
        )}
      </VStack>

      {/* 문서 상세 모달 (기존 로직 그대로) */}
      <Modal isOpen={!!opened} onClose={() => setOpened(null)} size="6xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.85)" />
        <ModalContent bg="transparent" boxShadow="none" p={0}>
          {opened === "deunggi"  && <DocDeunggi  onComplete={() => markChecked("deunggi")}  setBuddyMsg={setBuddyMsg} />}
          {opened === "building" && <DocBuilding onComplete={() => markChecked("building")} setBuddyMsg={setBuddyMsg} />}
          {opened === "contract" && <DocContract onComplete={() => markChecked("contract")} setBuddyMsg={setBuddyMsg} />}
        </ModalContent>
      </Modal>
    </StageScene>
  );
}
