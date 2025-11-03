import { useEffect, useState } from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import Quest2Dialog from "./Quest2Dialog";
import MissionOverlay from "./MissionOverlay";
import MissionChoice from "./MissionChoice";
import ChoiceFlow from "./ChoiceFlow";

type Quest2Props = {
  onClose?: () => void;
  onFinish?: () => void;
};

const HOUSE_DATA = {
  1: {
    title: "첫 번째 매물",
    missionTitle: "MISSION 1",
    overlayText: "첫 번째 매물 자세히 살펴보기",
    npcLine:
      "이 집은 어떠세요? 햇볕이 아주 잘 드는 남향이에요. 요즘 이렇게 좋은 매물 잘 안 나옵니다.",
    options: ["창문", "싱크대", "화장실"],
    image: "/assets/quest2_scenes/room1_main.png",
  },
  2: {
    title: "두 번째 매물",
    missionTitle: "MISSION 2",
    overlayText: "두 번째 매물 자세히 살펴보기",
    npcLine:
      "이 집은 어떠세요? 집 주인이 어제 갓 내놓은 방인데, 조건에 딱 맞아요. 이 가격에 이만한 집 얻기 힘들 겁니다.",
    options: ["현관문", "보일러", "외부환경"],
    image: "/assets/quest2_scenes/room2_main.png",
  },
  3: {
    title: "세 번째 매물",
    missionTitle: "MISSION 3",
    overlayText: "세 번째 매물 자세히 살펴보기",
    npcLine:
      "이제 마지막이네요. 이 집은 인기가 많아서 빨리 계약하셔야 해요~",
    options: ["벽지와 바닥", "붙박이장", "베란다"],
    image: "/assets/quest2_scenes/room3_main.png",
  },
};

