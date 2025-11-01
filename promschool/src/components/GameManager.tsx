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
import PhoneButton from "./PhoneButton";
import ConfirmStartModal from "./ConfirmStartModal";
import PubSub from "pubsub-js"; // 
import Quest1 from "./Quest1/Quest1";
import Quest2 from "./Quest2/Quest2";
//import Quest3 from "./Quest3/Quest3";

export const GameManager = () => {
  const [sessionId, setSessionId] = useState<string>();
  const [endResult, setEndResult] = useState<ResultScreenProps>();
  const [exp, setExp] = useState(0);
  const [alarm, setAlarm] = useState(0);
  const [showMsg, setShowMsg] = useState(false);
  const [showQuest1, setShowQuest1] = useState(false);
  const [showQuest2, setShowQuest2] = useState(false); 
  const [showQuest3, setShowQuest3] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [currentQuest, setCurrentQuest] = useState(1); 
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

  useEffect(() => {
    const token = PubSub.subscribe(Topics.endGame, (_c, payload) => {
      setEndResult(payload as ResultScreenProps);
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

  // Quest2 시작 신호 구독
  useEffect(() => {
    const subs = [
      PubSub.subscribe(Topics.startQuest1, () => {
        setPendingQuest(1);
        setShowConfirm(true);
      }),
      PubSub.subscribe(Topics.startQuest2, () => {
        setPendingQuest(2);
        setShowConfirm(true);
      }),
      /*PubSub.subscribe(Topics.startQuest3, () => {
        setPendingQuest(3);
        setShowConfirm(true);
      }),*/
    ];

    return () => subs.forEach((s) => PubSub.unsubscribe(s));
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
              if (pendingQuest === 2) {
                PubSub.publish(Topics.giveKeysToDom);   
                setShowQuest2(true);                    
              }
              /*if (pendingQuest === 3) {
                PubSub.publish(Topics.giveKeysToDom);
                setShowQuest3(true);
              }*/
              
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
          {showQuest1 && (
            <Quest1
              isOpen={true}
              onClose={() => {
                setShowQuest1(false);
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest1(false);
                PubSub.publish(Topics.giveKeysToGame);
                handleQuestComplete();
              }}
            />
          )}
          {/* ⭐️ Quest 2 */}
          {showQuest2 && (
            <Quest2
              onClose={() => {
                setShowQuest2(false);
                PubSub.publish(Topics.giveKeysToGame); 
              }}
              onFinish={() => {
                setShowQuest2(false);
                PubSub.publish(Topics.giveKeysToGame); 
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
