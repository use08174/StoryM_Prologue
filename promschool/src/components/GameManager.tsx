import {
  Box,
  Center,
  HStack,
  Spinner,
  Image,
  Text,
} from "@chakra-ui/react";
import ChatModal from "./ChatModal";
import EvidenceModal from "./EvidenceModal";
import QuestStatusModal from "./QuestStatusModal";
import { EastworldClient } from "eastworld-client";
import { useEffect, useState } from "react";
import { Game } from "./Game";
import PoliceModal from "./PoliceModal";
import ResultScreen, { ResultScreenProps } from "./ResultScreen";
import Topics from "rpg/data/topics";
import { getGameState, saveGameState } from "rpg/data/persistence";
import { initGA, logStartGame } from "analytics";
import RateLimitModal from "./RateLimitModal";
import MessageModal from "./MessageModal";
import Quest1MiniGame from "./Quest1MiniGame";
import PhoneButton from "./PhoneButton";
import ConfirmStartModal from "./ConfirmStartModal";
import Quest2 from "./Quest2/Quest2";
import PubSub from "pubsub-js"; // ⭐️ Quest2 이벤트 연결용

export const GameManager = () => {
  const [sessionId, setSessionId] = useState<string>();
  const [endResult, setEndResult] = useState<ResultScreenProps>();
  const [exp, setExp] = useState(0);
  const [alarm, setAlarm] = useState(0);
  const [showMsg, setShowMsg] = useState(false);
  const [showQuest1, setShowQuest1] = useState(false);
  const [showQuest2, setShowQuest2] = useState(false); // ⭐️ Quest2 실행 상태
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [currentQuest, setCurrentQuest] = useState(1); // 현재 진행중인 퀘스트 단계 (1~3)
  const [pendingQuest, setPendingQuest] = useState<1 | 2 | null>(null); // ⭐️ 어떤 퀘스트를 시작할지 구분

  const eastworldClient = new EastworldClient({ BASE: "/api" });

  // 알람 효과
  useEffect(() => {
    const t = setTimeout(() => setAlarm(1), 1200);
    return () => clearTimeout(t);
  }, []);

  // 세션 생성
  useEffect(() => {
    const fetchSession = async () => {
      let sessionUuid = getGameState().sessionUuid;
      const gameUuid = "ad1e3ffb-03e3-4275-809e-941c307ee9cf";
      if (!sessionUuid || !(await eastworldClient.gameSessions.isSessionActive(sessionUuid))) {
        sessionUuid = await eastworldClient.gameSessions.createSession(gameUuid);
        getGameState().sessionUuid = sessionUuid;
        saveGameState();
      }
      setSessionId(sessionUuid);
    };
    initGA();
    logStartGame();
    fetchSession();
  }, []);

  // ⭐️ Quest2 시작 신호(PubSub) 구독
  useEffect(() => {
    const token = PubSub.subscribe(Topics.startQuest2, () => {
      // 여기서 확인 모달을 띄우든, 바로 Quest2 컴포넌트를 열든 선택
      setShowConfirm(true);        // “퀘스트 2 시작하시겠습니까?” 모달
      setPendingQuest(2);
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);


  // endGame 이벤트 수신
  PubSub.subscribe(Topics.endGame, (_channel, payload) => {
    setEndResult(payload as ResultScreenProps);
  });

  // 퀘스트 완료 시 경험치/진행 업데이트
  const handleQuestComplete = () => {
    setCurrentQuest((prev) => Math.min(prev + 1, 3));
    setExp((prev) => Math.min(prev + 2, 10));
  };

  return (
    <Box height="100vh" width="100vw">
      {/* 로딩 화면 */}
      {!sessionId && (
        <Center>
          <Spinner size="xl" />
        </Center>
      )}

      {/* 결과 화면 */}
      {endResult && <ResultScreen {...endResult} />}

      {/* 게임 화면 */}
      {!endResult && sessionId && (
        <Box width="100vw" height="100vh" position="relative">
          {/* 상단 EXP 바 */}
          <Box
            position="absolute"
            top="15px"
            left="20px"
            bg="rgba(255,255,255,0.9)"
            borderRadius="xl"
            px={3}
            py={2}
            boxShadow="md"
            display="inline-flex"
            alignItems="center"
            zIndex={10}
          >
            <Image
              src={`/assets/sprites/storym_exp_${exp}.png`}
              alt="exp-bar"
              height="24px"
            />
          </Box>

          {/* 상단 버튼 그룹 */}
          <HStack
            position="absolute"
            top="15px"
            right="20px"
            spacing={3}
            zIndex={10}
          >
            {/* Phone 버튼 */}
            <PhoneButton
              alarm={alarm}
              highlight={alarm > 0 && !showMsg}
              onClick={() => {
                setShowMsg(true);
                setAlarm(0);
              }}
            />

            {/* Quest 버튼 */}
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              bg="rgba(255,255,255,0.9)"
              borderRadius="xl"
              px={3}
              py={2}
              boxShadow="md"
              cursor="pointer"
              _hover={{ bg: "rgba(255,255,255,1)" }}
              minW="70px"
              onClick={() => setShowQuestModal(true)}
            >
              <Image src="/assets/sprites/storym_scenario.png" alt="book" boxSize="30px" />
              <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
                Quest
              </Text>
            </Box>

            {/* Book 버튼 */}
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              bg="rgba(255,255,255,0.9)"
              borderRadius="xl"
              px={3}
              py={2}
              boxShadow="md"
              cursor="pointer"
              _hover={{ bg: "rgba(255,255,255,1)" }}
              minW="70px"
            >
              <Image src="/assets/sprites/storym_info.png" alt="book" boxSize="30px" />
              <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
                Info
              </Text>
            </Box>

            {/* Settings 버튼 */}
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              bg="rgba(255,255,255,0.9)"
              borderRadius="xl"
              px={3}
              py={2}
              boxShadow="md"
              cursor="pointer"
              _hover={{ bg: "rgba(255,255,255,1)" }}
              minW="70px"
            >
              <Image src="/assets/sprites/storym_settings.png" alt="settings" boxSize="30px" />
              <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
                Settings
              </Text>
            </Box>
          </HStack>

          {/* 메인 게임 */}
          <Center width="100%" height="100%">
            <Game />
          </Center>

          {/* 메시지 모달 */}
          <MessageModal
            isOpen={showMsg}
            title="마을 이장님"
            onComplete={() => {
              setShowMsg(false);
              setPendingQuest(1);
              setShowConfirm(true);
            }}
          />

          {/* 공통 퀘스트 시작 확인 모달 */}
          <ConfirmStartModal
            isOpen={showConfirm}
            title={`퀘스트 ${pendingQuest ?? currentQuest}`}
            message={`퀘스트 ${pendingQuest ?? currentQuest}을 시작하시겠습니까?`}
            onYes={() => {
              setShowConfirm(false);
              if (pendingQuest === 1) setShowQuest1(true);
              if (pendingQuest === 2) setShowQuest2(true);
              setPendingQuest(null);
            }}
            onNo={() => setShowConfirm(false)}
          />

          {/* 퀘스트 상태창 */}
          <QuestStatusModal
            isOpen={showQuestModal}
            onClose={() => setShowQuestModal(false)}
            currentQuest={currentQuest}
          />

          {/* Quest 1 */}
          <Quest1MiniGame
            isOpen={showQuest1}
            onClose={() => setShowQuest1(false)}
            onFinish={() => {
              setShowQuest1(false);
              handleQuestComplete();
            }}
            mode="edu"
            incomeKRW={1_800_000}
          />

          {/* ⭐️ Quest 2 */}
          {showQuest2 && (
            <Quest2
              onClose={() => setShowQuest2(false)}
              onFinish={() => {
                setShowQuest2(false);
                handleQuestComplete();
              }}
            />
          )}

          <ChatModal
            eastworldClient={eastworldClient}
            sessionId={sessionId}
            notes=""
            setNotes={() => {}}
          />
          <EvidenceModal />
          <PoliceModal eastworldClient={eastworldClient} />
          <RateLimitModal />
        </Box>
      )}
    </Box>
  );
};
