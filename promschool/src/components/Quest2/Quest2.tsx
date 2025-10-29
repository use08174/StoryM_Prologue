import { useState, useEffect } from "react";
import Quest2Dialog from "./Quest2Dialog";
import MissionOverlay from "./MissionOverlay";
import { quest2Scenes } from "./Quest2Scenes";

type Quest2Props = {
  onClose?: () => void;
  onFinish?: () => void;
};

export default function Quest2({ onClose, onFinish }: Quest2Props) {  const [showMissionStart, setShowMissionStart] = useState(true);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [currentScene, setCurrentScene] = useState(quest2Scenes[0]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (showMissionStart) {
          // 처음 Mission 시작 닫기
          setShowMissionStart(false);
          return;
        }

        if (showMissionComplete) {
          // Mission Complete 닫기
          setShowMissionComplete(false);
          setSceneIndex((prev) => Math.min(prev + 1, quest2Scenes.length - 1));
          return;
        }

        setSceneIndex((prev) => Math.min(prev + 1, quest2Scenes.length - 1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showMissionStart, showMissionComplete]);

  useEffect(() => {
    const scene = quest2Scenes[sceneIndex];
    setCurrentScene(scene);

    // MISSION COMPLETE 표시
    if (scene.mission) {
      setShowMissionComplete(true);
    }
  }, [sceneIndex]);

  return (
    <>
      {/* 🔸 MISSION 시작 오버레이 */}
      {showMissionStart && (
        <MissionOverlay
          title="MISSION"
          text={`부동산 중개인이 추천하는 세 가지 매물을 꼼꼼히 점검해 보고,\n하자가 없는 좋은 매물을 찾아 선택하세요.`}
          reward="성공 시 보상: 경험치 100, 체크리스트 카드"
        />
      )}

      {/* 🔸 MISSION COMPLETE 오버레이 */}
      {showMissionComplete && (
        <MissionOverlay
          title="MISSION COMPLETE!"
          text={`하자가 없는 좋은 매물을 찾았습니다!\n가계약을 진행하세요.`}
          reward="보상: 경험치 100, 체크리스트 카드 획득"
        />
      )}

      {/* 🔸 대사창 */}
      {!showMissionStart && !showMissionComplete && (
        <Quest2Dialog
          speaker={"speaker" in currentScene ? currentScene.speaker : undefined}
          text={currentScene.text}
          mission={"mission" in currentScene ? currentScene.mission : undefined}
          end={sceneIndex === quest2Scenes.length - 1}
        />
      )}
    </>
  );
}