export default function Quest2({ onClose, onFinish }: Quest2Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(0);
  const [houseIndex, setHouseIndex] = useState<1 | 2 | 3>(1);
  const [activeChoice, setActiveChoice] = useState<null | 1 | 2 | 3>(null);

  const [completedChecks, setCompletedChecks] = useState({
    1: { a: false, b: false, c: false },
    2: { a: false, b: false, c: false },
    3: { a: false, b: false, c: false },
  });

  // 🎮 키보드 조작
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "Enter") {
        if (activeChoice !== null) return;
        e.preventDefault();
        setStep((prev) => (prev < 4 ? ((prev + 1) as any) : prev));
      }
      if (e.code === "Backspace") {
        if (activeChoice !== null) {
          setActiveChoice(null);
          return;
        }
        e.preventDefault();
        setStep((prev) => (prev > 0 ? ((prev - 1) as any) : 0));
      }
      if (e.code === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeChoice, onClose]);

  useEffect(() => {
    const current = completedChecks[houseIndex];
    if (current.a && current.b && current.c) {
      setStep(5);
    }
  }, [completedChecks, houseIndex]);

  const handleSelect = (n: 1 | 2 | 3) => setActiveChoice(n);

  const handleCompleteChoice = (n: 1 | 2 | 3) => {
    setCompletedChecks((prev) => ({
      ...prev,
      [houseIndex]: {
        ...prev[houseIndex],
        ...(n === 1 && { a: true }),
        ...(n === 2 && { b: true }),
        ...(n === 3 && { c: true }),
      },
    }));
    setActiveChoice(null);
  };

  return (
    <>
      {/* 🎯 공통 MISSION 안내 */}
      {step === 2 && (
        <MissionOverlay
          title="MISSION"
          text={`부동산 중개인이 추천하는 세 가지 매물을 꼼꼼히 점검해 보고,\n그 중 하자가 없는 좋은 매물을 찾아 선택하세요.`}
          reward="성공 시 보상: 경험치 100, 체크리스트 카드"
          tone="yellow"
        />
      )}

      {/* 🏠 매물별 MISSION */}
      {step === 4 && activeChoice === null && (
        <MissionOverlay
          title={HOUSE_DATA[houseIndex].missionTitle}
          text={HOUSE_DATA[houseIndex].overlayText}
          imageSrc={HOUSE_DATA[houseIndex].image}
          tone="white"
        />
      )}

      {/* 💬 부동산 중개인 대화 */}
      {step === 1 && (
        <Quest2Dialog
          speaker="부동산 중개인"
          text="자, 그럼 이제 같이 집을 보러 가볼까요?"
        />
      )}
      {step === 3 && (
        <Quest2Dialog
          speaker="부동산 중개인"
          text={HOUSE_DATA[houseIndex].npcLine}
          imageSrc={HOUSE_DATA[houseIndex].image}
        />
      )}

      {/* 🏠 선택지 */}
      {step === 4 && activeChoice === null && (
        <MissionChoice
          title={HOUSE_DATA[houseIndex].title}
          question="어디를 먼저 살펴볼까요?"
          options={HOUSE_DATA[houseIndex].options}
          onSelect={(idx) => handleSelect((idx + 1) as 1 | 2 | 3)}
          enableKeySelect
        />
      )}

      {/* 🏡 매물 선택 화면 */}
      {step === 5 && (
        <>
          <MissionOverlay
            title={HOUSE_DATA[houseIndex].missionTitle}
            text={`${HOUSE_DATA[houseIndex].title}을 선택하시겠습니까?`}
            tone="yellow"
          />
          <Box
            position="absolute"
            left="50%"
            bottom="10%"
            transform="translateX(-50%)"
          >
            <HStack spacing={5}>
              <Button
                colorScheme="blue"
                onClick={() => {
                  if (houseIndex === 3) setStep(6);
                  else {
                    setStep(1);
                    setHouseIndex((prev) => (prev + 1) as 1 | 2 | 3);
                  }
                }}
              >
                (1) {houseIndex === 3 ? "매물 선택하기" : "다른 매물 보기"}
              </Button>
              {houseIndex < 3 && (
                <Button
                  colorScheme="gray"
                  onClick={() => {
                    setStep(1);
                    setHouseIndex((prev) => (prev + 1) as 1 | 2 | 3);
                  }}
                >
                  (2) 다른 매물 더 살펴보기
                </Button>
              )}
            </HStack>
          </Box>
        </>
      )}

      {/* 🏁 MISSION 4 - 최종 매물 선택 */}
      {step === 6 && (
        <>
          <MissionOverlay
            title="MISSION 4"
            text="어떤 매물을 선택하시겠습니까?"
            tone="yellow"
          />
          <Box
            position="absolute"
            left="50%"
            bottom="10%"
            transform="translateX(-50%)"
          >
            <HStack spacing={5}>
              <Button onClick={() => setStep(7)}>(1) 첫 번째 매물</Button>
              <Button onClick={() => setStep(7)}>(2) 두 번째 매물</Button>
              <Button
                colorScheme="pink"
                onClick={() => {
                  setStep(7);
                  onFinish?.(); // ✅ 성공 처리
                }}
              >
                (3) 세 번째 매물
              </Button>
            </HStack>
          </Box>
        </>
      )}

      {step === 7 && (
        <>
          {houseIndex === 3 ? (
            <MissionOverlay
              title="MISSION COMPLETE!"
              text="하자가 없는 좋은 매물을 찾는 데 성공했습니다!\n가계약을 진행하세요."
              reward="경험치 100, 체크리스트 카드"
              tone="yellow"
            />
          ) : (
            <MissionOverlay
              title="MISSION FAILED..."
              text="하자가 없는 좋은 매물을 찾는 데 실패했습니다.\n매물 재선택이 필요합니다."
              tone="white"
            />
          )}
        </>
      )}

      {activeChoice !== null && (
        <ChoiceFlow
          type={activeChoice}
          onClose={() => setActiveChoice(null)}
          onComplete={() => handleCompleteChoice(activeChoice)}
        />
      )}
    </>
  );
}
