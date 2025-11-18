// src/components/Quest3.tsx
import { useState } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";
import Mission1 from "./Mission1";
import Mission2 from "./Mission2/Mission2";
import FinalizeContract from "./Mission2/FinalizeContract"; 
import MessageModalQuest3 from "./Mission2/MessageModalQuest3Mission2";

type Props = {
  onClose: () => void;
  onFinish: () => void; // 퀘스트3 전체 완료 시 호출
};

const C = { shadow: "rgba(0,0,0,0.55)" };


export default function Quest3({ onClose, onFinish }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [m1Result, setM1Result] = useState<boolean | null>(null);
  const [showM2Intro, setShowM2Intro] = useState(false); // ✅ 미션2 인트로 모달

  const handleMission1Result = (success: boolean) => {
    setM1Result(success);
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1001}
      bg="blackAlpha.800"
      w="100vw"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="white"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/assets/background/quest_back.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.34,
      }}
    >
      {/* STEP 1: 미션1 본게임 */}
      {step === 1 && m1Result === null && (
        <Mission1 onResult={handleMission1Result} />
      )}

      {/* STEP 1-RESULT: 성공 화면 → 버튼 누르면 미션2 인트로 모달 + 미션2로 */}
      {step === 1 && m1Result === true && (
        <VStack spacing={5}>
          <Text fontSize="2xl" fontWeight="bold" color="green.300">
            [MISSION 1. COMPLETE!]
          </Text>
          <Text fontSize="lg">계약에 필요한 준비를 잘 마쳤습니다!</Text>
          <Box bg="gray.700" p={4} borderRadius="lg" maxW="640px">
            <Text fontSize="sm">
              버디: 잘했어! 임대인이 신원과 경제력을 확인하기 위해 주민등록등본이나
              신용조회 결과서를 요청할 수도 있어. 단, 불필요한 개인정보를 요구할 땐 신중히 대응해야 해!
            </Text>
          </Box>
          <Button
            colorScheme="purple"
            fontFamily="NeoDGM"
            width={500}
            onClick={() => {
              setStep(2);          // ✅ 미션2 단계로 전환
              setShowM2Intro(true); // ✅ 미션2 안내 모달 열기
            }}
          >
            다음 미션으로
          </Button>
        </VStack>
      )}

      {/* STEP 1-RESULT: 실패 화면 → 다시 시도 */}
      {step === 1 && m1Result === false && (
        <VStack spacing={5}>
          <Text fontSize="2xl" fontWeight="bold" color="red.300">
            [MISSION 1. FAILED…]
          </Text>
          <Text fontSize="lg">
            불필요한 준비물이 포함되거나, 필요한 준비물이 선택되지 않았습니다.
          </Text>
          <Button colorScheme="orange" onClick={() => setM1Result(null)}>
            가방 다시 챙기기
          </Button>
        </VStack>
      )}

      {/* STEP 2: 미션2 진행 + 인트로 메시지 모달 */}
      {step === 2 && (
        <>
          <Mission2
            onResult={() => {
              setStep(3); // ✅ 미션2 완료 → 퀘스트3 완료 단계로
            }}
          />

          {/* 💬 미션2 설명용 메시지 모달 */}
          <MessageModalQuest3
            isOpen={showM2Intro}
            onComplete={() => setShowM2Intro(false)}
            onClose={() => setShowM2Intro(false)}
            messages={[
              "이제 실제 계약에 앞서, 서류들을 하나씩 점검해 볼게요.",
              "등기부등본, 건축물대장, 임대차계약서를 확인하면서 위험 요소가 없는지 직접 체크해봐.",
              "먼저 등기부등본부터 확인해볼까?",
            ]}
            avatarSrc="/assets/quest3_scenes/agent.png"
            title="부동산 중개인"
          />
        </>
      )}

      {/* STEP 3: 계약 완료하기 (원본 수령 + 송금 + 영수증) */}
      {step === 3 && (
        <FinalizeContract
          onFinished={() => {
            // 계약 절차 완료 → 최종 완료 화면
            setStep(4);
          }}
        />
      )}

      {/* STEP 4: 퀘스트3 전체 완료 */}
      {step === 4 && (
        <VStack spacing={5}>
          <Text fontSize="2xl" fontWeight="bold" color="teal.300">
            [QUEST 3 COMPLETE!]
          </Text>
          <Text fontSize="lg">모든 미션을 마쳤습니다. 수고했어요!</Text>
          <Button colorScheme="teal" onClick={onFinish}>
            닫기
          </Button>
        </VStack>
      )}
    </Box>
  );
}