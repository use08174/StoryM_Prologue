// src/components/Quest3/Mission2/DocBuilding.tsx
import { useState } from "react";
import { Box, Button, Image, VStack, Text, HStack } from "@chakra-ui/react";
import MessageModalQuest3, { Mission2Scene } from "./MessageModalQuest3Mission2";

type Props = {
  onComplete: () => void;
  setBuddyMsg?: (msg: string) => void; // 선택
};

const C = { primary:"#7E44A8", accent:"#FCCFDB", mid:"#A372C2" };
const pixelBorder = (outer=C.primary, inner=C.mid)=>({
  border:"0",
  boxShadow:`0 0 0 2px ${outer}, 0 0 0 4px ${inner}, inset 0 0 0 2px ${inner}`,
  borderRadius:"0",
});

type Step = "main" | "위반건축물" | "주소" | "소유자" | "용도";

export default function DocBuilding({ onComplete, setBuddyMsg }: Props) {
  const [step, setStep] = useState<Step>("main");

  // 메시지 모달 상태 (인트로 자동 표시)
  const [showMsg, setShowMsg] = useState(true);
  const [scene, setScene] = useState<Mission2Scene>("building_intro");

  const openScene = (s: Mission2Scene, buddyTip?: string) => {
    setScene(s);
    setShowMsg(true);
    if (buddyTip && setBuddyMsg) setBuddyMsg(buddyTip);
  };

  return (
    <VStack spacing={5} bg="rgba(20,20,20,0.95)" p={6} {...pixelBorder()}>
      <Text color={C.accent} fontWeight="bold" fontFamily="NeoDGM" fontSize="lg">
        건축물대장
      </Text>

      {step === "main" && (
        <>
          <Image src="/assets/quest3_scenes/building.png" w="750px" />

          <HStack spacing={4} mt={2}>
            <Button
              onClick={() => { setStep("위반건축물"); openScene("building", "‘위반건축물’ 표기가 있는지 먼저 확인해!"); }}
              bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}
            >
              위반건축물 여부
            </Button>

            <Button
              onClick={() => { setStep("주소"); openScene("building_address", "건축물대장 주소 ↔ 등기부등본 주소가 일치해야 해."); }}
              bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}
            >
              대상물 주소
            </Button>

            <Button
              onClick={() => { setStep("소유자"); openScene("building_owner", "소유자 정보가 임대인 신분증/등기부와 같은지 확인!"); }}
              bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}
            >
              소유자 확인
            </Button>

            <Button
              onClick={() => { setStep("용도"); openScene("building_usage", "주용도가 주거용인지 꼭 확인!"); }}
              bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}
            >
              주용도 확인
            </Button>
          </HStack>

          <Button colorScheme="teal" mt={4} onClick={onComplete} {...pixelBorder()}>
            건축물대장 점검 완료
          </Button>
        </>
      )}

      {step === "위반건축물" && (
        <>
          <Image src="/assets/quest3_scenes/building.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder()}>이전으로</Button>
        </>
      )}

      {step === "주소" && (
        <>
          <Image src="/assets/quest3_scenes/building_address.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder()}>이전으로</Button>
        </>
      )}

      {step === "소유자" && (
        <>
          <Image src="/assets/quest3_scenes/building_owner.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder()}>이전으로</Button>
        </>
      )}

      {step === "용도" && (
        <>
          <Image src="/assets/quest3_scenes/building_usage.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder()}>이전으로</Button>
        </>
      )}

      {/* 💬 메시지 모달 */}
      <MessageModalQuest3
        isOpen={showMsg}
        onComplete={() => setShowMsg(false)}
        onClose={() => setShowMsg(false)}
        scene={scene} // building_intro | building_violation | building_address | building_owner | building_usage
      />
    </VStack>
  );
}
