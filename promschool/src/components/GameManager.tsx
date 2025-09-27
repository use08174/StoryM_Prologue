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

export const GameManager = () => {
  const [sessionId, setSessionId] = useState<string>();
  const [endResult, setEndResult] = useState<ResultScreenProps>();
  const [exp, setExp] = useState(0);              
  const [alarm, setAlarm] = useState(0);          
  const [showMsg, setShowMsg] = useState(false);  
  const [showQuest1, setShowQuest1] = useState(false);
  const eastworldClient = new EastworldClient({ BASE: "/api" });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAlarm(1), 1200);
    return () => clearTimeout(t);
  }, []);

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

  // endGame 이벤트 수신
  PubSub.subscribe(Topics.endGame, (_channel, payload) => {
    setEndResult(payload as ResultScreenProps);
  });

  <MessageModal
    isOpen={showMsg}
    title="마을 이장님"
    onComplete={() => {
      setShowMsg(false);
      setShowConfirm(true);   
    }}
  />

  {/* 중앙 확인 모달 */}
  <ConfirmStartModal
    isOpen={showConfirm}
    title="퀘스트 1"
    message="퀘스트 1을 시작하시겠습니까?"
    onYes={() => {
      setShowConfirm(false);
      setShowQuest1(true);    
    }}
    onNo={() => {
      setShowConfirm(false);  
    }}
  />

  const completeQuest = () => setExp(prev => Math.min(prev + 2, 10));

  return (
    <Box height={"100vh"} width={"100vw"}>
      {!sessionId && (
        <Center>
          <Spinner size={"xl"} />
        </Center>
      )}

      {endResult && <ResultScreen {...endResult} />}

      {!endResult && sessionId && (
        <Box width={"100vw"} height={"100vh"} position="relative">
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
            <Text fontSize="sm" fontWeight="bold" mr={2} color="black">
              EXP
            </Text>
            <Image
              src={`/assets/sprites/exp_${exp}.png`} 
              alt="exp-bar"
              height="24px"
            />
          </Box>

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
              <Image src="/assets/sprites/book_button.png" alt="book" boxSize="30px" />
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
              <Image src="/assets/sprites/settings_button.png" alt="settings" boxSize="30px" />
              <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
                Settings
              </Text>
            </Box>
          </HStack>

          <Center width={"100%"} height={"100%"}>
            <Game />
          </Center>

          <MessageModal
            isOpen={showMsg}
            title="마을 이장님"
            onComplete={() => {
              setShowMsg(false);
              setShowQuest1(true);
            }}
          />

          <Quest1MiniGame
            isOpen={showQuest1}
            onClose={() => setShowQuest1(false)}
            onFinish={(report) => {
              setShowQuest1(false);
              // TODO: 리포트 활용/표시, exp 증가 등
              // console.log(report);
              // setExp(prev => Math.min(prev + 2, 10));
            }}
            mode="edu"
            incomeKRW={1_800_000}
          />

          <ChatModal
            eastworldClient={eastworldClient}
            sessionId={sessionId}
            notes={""}
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
