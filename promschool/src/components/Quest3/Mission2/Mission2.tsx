import { useState } from "react";
import { Box, Button, HStack, VStack, Text, Image, Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";
import DocDeunggi from "./DocDeunggi";
import DocBuilding from "./DocBuilding";
import DocContract from "./DocContract";

export type DocKey = "deunggi" | "building" | "contract";

const Mission2 = ({ onResult }: { onResult: () => void }) => {
  const [opened, setOpened] = useState<DocKey | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<DocKey[]>([]);
  const [buddyMsg, setBuddyMsg] = useState("중개인이 제시한 서류를 꼼꼼히 살펴보세요.");

  const docs: { key: DocKey; name: string; img: string }[] = [
    { key: "deunggi", name: "등기부등본", img: "/assets/quest3_scenes/deunggi_thumb.png" },
    { key: "building", name: "건축물대장", img: "/assets/quest3_scenes/building_thumb.png" },
    { key: "contract", name: "임대차계약서", img: "/assets/quest3_scenes/contract_thumb.png" },
  ];

  const openDoc = (key: DocKey) => {
    setOpened(key);
    setBuddyMsg(`${docs.find(d => d.key === key)?.name}을 살펴볼까요?`);
  };

  const markChecked = (key: DocKey) => {
    if (!checkedDocs.includes(key)) setCheckedDocs(prev => [...prev, key]);
    setOpened(null);
    setBuddyMsg(`${docs.find(d => d.key === key)?.name} 점검 완료!`);
  };

  const allDone = checkedDocs.length === 3;

  return (
    <Box bgImage="/assets/quest3_scenes/desk_bg.png" bgSize="cover" w="100vw" h="100vh" position="relative">
      <VStack pt={6}>
        <Text fontSize="2xl" fontWeight="bold" color="yellow.300">[MISSION 2] 계약 관련 서류 점검하기</Text>
        <Text color="white">중개인이 제시한 서류를 꼼꼼히 살펴보고, 의심스러운 점이 있다면 수정을 요청하세요.</Text>
      </VStack>

      {/* 문서 목록 */}
      <HStack justify="center" spacing={8} mt={10}>
        {docs.map((doc) => (
          <Box
            key={doc.key}
            onClick={() => openDoc(doc.key)}
            cursor="pointer"
            transform={checkedDocs.includes(doc.key) ? "scale(1.05)" : "none"}
            boxShadow={checkedDocs.includes(doc.key) ? "0 0 15px 3px rgba(255,255,150,0.8)" : "lg"}
            borderRadius="md"
          >
            <Image src={doc.img} w="220px" />
            <Text textAlign="center" color="white" mt={2}>{doc.name}</Text>
          </Box>
        ))}
      </HStack>

      {/* 버디 대화창 */}
      <Box position="absolute" bottom="0" w="100%" bg="rgba(0,0,0,0.7)" py={3} px={6} display="flex" alignItems="center">
        <Image src="/assets/quest3_scenes/buddy.png" w="60px" mr={4} />
        <Text color="white">{buddyMsg}</Text>
      </Box>

      {allDone && (
        <Button
          position="absolute"
          right="30px"
          bottom="90px"
          colorScheme="teal"
          onClick={onResult}
        >
          미션 완료
        </Button>
      )}

      {/* 문서 상세 모달 */}
      <Modal isOpen={!!opened} onClose={() => setOpened(null)} size="6xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.85)" />
        <ModalContent bg="transparent" boxShadow="none" p={0}>
          {opened === "deunggi" && <DocDeunggi onComplete={() => markChecked("deunggi")} setBuddyMsg={setBuddyMsg} />}
          {opened === "building" && <DocBuilding onComplete={() => markChecked("building")} setBuddyMsg={setBuddyMsg} />}
          {opened === "contract" && <DocContract onComplete={() => markChecked("contract")} setBuddyMsg={setBuddyMsg} />}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Mission2;
