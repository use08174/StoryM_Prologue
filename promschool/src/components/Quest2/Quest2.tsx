// src/components/Quest2/Quest2.tsx
import { useEffect, useRef, useState } from "react";
import { Box, Text, Button, HStack } from "@chakra-ui/react";
import ChoiceFlow from "./ChoiceFlow";
import Quest2MsgModal, { Quest2Scene } from "./Quest2MessageModal";
import PubSub from "pubsub-js";
import Topics from "rpg/data/topics"; 

const C = { shadow: "rgba(0,0,0,0.55)" };

type HouseId = 1 | 2;

type Quest2Props = {
  onClose?: () => void;
  onFinish?: () => void;
};

export default function Quest2({ onClose, onFinish }: Quest2Props) {
  const [house, setHouse] = useState<HouseId>(1);
  const [stage, setStage] = useState<"house" | "final">("house");
  const emittedOnceRef = useRef(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgScene, setMsgScene] = useState<Quest2Scene>("house1_intro");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setMsgScene("house1_intro");
    setMsgOpen(true);
  }, []);

  const FinalSelect = () => (
    <Box
      position="absolute"
      inset={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1200}
    >
      <Box
        bg="rgba(0,0,0,0.65)"
        color="#fff"
        border="2px solid #333"
        borderRadius="16px"
        p={8}
        minW={["90%", "720px"]}
        textAlign="center"
      >
        <Text fontFamily="NeoDGM" fontSize="xl" mb={3}>
          Quest 2 · 최종 선택
        </Text >
        <Text fontFamily="NeoDGM"mb={6}>어떤 매물을 최종 선택하시겠습니까?</Text>
        <HStack spacing={4} justify="center">
          <Button
            size="lg"
            fontFamily="NeoDGM"
            onClick={() => {
              setMsgScene("failed");
              setMsgOpen(true);
            }}
            colorScheme="blue"
          >
            (1) 첫 번째 매물
          </Button>
          <Button
            size="lg"
            fontFamily="NeoDGM"
            onClick={() => {
              setMsgScene("success");
              setMsgOpen(true);
            }}
            colorScheme="pink"
          >
            (2) 두 번째 매물
          </Button>
        </HStack>
      </Box>
    </Box>
  );

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      role="dialog"
      aria-modal="true"
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
        boxShadow: `inset 0 0 200px ${C.shadow}`,
        mixBlendMode: "overlay",
        opacity: 0.34,
      }}
    >
      {/* 콘텐츠 */}
      <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
        {stage === "house" && (
          <ChoiceFlow
            key={house}
            type={1}
            houseIndex={house}
            onHint={(scene) => {
              setMsgScene(scene);    // 메시지 모달 씬키
              setMsgOpen(true);      // 메시지 모달 열기
            }}
            onClose={() => onClose?.()} // 사용자가 수동으로 닫을 때만 종료
            onComplete={() => {
              if (house === 1) {
                // ➜ 두 번째 매물로 전환 + 인트로 말풍선
                setHouse(2);
                setTimeout(() => {
                  setMsgScene("house2_intro");
                  setMsgOpen(true);
                }, 0);
              } else {
                // ➜ 최종 선택 단계 진입 + “최종 선택” 말풍선
                setStage("final");
                setTimeout(() => {
                  setMsgScene("final_select");
                  setMsgOpen(true);
                }, 0);
              }
            }}
          />
        )}

        {stage === "final" && <FinalSelect />}
      </Box>

      {/* ✅ 퀘스트2 말풍선 모달 */}
      <Quest2MsgModal
        isOpen={msgOpen}
        scene={msgScene}
        onClose={() => setMsgOpen(false)}
        dimBackground  
        onComplete={() => {
          // 말풍선 종료 후 분기 처리
          if (msgScene === "success") {
            // 성공: 보상 안내 후 퀘스트 종료
            setMsgOpen(false);
            if (!emittedOnceRef.current) {
             PubSub.publish(Topics.quest2Completed);
             emittedOnceRef.current = true;
           }
            onFinish?.();
            onClose?.();
          } else if (msgScene === "failed") {
            // 실패: 재선택 요구 → 다시 최종 선택 말풍선으로 유도(또는 바로 FinalSelect만 유지)
            setMsgOpen(false);
            setStage("final");
            setTimeout(() => {
              setMsgScene("final_select");
              setMsgOpen(true);
            }, 0);
          } else {
            setMsgOpen(false);
          }
        }}
      />
    </Box>
  );
}
