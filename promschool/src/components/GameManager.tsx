// src/components/GameManager.tsx
import {
  Box,
  Center,
  HStack,
  Spinner,
  Image,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
  useToast,
} from "@chakra-ui/react";
import ChatModal from "./ChatModal";
import QuestStatusModal from "./QuestStatusModal";
import { EastworldClient } from "eastworld-client";
import { useEffect, useRef, useState } from "react";
import { Game } from "./Game";
import ResultScreen, { ResultScreenProps } from "./ResultScreen";
import Topics from "rpg/data/topics";
import { getGameState, saveGameState } from "rpg/data/persistence";
import { initGA, logStartGame } from "analytics";
import RateLimitModal from "./RateLimitModal";
import PhoneButton from "./PhoneButton";
import ConfirmStartModal from "./ConfirmStartModal";
import PubSub from "pubsub-js";
import Quest1 from "./Quest1/Quest1";
import Quest2 from "./Quest2/Quest2";
import Quest3 from "./Quest3/Quest3";
import Quest4 from "./Quest4/Quest4";
import Quest5Library from "./Library/Quest5Library";
import PolicyTipIcon from "./PolicyTipIcon";
import MiniMap from "./MiniMap";



/** 폰 알림 클릭 시 띄우는 챗봇 인트로 모달 */
function PhoneIntroModal({
  isOpen,
  onClose,
  onOpenChat,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="#121318" color="white" border="2px solid #7E44A8" borderRadius="xl">
        <ModalHeader fontFamily="NeoDGM">📱 StoryM 기능 안내</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text fontFamily="NeoDGM" textAlign="center">
              첫 독립을 축하해!<br/> <br/>
              <Box as="span" display="inline-flex" alignItems="center" gap={1} mr={2}>
                <Image src="/assets/sprites/storym_chat.png" alt="chat" boxSize="35px" display="inline" />
                <b style={{ color: "#FCCFDB" }}>버튼을 누르면 언제든지 챗봇에게 질문할 수 있어. </b>
              </Box>
              <br/>
              <Box as="span" display="inline-flex" alignItems="center" gap={1} mr={2}>
                <Image src="/assets/sprites/storym_tip.png" alt="news" boxSize="35px" display="inline" />
                <b style={{ color: "#FCCFDB" }}>버튼을 누르면 서류 확인, 계약 팁을 확인할 수 있어. </b>
              </Box>
              <Box as="span" display="inline-flex" alignItems="center" gap={1} mr={2}>
                <Image src="/assets/sprites/storym_scenario.png" alt="paper" boxSize="35px" display="inline" />
                <b style={{ color: "#FCCFDB" }}>버튼을 누르면 퀘스트 진행현황을 확인할 수 있어.</b>
              </Box>
    
            </Text>
            <Text fontFamily="NeoDGM" textAlign="center">자, 이제 퀘스트 1을 시작해 볼까? <br/></Text>
            <HStack justify="flex-end" spacing={10}>
              <Button onClick={onOpenChat} colorScheme="purple" variant="solid" fontFamily="NeoDGM">
                챗봇 바로 열기
              </Button>
              <Button onClick={onClose} colorScheme="purple" variant="outline" fontFamily="NeoDGM">
                메인으로 (Space로 시작)
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export const GameManager = () => {
  const [sessionId, setSessionId] = useState<string>();
  const [endResult, setEndResult] = useState<ResultScreenProps>();
  const [exp, setExp] = useState(0);
  const [alarm, setAlarm] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showPhoneIntro, setShowPhoneIntro] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showQuest1, setShowQuest1] = useState(false);
  const [showQuest2, setShowQuest2] = useState(false);
  const [showQuest3, setShowQuest3] = useState(false);
  const [showQuest4, setShowQuest4] = useState(false);
  const [showQuest5, setShowQuest5] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  //const [currentQuest, setCurrentQuest] = useState<1 | 2 | 3 | 4>(1);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  //const [pendingQuest, setPendingQuest] = useState<1 | 2 | 3 | 4 | null>(null);
  type QuestId = 1 | 2 | 3 | 4 | 5;
  const [currentQuest, setCurrentQuest] = useState<QuestId>(1);
  const [pendingQuest, setPendingQuest] = useState<QuestId | null>(null);
  const [spaceHint, setSpaceHint] = useState(false); // Space 안내 뱃지
  const toast = useToast();
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
  const [pendingAlarmSound, setPendingAlarmSound] = useState(false);
  const eastworldClient = new EastworldClient({ BASE: "/api" });

  // 오디오 잠금 해제 & 재생 준비
  useEffect(() => {
    alarmSoundRef.current = new Audio("/assets/sfx/notification.mp3");
    alarmSoundRef.current.loop = false;
    alarmSoundRef.current.volume = 0.7;

    const unlock = async () => {
      try {
        if (!alarmSoundRef.current) return;
        await alarmSoundRef.current.play();
        alarmSoundRef.current.pause();
        alarmSoundRef.current.currentTime = 0;
        if (pendingAlarmSound) {
          setPendingAlarmSound(false);
          await alarmSoundRef.current.play();
        }
      } catch {
      } finally {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }, [pendingAlarmSound]);

  // 페이지 진입 후 1.2s 뒤 폰 알람 → 폰 인트로 모달
  useEffect(() => {
    const t = setTimeout(() => {
      setAlarm(1);
      setPaused(true);
      const tryPlay = async () => {
        try {
          await alarmSoundRef.current?.play();
        } catch {
          setPendingAlarmSound(true);
        }
      };
      tryPlay();
    }, 1200);
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
  }, [pendingAlarmSound]);

  // endGame listen
  useEffect(() => {
    const token: string = PubSub.subscribe(Topics.endGame, (_c, payload) => {
      setEndResult(payload as ResultScreenProps);
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []); 


  // PubSub로 외부에서 퀘스트 시작 요청이 올 수 있게 유지
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
      PubSub.subscribe(Topics.startQuest3, () => {
        setPendingQuest(3);
        setShowConfirm(true);
      }),
      PubSub.subscribe((Topics as any).startQuest4, () => {
        setPendingQuest(4);
        setShowConfirm(true);
      }),
      PubSub.subscribe((Topics as any).startQuest5, () => {
        setPendingQuest(5);
        setShowConfirm(true);
      })
    ];
    return () => subs.forEach((s) => PubSub.unsubscribe(s));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const spacePressed = e.code === "Space" || e.key === " ";
      if (!spacePressed) return;

      // 다른 모달/퀘스트 열려 있으면 무시
      const modalOpen =
        showPhoneIntro ||
        showChatModal ||
        showConfirm ||
        showQuest1 ||
        showQuest2 ||
        showQuest3 ||
        showQuest4 ||
        showQuest5 ||
        isQuestOpen;

      if (modalOpen) return;

      e.preventDefault();
      setPendingQuest(currentQuest);
      setShowConfirm(true);
      setPaused(true);
      setSpaceHint(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPhoneIntro, showChatModal, showConfirm, showQuest1, showQuest2, showQuest3, showQuest4, showQuest5, isQuestOpen,currentQuest]);

  // 퀘스트 완료 시 EXP/진행
  const handleQuestComplete = () => {
    setCurrentQuest((prev) => {
      if (prev < 5) {
        return (prev + 1) as QuestId; // 1→2→3→4→5
      }
      return prev; // 5면 그대로 유지
    });
  };

  return (
    <Box height="100vh" width="100vw">
      {!sessionId && (
        <Center>
          <Spinner size="xl" />
        </Center>
      )}

      {endResult && <ResultScreen {...endResult} />}

      {!endResult && sessionId && (
        <Box width="100vw" height="100vh" position="relative">
          {/* 상단 EXP 바 */}
          <Box position="absolute" top="15px" left="20px" zIndex={10}>
            <Image src={`/assets/sprites/storym_exp_${exp}.png`} alt="exp-bar" height="40px" />
          </Box>

          {/* 상단 버튼 그룹 */}
          <HStack position="absolute" top="15px" right="20px" spacing={3} zIndex={10}>
            {/* 알림(폰) */}
            <PhoneButton
              alarm={alarm}
              highlight={alarm > 0 && !showPhoneIntro}
              onClick={() => {
                setShowPhoneIntro(true);
                setAlarm(0);
                setPaused(true);
                PubSub.publish(Topics.giveKeysToDom);
              }}
            />

            {/* 챗봇 */}
            <>
              <Image
                src="/assets/sprites/storym_chat.png"
                alt="chat"
                boxSize="60px"
                cursor="pointer"
                _hover={{ transform: "scale(1.06)" }}
                onClick={() => setShowChatModal(true)}
              />
              <ChatModal
                isOpen={showChatModal}
                onClose={() => {
                  setShowChatModal(false);
                  setPaused(false);
                }}
              />
            </>

            {/* 정책 TIP 아이콘(유지) */}
            <PolicyTipIcon
              topicType="lclsf"
              topicName="취업"
              characterMeta={{ gender: "여성", region: "의왕", job: "대학생" }}
              boxSize="60px"
            />

            {/* 퀘스트 진행현황 */}
            <Image
              src="/assets/sprites/storym_scenario.png"
              alt="quest"
              boxSize="60px"
              cursor="pointer"
              _hover={{ transform: "scale(1.06)" }}
              onClick={() => setShowQuestModal(true)}
            />

            {/* 설정 */}
            <Image
              src="/assets/sprites/storym_settings.png"
              alt="settings"
              boxSize="60px"
              cursor="pointer"
              _hover={{ transform: "scale(1.06)" }}
            />
          </HStack>

          {/* 메인 게임 */}
          <Center width="100%" height="100%">
            <Game paused={paused} />
          </Center>
          {/* ✅ 여기 미니맵 추가 */}
          <MiniMap
            mapSrc="./assets/maps/prologue_map.png" // 실제 맵 이미지 경로로 변경
            miniSize="160px"
            position={{ bottom: "20px", left: "20px" }} // 왼쪽 아래로 두고 싶으면 { bottom: "20px", left: "20px" }
          />

          {/* Space 힌트 배지 */}
          {spaceHint && (
            <Box
              position="absolute"
              bottom="36px"
              left="50%"
              transform="translateX(-50%)"
              bg="blackAlpha.700"
              color="white"
              px={4}
              py={2}
              borderRadius="md"
              border="1px solid #7E44A8"
              zIndex={9}
              fontFamily="NeoDGM"
            >
              Space 키를 눌러 퀘스트 1 시작!
            </Box>
          )}

          {/* 폰 인트로 모달 */}
          <PhoneIntroModal
            isOpen={showPhoneIntro}
            onOpenChat={() => {
              setShowPhoneIntro(false);
              setShowChatModal(true);
            }}
            onClose={() => {
              setShowPhoneIntro(false);
              setPaused(false);
              setSpaceHint(true);
              setTimeout(() => setSpaceHint(false), 5000);
              PubSub.publish(Topics.giveKeysToGame);
            }}
          />

          {/* 퀘스트 시작 확인 모달 */}
          <ConfirmStartModal
            isOpen={showConfirm}
            title={`퀘스트 ${pendingQuest ?? currentQuest}`}
            message={`퀘스트 ${pendingQuest ?? currentQuest}을 시작하시겠습니까?`}
            onYes={() => {
              setShowConfirm(false);
              requestAnimationFrame(() => {
                setPaused(true);
                setIsQuestOpen(true);  
                const q = pendingQuest ?? currentQuest; 

                 if (q === 1) {
                  PubSub.publish(Topics.giveKeysToDom);    // 통일감 있게 DOM으로 넘김
                  setShowQuest1(true);
                }
                if (q === 2) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest2(true);
                }
                if (q === 3) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest3(true);
                }
                if (q === 4) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest4(true);
                }
                if (q === 5) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest5(true);
                }
                setPendingQuest(null);
              });
            }}
            onNo={() => setShowConfirm(false)}
          />


          <PhoneIntroModal
            isOpen={showPhoneIntro}
            onOpenChat={() => {
              setShowPhoneIntro(false);
              setShowChatModal(true);      // ChatModal 열기
            }}
            onClose={() => {
              setShowPhoneIntro(false);
              setPaused(false);
              setSpaceHint(true);          // Space 힌트 잠깐 띄우는 로직 있으면 그대로 사용
              setTimeout(() => setSpaceHint(false), 5000);
              PubSub.publish(Topics.giveKeysToGame);
            }}
          />

          {/* 퀘스트 상태창 */}
          <QuestStatusModal
            isOpen={showQuestModal}
            onClose={() => setShowQuestModal(false)}
            currentQuest={currentQuest}
          />

          {/* 퀘스트 모달들 */}
          {showQuest1 && (
            <Quest1
              isOpen
              onClose={() => {
                setShowQuest1(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest1(false);
                PubSub.publish(Topics.giveKeysToGame);
                setPaused(false);
                handleQuestComplete();
              }}
            />
          )}
          {showQuest2 && (
            <Quest2
              onClose={() => {
                setShowQuest2(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest2(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
                handleQuestComplete();
              }}
            />
          )}
          {showQuest3 && (
            <Quest3
              onClose={() => {
                setShowQuest3(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest3(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
                handleQuestComplete();
              }}
            />
          )}
          {showQuest4 && (
            <Quest4
              onClose={() => {
                setShowQuest4(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest4(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
                handleQuestComplete();
              }}
            />
          )}
          {showQuest5 && (
            <Quest5Library
              onClose={() => {
                setShowQuest5(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest5(false);
                setIsQuestOpen(false);
                setPaused(false);
                PubSub.publish(Topics.giveKeysToGame);
                handleQuestComplete();
              }}
            />
          )}

          <RateLimitModal />
        </Box>
      )}
    </Box>
  );
};
