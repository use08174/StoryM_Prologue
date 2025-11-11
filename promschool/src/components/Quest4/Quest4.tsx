import { useState } from "react";
import { Box, Button, VStack, Text, Image, Link } from "@chakra-ui/react";
import MessageModalQuest3 from "../Quest3/Mission2/MessageModalQuest3Mission2";
import type { Mission2Scene } from "../Quest3/Mission2/MessageModalQuest3Mission2";

const C = { primary:"#7E44A8", accent:"#FCCFDB", mid:"#A372C2", dark:"#121318", panel:"#1A1B22" };
const pixelBorder = (outer=C.primary, inner=C.mid)=>({
  border:"0",
  boxShadow:`0 0 0 2px ${outer}, 0 0 0 4px ${inner}, inset 0 0 0 2px ${inner}`,
  borderRadius:"0",
});

type Props = {
  onClose: () => void;
  onFinish: () => void; // 퀘스트3 전체 완료 시 호출
};

export default function Quest4({ onFinish }: Props) {
  const [step, setStep] = useState<"intro" | "visit" | "online" | "done">("intro");
  const [showMsg, setShowMsg] = useState(true);
  const [scene, setScene] = useState<Mission2Scene>("transfer_intro");

  const openScene = (s: Mission2Scene) => {
    setScene(s);
    setShowMsg(true);
  };

  const handleVisit = () => {
    setStep("visit");
    openScene("transfer_visit");
  };

  const handleOnline = () => {
    setStep("online");
    openScene("transfer_online");
  };

  const handleDone = () => {
    setStep("done");
    openScene("transfer_complete");
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1001}
      bg="blackAlpha.800"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="white"
    >
      <VStack spacing={6} bg={C.panel} p={8}  {...pixelBorder()}>
        {/* ① 인트로 */}
        {step === "intro" && (
          <>
            <Text fontSize="2xl" fontWeight="bold" color={C.accent}>전입신고 완료하기</Text>
            <Text textAlign="center" color="gray.200">
              아직 한 단계가 남았어요! 주민센터에 방문하거나 온라인으로 전입신고를 완료해요.
            </Text>

            <Button
              bg={C.accent}
              color={C.primary}
              onClick={handleVisit}
              {...pixelBorder()}
            >
              🏛️ 주민센터 방문하기
            </Button>

            {/* 🔗 보조 안내: 정부24 */}
            <Box textAlign="center" pt={2}>
              <Text fontSize="sm" color="gray.400" mb={1}>
                방문이 어렵다면 온라인으로도 가능해요.
              </Text>
              <Button
                variant="outline"
                borderColor={C.accent}
                color={C.accent}
                onClick={handleOnline}
                {...pixelBorder(C.accent, C.mid)}
              >
                💻 정부24 전입신고 바로가기
              </Button>
            </Box>
          </>
        )}

        {/* ② 주민센터 방문 */}
        {step === "visit" && (
          <VStack spacing={4}>
            <Image src="/assets/quest4_scenes/office.png" w="650px" />
            <Text>담당 공무원: 안녕하세요. 전입신고서와 주민등록증 보여주세요.</Text>
            <Button onClick={() => openScene("transfer_stamp")} colorScheme="purple" {...pixelBorder()}>
              전입신고서 작성하기
            </Button>
            <Button onClick={handleDone} colorScheme="teal" {...pixelBorder()}>
              확정일자 도장 받기
            </Button>
          </VStack>
        )}

        {/* ③ 온라인 전입신고 (미리보기 + 실제 링크) */}
        {step === "online" && (
          <VStack spacing={5}>
            <Text fontSize="lg" color={C.accent}>정부24 전입신고 화면 미리보기</Text>
            <Image
              src="/assets/quest4_scenes/gov24_preview.png"
              w="700px"
              borderRadius="md"
              border="2px solid #444"
              alt="정부24 전입신고 페이지 미리보기"
            />
            <Text fontSize="sm" color="gray.300">
              실제로는 아래 버튼을 클릭하면 새 탭에서 정부24 사이트로 이동해요.
            </Text>
            <Link
              href="https://www.gov.kr"
              isExternal
              _hover={{ textDecoration: "none" }}
            >
              <Button
                bg={C.accent}
                color={C.primary}
                size="lg"
                {...pixelBorder(C.primary, C.mid)}
              >
                🔗 실제 정부24 전입신고 페이지 열기
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDone} {...pixelBorder()}>
              완료로 돌아가기
            </Button>
          </VStack>
        )}

        {/* ④ 완료 */}
        {step === "done" && (
          <VStack spacing={5}>
            <Text fontSize="2xl" fontWeight="bold" color="teal.300">
              [전입신고 및 확정일자 완료!]
            </Text>
            <Text textAlign="center" color="gray.200">
              전입신고와 확정일자까지 모두 완료했습니다.  
              이제 진짜 내 이름으로 된 안전한 보금자리가 되었어요 🏠
            </Text>
            <Button colorScheme="teal" onClick={onFinish}>닫기</Button>
          </VStack>
        )}
      </VStack>

      {/* 💬 메시지 모달 */}
      <MessageModalQuest3
        isOpen={showMsg}
        onClose={() => setShowMsg(false)}
        onComplete={() => setShowMsg(false)}
        scene={scene}
      />
    </Box>
  );
}
