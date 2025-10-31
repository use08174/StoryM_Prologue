import { useEffect, useState } from "react";
import Quest2Dialog from "./Quest2Dialog";
import MissionOverlay from "./MissionOverlay";
import MissionChoice from "./MissionChoice";
import ChoiceFlow from "./ChoiceFlow";

type Quest2Props = {
  onClose?: () => void;
  onFinish?: () => void;
};

/**
 * 단계
 * 0: (대기)
 * 1: 부동산 중개인: "이제 같이 집 보러..."
 * 2: 상단 MISSION(노란)
 * 3: 부동산 중개인: "이 집은 어떠세요?"
 * 4: MISSION 1 + 사진1 + 선택지(창문/싱크대/화장실)
 */
export default function Quest2({ onClose, onFinish }: Quest2Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [activeChoice, setActiveChoice] = useState<null | 1 | 2 | 3>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "Enter") {
        if (activeChoice !== null) return; // 선택 흐름 중에는 글로벌 진행 금지
        e.preventDefault();
        setStep((prev) => (prev < 4 ? ((prev + 1) as 0 | 1 | 2 | 3 | 4) : 4));
      }
      if (e.code === "Backspace") {
        if (activeChoice !== null) {
          setActiveChoice(null); // 선택 흐름 닫고 선택지 복귀
          return;
        }
        e.preventDefault();
        setStep((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2 | 3 | 4) : 0));
      }
      if (e.code === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeChoice, onClose]);

  const handleSelect = (n: 1 | 2 | 3) => setActiveChoice(n);

  return (
    <>
      {/* 상단 오버레이 */}
      {step === 2 && (
        <MissionOverlay
          title="MISSION"
          text={`부동산 중개인이 추천하는 세 가지 매물을 꼼꼼히 점검해 보고,\n그 중 하자가 없는 좋은 매물을 찾아 선택하세요.`}
          reward="성공 시 보상: 경험치 100, 체크리스트 카드"
          tone="yellow"
        />
      )}

      {step === 4 && activeChoice === null && (
        <MissionOverlay
          title="MISSION 1"
          text="첫 번째 매물 자세히 살펴보기"
          imageSrc="/assets/quest2/first_property.png"  // 사진1 경로
          tone="white"
        />
      )}

      {/* 하단 말풍선 */}
      {step === 1 && (
        <Quest2Dialog
          speaker="부동산 중개인"
          text="자, 그럼 이제 같이 집을 보러 가볼까요?"
        />
      )}

      {step === 3 && (
        <Quest2Dialog
          speaker="부동산 중개인"
          text={`이 집은 어떠세요? 햇볕이 아주 잘 드는 남향이에요.\n요즘 이렇게 좋은 매물 잘 안 나옵니다.`}
        />
      )}

      {/* 선택지 */}
      {step === 4 && activeChoice === null && (
        <MissionChoice
          title="첫번째 매물"
          question="어디를 먼저 살펴볼까요?"
          options={["창문", "싱크대", "화장실"]}
          onSelect={(idx) => handleSelect((idx + 1) as 1 | 2 | 3)}
          enableKeySelect
        />
      )}

      {/* 선택 흐름 */}
      {activeChoice !== null && (
        <ChoiceFlow type={activeChoice} onClose={() => setActiveChoice(null)} />
      )}
    </>
  );
}
