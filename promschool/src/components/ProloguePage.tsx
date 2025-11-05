// src/pages/ProloguePage.tsx

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box, Image, Text, Center, Fade, VStack, HStack, IconButton, Progress,
  Button, Tooltip, Kbd, useDisclosure,
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon, ArrowForwardIcon } from "@chakra-ui/icons";

/** ─────────────────────────────
 *  타입
 *  ───────────────────────────── */
type Speaker = "나" | "엄마" | "unknown" | "system" | "sfx" | null;

interface Dialogue {
  character?: Speaker;   // 화자 (없으면 내레이션)
  text: string;          // 대사
  tag?: "msg" | "narration"; // (지금은 무시)
  sfx?: "shine" | "ding";    // 재생할 효과음 키
  vibrate?: number;      // 진동 ms
}

interface Scenario {
  image: string;
  dialogues: Dialogue[];
  render?: "default" | "chat"; // (지금은 무시)
}

/** ─────────────────────────────
 *  효과음 훅
 *  ───────────────────────────── */
const useSfx = () => {
  const audio = useMemo(() => ({
    shine: typeof Audio !== "undefined" ? new Audio("/assets/sfx/twinkle.mp3") : undefined,
    ding: typeof Audio !== "undefined" ? new Audio("/assets/sfx/notification.mp3") : undefined,
  }), []);
  const play = (key: keyof typeof audio) => {
    const el = audio[key];
    if (!el) return;
    try {
      el.currentTime = 0;
      void el.play();
    } catch {}
  };
  return { play };
};

/** ─────────────────────────────
 *  타자 효과 컴포넌트
 *  ───────────────────────────── */
