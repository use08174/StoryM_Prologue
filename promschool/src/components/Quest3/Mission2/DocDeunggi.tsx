// src/components/Quest3/Mission2/DocDeunggi.tsx
import { useState } from "react";
import { Box, Button, Image, VStack, Text, HStack } from "@chakra-ui/react";
import MessageModalQuest3, { Mission2Scene } from "./MessageModalQuest3Mission2";

type Props = {
  onComplete: () => void;
  setBuddyMsg?: (msg: string) => void; // 지금은 미사용
};

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

type Step = "main" | "표제부" | "갑구" | "을구";

export default function DocDeunggi({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("main");

  // ✅ 메시지 모달 상태 + 장면 키
  const [showMsg, setShowMsg] = useState(true);                            // 진입 시 인트로 바로 표시
  const [scene, setScene] = useState<Mission2Scene>("deunggi_intro");      // 기본: 등기부 인트로

  // ✅ 특정 scene을 열어주는 헬퍼
  const openScene = (s: Mission2Scene) => {
    setScene(s);
    setShowMsg(true);
  };

  return (
    <VStack spacing={5} bg="rgba(20,20,20,0.95)" p={6} {...pixelBorder(C.primary, C.mid)}>
      <Text color={C.accent} fontWeight="bold" fontFamily="NeoDGM" fontSize="lg">
        등기부등본
      </Text>

      {/* 본문 */}
      {step === "main" && (
        <>
          <Image src="/assets/quest3_scenes/deunggi.png" w="750px" />

          {/* 가로 배치된 버튼 */}
          <HStack spacing={4} mt={2}>
            <Button
              onClick={() => {
                setStep("표제부");
                openScene("deunggi_pyojabu"); // ✅ 표제부 대사
              }}
              bg={C.accent}
              color={C.primary}
              _hover={{ bg: C.accent }}
              {...pixelBorder(C.primary, C.primary)}
            >
              표제부 보기
            </Button>
            <Button
              onClick={() => {
                setStep("갑구");
                openScene("deunggi_gapgu"); // ✅ 갑구 대사
              }}
              bg={C.accent}
              color={C.primary}
              _hover={{ bg: C.accent }}
              {...pixelBorder(C.primary, C.primary)}
            >
              갑구 보기
            </Button>
            <Button
              onClick={() => {
                setStep("을구");
                openScene("deunggi_eulgu"); // ✅ 을구 대사
              }}
              bg={C.accent}
              color={C.primary}
              _hover={{ bg: C.accent }}
              {...pixelBorder(C.primary, C.primary)}
            >
              을구 보기
            </Button>
          </HStack>

          <Button
            colorScheme="teal"
            mt={4}
            onClick={onComplete}
            {...pixelBorder(C.primary, C.primary)}
          >
            등기부등본 점검 완료
          </Button>
        </>
      )}

      {/* 개별 보기 화면 */}
      {step === "표제부" && (
        <>
          <Image src="/assets/quest3_scenes/deunggi_pyojabu.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder(C.primary, C.primary)}>
             이전으로
          </Button>
        </>
      )}
      {step === "갑구" && (
        <>
          <Image src="/assets/quest3_scenes/deunggi_ga.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder(C.primary, C.primary)}>
            이전으로
          </Button>
        </>
      )}
      {step === "을구" && (
        <>
          <Image src="/assets/quest3_scenes/deunggi_ul.png" w="700px" />
          <Button onClick={() => setStep("main")} mt={3} {...pixelBorder(C.primary, C.primary)}>
            이전으로
          </Button>
        </>
      )}

      <MessageModalQuest3
        isOpen={showMsg}
        onComplete={() => setShowMsg(false)}
        onClose={() => setShowMsg(false)}
        scene={scene}
      />
    </VStack>
  );
}
