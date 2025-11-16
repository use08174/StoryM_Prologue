import { useEffect, useState } from "react";
import { Box, Text, Button, HStack } from "@chakra-ui/react";
import ChoiceFlow from "./ChoiceFlow";

const C = { shadow: "rgba(0,0,0,0.55)" };

type HouseId = 1 | 2;

type Quest2Props = {
  onClose?: () => void;
  onFinish?: () => void;
};

export default function Quest2({ onClose, onFinish }: Quest2Props) {
  const [house, setHouse] = useState<HouseId>(1);
  const [stage, setStage] = useState<"house" | "final">("house"); // ✅ 최종선택 단계

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        <Text fontFamily="NeoDGM" fontSize="xl" mb={3}>Quest2</Text>
        <Text mb={6}>어떤 매물을 최종 선택하시겠습니까?</Text>
        <HStack spacing={4} justify="center">
          <Button
            size="lg"
            onClick={() => { onFinish?.(); onClose?.(); }}
            colorScheme="blue"
          >
            (1) 첫 번째 매물
          </Button>
          <Button
            size="lg"
            onClick={() => { onFinish?.(); onClose?.(); }}
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
            onClose={() => onClose?.()} // 사용자가 수동으로 닫을 때만
            onComplete={() => {
              if (house === 1) setHouse(2);
              else setStage("final");
            }}
          />
        )}

        {stage === "final" && <FinalSelect />}
      </Box>
    </Box>
  );
}