function Typewriter({ text, speed = 18, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [shown, setShown] = useState(reduced ? text : "");
  useEffect(() => {
    if (reduced) { onDone?.(); return; }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return <span>{shown}</span>;
}

/** ─────────────────────────────
 *  화자별 스타일
 *  ───────────────────────────── */
const getSpeakerStyle = (name?: Speaker) => {
  if (!name) return { accent: "whiteAlpha.900", bubble: "rgba(0,0,0,.75)" };
  if (name === "system") return { accent: "cyan.300", bubble: "rgba(0,30,35,.75)" };
  if (name === "sfx") return { accent: "purple.300", bubble: "rgba(30,0,35,.75)" };
  if (name === "unknown") return { accent: "red.300", bubble: "rgba(35,0,0,.78)" };
  if (name === "엄마") return { accent: "orange.300", bubble: "rgba(35,20,0,.75)" };
  return { accent: "yellow.300", bubble: "rgba(0,0,0,.75)" };
};

/** ─────────────────────────────
 *  시나리오
 *  ───────────────────────────── */
const scenarios: Scenario[] = [
  // Scene 1
  {
    image: "/assets/prologue_scenes/scene_1.png",
    dialogues: [
      { text: "독립을 앞둔 마지막 주말, 엄마의 손에 이끌려 먼지 쌓인 다락방으로 향했다." },
    ],
  },
  // Scene 2
  {
    image: "/assets/prologue_scenes/scene_2.png",
    dialogues: [
      { character: "엄마", text: "이거, 할아버지 유품 정리하다 나온 건데." },
      { text: "엄마가 내민 것은 투박한 구형 스마트폰이었다." },
      { text: "모서리는 닳아있었고, 뒷면에는 낡은 가죽 케이스 자국이 희미했다." },
      { character: "엄마", text: "자취하면… 유용할 거야." },
    ],
  },
  // Scene 3
  {
    image: "/assets/prologue_scenes/scene_3.png",
    dialogues: [
      { text: "엄마의 알쏭달쏭한 말을 뒤로하고, 나는 내 방으로 돌아와 졸업 앨범을 펼쳤다." },
      { text: "교복을 입고 촌스럽게 웃는 친구들의 얼굴, 다시 돌아갈 수 없기에 더 소중한 시간들." },
      { text: "한참을 그렇게 추억에 잠겨 있을 때였다." },
      { character: "sfx", text: "쨍-", sfx: "shine", vibrate: 30 },
      { text: "창문으로 들어온 햇살 한 줄기가 방구석에 놓인 상자를 비추며 눈부신 빛을 만들어냈다." },
    ],
  },
  // Scene 4
  {
    image: "/assets/prologue_scenes/scene_4.png",
    dialogues: [
      { text: "'어, 저게 왜 저기서…?'" },
      { text: "홀린 듯 다가가 상자를 열자, 그 안에는 아까 엄마가 건네준 할아버지의 스마트폰이 들어있었다." },
    ],
  },
  // Scene 5
  {
    image: "/assets/prologue_scenes/scene_5.png",
    dialogues: [
      { text: "먼지를 손으로 슥슥 닦아내자, 거짓말처럼 화면에 희미한 불이 들어왔다." },
      { text: "놀라 전원 버튼을 꾹 누르니, 잠시의 진동과 함께 너무나도 선명한 배경화면이 나타났다." },
      { text: "젊은 시절의 할머니와 할아버지가 환하게 웃고 있는 사진이었다." },
      { text: "배터리 잔량 100%." },
      { text: "마치 누군가 나를 위해 완벽하게 준비해 둔 것만 같았다." },
      { text: "갤러리를 열자 빛바랜 사진들이 가득했다." },
      { text: "친구들과 떠났던 수학여행, 풋풋했던 첫사랑의 뒷모습…" },
      { character: "나", text: "아… 나 이때 참 행복했는데." },
    ],
  },
  // Scene 6
  {
    image: "/assets/prologue_scenes/scene_6.png",
    dialogues: [
      { character: "sfx", text: "띠링-", sfx: "ding", vibrate: 40 },
      { text: "손에 쥔 스마트폰이 짧게 울렸다." },
      { text: "화면 상단에 새로운 메시지 알림이 떴다." },
      { text: "발신자는 '알 수 없음'이었다." },
      { character: "unknown", text: "[맞아. 우리 그때 참 행복했는데.]" },
      { text: "심장이 쿵, 하고 내려앉았다." },
      { text: "'나'라고 했는데, 왜 '우리'라고 대답하는 거지?" },
      { text: "해킹인가? 장난 메시지인가?" },
      { text: "온갖 생각이 머리를 스쳐 지나갔다." },
      { text: "소름이 돋아 핸드폰을 던져버릴까 하던 찰나, 다시 한번 화면이 환하게 빛났다." },
      { character: "sfx", text: "띠링-", sfx: "ding", vibrate: 40 },
      { character: "unknown", text: "[드디어 그 좁아터진 방에서 탈출하는구나. 축하해.]" },
      { character: "unknown", text: "[이제 곧 집 구하러 다닐 거지? 헛수고하기 전에 몇 가지만 알려줄게. 넌 지금 아무것도 모르잖아.]" },
      { character: "unknown", text: "[자, 이제부터 진짜 고생 시작인데… 내가 좀 도와줘야겠다.]" },
    ],
  },
];

/** ─────────────────────────────
 *  스킵 확인 다이얼로그
 *  ───────────────────────────── */
function SkipConfirmDialog({
  isOpen, onClose, onConfirm
}: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>프롤로그를 건너뛸까요?</AlertDialogHeader>
          <AlertDialogBody>나중에 ‘기록’에서 다시 볼 수 있어요.</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} variant="ghost">취소</Button>
            <Button colorScheme="yellow" onClick={onConfirm} ml={3}>스킵</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

/** ─────────────────────────────
 *  플로팅 스킵 버튼 (Tooltip + KBD 힌트)
 *  ───────────────────────────── */
function SkipFab({ onConfirm }: { onConfirm: () => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Tooltip
        hasArrow
        placement="left"
        openDelay={200}
      >
        <Button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          leftIcon={<ArrowForwardIcon />}
          position="absolute"
          bottom="24px"
          right="24px"
          zIndex={10}
          size="lg"
          variant="solid"
          colorScheme="purple"
          borderRadius="full"
          boxShadow="lg"
          aria-label="프롤로그 스킵"
        >
          Skip
        </Button>
      </Tooltip>
      <SkipConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => { onClose(); onConfirm(); }}
      />
    </>
  );
}

/** ─────────────────────────────
 *  메인 컴포넌트
 *  ───────────────────────────── */
const ProloguePage = () => {
  const navigate = useNavigate();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const sfx = useSfx();

  const scene = scenarios[sceneIndex];
  const dialogue = scene.dialogues[dialogueIndex];

  // 효과음/진동 트리거
  useEffect(() => {
    if (dialogue?.sfx) sfx.play(dialogue.sfx);
    if (dialogue?.vibrate && navigator.vibrate) navigator.vibrate(dialogue.vibrate);
  }, [sceneIndex, dialogueIndex]);

  // 진행 로직
  const goNext = () => {
    const current = scenarios[sceneIndex];
    if (dialogueIndex < current.dialogues.length - 1) {
      setDialogueIndex((p) => p + 1);
    } else {
      if (sceneIndex < scenarios.length - 1) {
        setSceneIndex((p) => p + 1);
        setDialogueIndex(0);
      } else {
        navigate("/game");
      }
    }
  };
  const goPrev = () => {
    if (dialogueIndex > 0) {
      setDialogueIndex((p) => p - 1);
    } else if (sceneIndex > 0) {
      const prevScene = scenarios[sceneIndex - 1];
      setSceneIndex((p) => p - 1);
      setDialogueIndex(prevScene.dialogues.length - 1);
    }
  };

  // 키 입력 (Enter/Space/←→ 이동, S: 스킵)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", " ", "ArrowRight"].includes(e.key)) goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key.toLowerCase() === "s") navigate("/game"); // Skip
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sceneIndex, dialogueIndex]);

  // 진행률
  const progress =
    ((sceneIndex + dialogueIndex / (scene.dialogues.length || 1)) / scenarios.length) * 100;

  return (
    <Box
      position="relative"
      height="100dvh"
      width="100vw"
      bg="black"
      overflow="hidden"
      onClick={goNext}
      cursor="pointer"
    >
      {/* 상단 진행바 */}
      <Box position="absolute" top="0" left="0" w="100%" zIndex={5}>
        <Progress size="md" value={progress} colorScheme="purple" />
      </Box>

      {/* 배경 이미지 */}
      <Fade in={true} key={sceneIndex}>
        <Box
          position="absolute"
          inset="0"
          bgImage={`url(${scene.image})`}
          bgSize="cover"
          bgPosition="center"
          bgRepeat="no-repeat"
          // 선택/드래그 방지 (선택)
          userSelect="none"
        />
      </Fade>


      {/* 바닥 그라데이션 */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,0) 40%)"
        pointerEvents="none"
      />

      {/* 콘텐츠: 모든 씬 공통 자막 UI */}
      <Box
        position="absolute"
        bottom="10%"
        left="50%"
        transform="translateX(-50%)"
        width={{ base: "92%", md: "80%", lg: "70%" }}
        color="white"
        zIndex={2}
      >
        <Box
          bg={getSpeakerStyle(dialogue.character).bubble}
          p={{ base: 4, md: 6 }}
          borderRadius="md"
          backdropFilter="blur(6px) saturate(120%)"
          border="1px solid rgba(255,255,255,.08)"
        >
          <Fade in={true} key={`${sceneIndex}-${dialogueIndex}`}>
            <VStack spacing={2} align="start">
              {!!dialogue.character && dialogue.character !== "sfx" && (
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  fontWeight="700"
                  color={getSpeakerStyle(dialogue.character).accent}
                >
                  {dialogue.character === "unknown" ? "알 수 없음" : dialogue.character}
                </Text>
              )}
              <Text fontSize={{ base: "xl", md: "2xl" }} lineHeight="1.5">
                <Typewriter text={dialogue.text} />
              </Text>
            </VStack>
          </Fade>
        </Box>
      </Box>

      {/* 하단 컨트롤 (텍스트 힌트는 제거, 좌우 버튼만 유지) */}
      <Center position="absolute" bottom="3%" width="100%" zIndex={3}>
        <HStack spacing={5}>
          <IconButton
            aria-label="이전"
            icon={<ArrowLeftIcon />}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          />
          <IconButton
            aria-label="다음"
            icon={<ArrowRightIcon />}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          />
        </HStack>
      </Center>

      {/* 플로팅 스킵 버튼 */}
      <SkipFab onConfirm={() => navigate("/game")} />
    </Box>
  );
};

/** ─────────────────────────────
 *  CSS 애니메이션 (pulse) — (필요시 다른 곳에서도 사용 가능)
 *  ───────────────────────────── */
const pulseAnimation = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: .55; }
    100% { opacity: 1; }
  }
`;
const style = document.createElement("style");
style.innerHTML = pulseAnimation;
document.head.appendChild(style);

export default ProloguePage;
