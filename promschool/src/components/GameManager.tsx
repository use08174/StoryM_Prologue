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
import { useEffect, useRef, useState } from "react";
import { Game } from "./Game";
import PoliceModal from "./PoliceModal";
import ResultScreen, { ResultScreenProps } from "./ResultScreen";
import Topics from "rpg/data/topics";
import { getGameState, saveGameState } from "rpg/data/persistence";
import { initGA, logStartGame } from "analytics";
import RateLimitModal from "./RateLimitModal";
import MessageModal from "./Quest1/MessageModal";
import PhoneButton from "./PhoneButton";
import ConfirmStartModal from "./ConfirmStartModal";
import PubSub from "pubsub-js"; // 
import Quest1 from "./Quest1/Quest1";
import Quest2 from "./Quest2/Quest2";
import Quest3 from "./Quest3/Quest3";
import Quest4 from "./Quest4/Quest4";
import PolicyTipIcon from "./PolicyTipIcon";

export const GameManager = () => {
  const [sessionId, setSessionId] = useState<string>();
  const [endResult, setEndResult] = useState<ResultScreenProps>();
  const [exp, setExp] = useState(0);
  const [alarm, setAlarm] = useState(0);
  const [paused, setPaused] = useState(false); 
  const [showMsg, setShowMsg] = useState(false);
  const [showQuest1, setShowQuest1] = useState(false);
  const [showQuest2, setShowQuest2] = useState(false); 
  const [showQuest3, setShowQuest3] = useState(false);
  const [showQuest4, setShowQuest4] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [currentQuest, setCurrentQuest] = useState(1); 
  const [pendingQuest, setPendingQuest] = useState<1 | 2 | 3 | 4 | null>(null); 
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
  const [pendingAlarmSound, setPendingAlarmSound] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const eastworldClient = new EastworldClient({ BASE: "/api" });


   useEffect(() => {
    alarmSoundRef.current = new Audio("/assets/sfx/notification.mp3"); // 경로만 맞추세요
    alarmSoundRef.current.loop = false;
    alarmSoundRef.current.volume = 0.7;

    const unlock = async () => {
      try {
        if (!alarmSoundRef.current) return;
        // 아주 짧게 재생 후 멈추면 브라우저가 오디오 사용을 허용 상태로 전환
        await alarmSoundRef.current.play();
        alarmSoundRef.current.pause();
        alarmSoundRef.current.currentTime = 0;
        if (pendingAlarmSound) {
          setPendingAlarmSound(false);
          await alarmSoundRef.current.play();
        }
      } catch {
        /* ignore */
      } finally {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }, [pendingAlarmSound]);

  useEffect(() => {
    const t = setTimeout(() => {
      setAlarm(1);
      setPaused(true);
      // 사운드 재생 시도 (막히면 pending 플래그)
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

  useEffect(() => {
    const token = PubSub.subscribe(Topics.endGame, (_c, payload) => {
      setEndResult(payload as ResultScreenProps);
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

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
    ];

    return () => subs.forEach((s) => PubSub.unsubscribe(s));
  }, []);
  



  // endGame 이벤트 수신
  //PubSub.subscribe(Topics.endGame, (_channel, payload) => {
    //setEndResult(payload as ResultScreenProps);
  //});

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
            zIndex={10}
          >
            <Image
              src={`/assets/sprites/storym_exp_${exp}.png`}
              alt="exp-bar"
              height="40px"
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
            {/* 알림 */}
            <PhoneButton
              alarm={alarm}
              highlight={alarm > 0 && !showMsg}
              onClick={() => {
                setShowMsg(true);
                setAlarm(0);
                setPaused(false);            
                PubSub.publish(Topics.giveKeysToDom);
              }}
            />

            {/* 챗봇 */}
            <>
            <Image
              src="/assets/sprites/storym_chat.png"
              alt="quest"
              boxSize="60px"
              cursor="pointer"
              _hover={{ transform: "scale(1.06)" }}
              onClick={() => setShowChatModal(true)}
            />
            <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
            </>
            {/* API */}
            <PolicyTipIcon
              topicType="lclsf"         
              topicName="취업"           
              characterMeta={{ gender: "여성", region: "의왕", job: "대학생" }} // 선택
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


            {/* Settings */}
            <Image
              src="/assets/sprites/storym_settings.png"
              alt="settings"
              boxSize="60px"
              cursor="pointer"
              _hover={{ transform: "scale(1.06)" }}
              // onClick 핸들러 필요하면 여기에 추가
            />
          </HStack>


          {/* 메인 게임 */}
          <Center width="100%" height="100%">
            <Game paused={paused} />
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
              requestAnimationFrame(() => {
                setPaused(true);       
                if (pendingQuest === 1) setShowQuest1(true);
                if (pendingQuest === 2) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest2(true);
                }
                if (pendingQuest === 3) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest3(true);
                }
                if (pendingQuest === 4) {
                  PubSub.publish(Topics.giveKeysToDom);
                  setShowQuest4(true);
                }
                setPendingQuest(null);
            });
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
          {/* ⭐️ Quest 2 */}
          {showQuest2 && (
            <Quest2
              onClose={() => {
                setShowQuest2(false);
                setPaused(false);  
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest2(false);
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
                setPaused(false);  
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest3(false);
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
                setPaused(false);  
                PubSub.publish(Topics.giveKeysToGame);
              }}
              onFinish={() => {
                setShowQuest4(false);
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
