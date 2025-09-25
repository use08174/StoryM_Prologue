import {
  Box,
  Center,
  HStack,
  Spinner,
  VStack,
  Image,
  Text,
} 
from "@chakra-ui/react";
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

export const GameManager = () => {
  const [sessionId, setSessionId] = useState<string>();
  const [endResult, setEndResult] = useState<ResultScreenProps>();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout>();
  const [exp, setExp] = useState(0); // 0, 2, 4, 6, 8, 10만 사용
  const completeQuest = () => {
    setExp((prev) => Math.min(prev + 2, 10));
  };

  const eastworldClient = new EastworldClient({
    BASE: "/api",
  });

  useEffect(() => {
    const fetchSession = async () => {
      var sessionUuid = getGameState().sessionUuid;
      const gameUuid = "ad1e3ffb-03e3-4275-809e-941c307ee9cf";
      if (
        !sessionUuid ||
        !(await eastworldClient.gameSessions.isSessionActive(sessionUuid))
      ) {
        sessionUuid = await eastworldClient.gameSessions.createSession(
          gameUuid
        );
        getGameState().sessionUuid = sessionUuid;
        saveGameState();
      }
      setSessionId(sessionUuid);
    };
    initGA();
    logStartGame();
    fetchSession();
  }, []);

  PubSub.subscribe(Topics.endGame, (_channel, endResult) => {
    setEndResult(endResult as ResultScreenProps);
  });

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
            bg="rgba(255,255,255,0.9)" // 직사각형 배경
            borderRadius="xl"           // 둥근 모서리
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
              src={`/assets/sprites/exp_${exp}.png`} // exp 값에 따라 다른 이미지
              alt="exp-bar"
              height="24px"
            />
          </Box>



          {/* 우측 상단: Phone / Book / Settings */}
          <HStack
            position="absolute"
            top="15px"
            right="20px"
            spacing={3}
            zIndex={10}
          >
            {/* Phone 버튼 */}
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
              position="relative"
              minW="70px"
            >
              <Image src="/assets/sprites/phone_button.png" alt="phone" boxSize="30px" />
              {/* 알람 숫자 뱃지 */}
              <Box
                position="absolute"
                top="2px"
                right="6px"
                bg="red.500"
                color="white"
                fontSize="xs"
                fontWeight="bold"
                px={2}
                borderRadius="full"
              >
                3
              </Box>
              <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
                Alarm
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




          {/* 중앙 게임 화면 */}
          <Center width={"100%"} height={"100%"}>
            <Game />
          </Center>

          {/* 모달들 */}
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
