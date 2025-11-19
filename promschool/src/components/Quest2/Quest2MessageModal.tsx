import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Box, Flex, VStack, Text, HStack, Image, Icon } from "@chakra-ui/react";
import { FiChevronRight } from "react-icons/fi";
import { PIXEL_PALETTE as C } from "../pixelpalette";

/** 화자 */
type Speaker = "중개인" | "버디" | "나" | "임대인";
type Line = { who: Speaker; text: string };

/** 퀘스트2 장면 키 */
export type Quest2Scene =
  | "intro"

  // 첫 번째 매물
  | "house1_intro"
  | "h1_window_buddy"
  | "h1_window_after"
  | "h1_sink_buddy"
  | "h1_sink_after"
  | "h1_toilet_buddy"
  | "h1_toilet_after"
  | "h1_select_prompt"

  // 두 번째 매물
  | "house2_intro"
  | "h2_wall_buddy"
  | "h2_wall_after"
  | "h2_closet_buddy"
  | "h2_closet_after"
  | "h2_veranda_buddy"
  | "h2_veranda_after"

  // 최종 선택/결과
  | "final_select"
  | "success"
  | "failed";

/** props */
export interface MessageModalQuest2Props {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  dimBackground?: boolean;

  /** Scene 모드 */
  scene?: Quest2Scene; // 지정 없으면 "intro"

  /** Custom 모드(단일 화자 풍선) */
  messages?: string[];  // 있으면 scene 대신 이걸 렌더
  avatarSrc?: string;   // custom 모드 아바타
  title?: string;       // custom 모드 좌측 이름
  themeColor?: string;  // custom 모드 테두리색

  /** 공통 옵션 */
  typingSpeed?: number;           
  overlayClickAdvance?: boolean;  
  clickToAdvance?: boolean;       
}

const META: Record<
  Speaker,
  { avatar: string; nameColor: string; bubbleTint: string }
> = {
  중개인: {
    avatar: "/assets/quest3_scenes/agent.png",
    nameColor: "#815b3a",
    bubbleTint: "#fff6e9",
  },
  버디: {
    avatar: "/assets/quest3_scenes/buddy.png",
    nameColor: "#A372C2",
    bubbleTint: "#e1d2f9",
  },
  나: {
    avatar: "/assets/quest3_scenes/player.png",
    nameColor: "#3aa689",
    bubbleTint: "#d9f7ef",
  },
  임대인: {
    avatar: "/assets/quest3_scenes/owner.png",
    nameColor: "#9c7519",
    bubbleTint: "#eef9f1",
  },
};

/** 장면별 스크립트 (퀘스트2 대본 반영) */
const SCENES: Record<Quest2Scene, Line[]> = {
  /* 인트로 */
  intro: [
    { who: "중개인", text: "자, 그럼 이제 같이 집을 보러 가볼까요?" },
    { who: "버디", text: "미션: 추천된 매물들을 꼼꼼히 점검하고, 하자가 없는 좋은 매물을 골라!" },
  ],

  /* 첫 번째 매물 */
  house1_intro: [
    { who: "중개인", text: "이 집은 어떠세요? 햇볕이 아주 잘 드는 남향이에요.\n요즘 이렇게 좋은 매물 잘 안 나옵니다." },
    { who: "버디", text: "MISSION 1. 첫 번째 매물 자세히 살펴보기 \n(1) 창문, (2) 싱크대, (3) 화장실을 골라서 확인해봐!" },
  ],
  h1_window_buddy: [
    { who: "버디", text: "창문은 덜걱거림 없이 잘 열리고 닫히는지, 창틀에 먼지·벌레가 지나치게 많지 않은지, 이중창 여부, 잠금장치 작동까지 확인!" },
  ],
  h1_window_after: [
    { who: "나", text: "(창문이 잘 안 열리네…)" },
    { who: "나", text: "창문이 왜 이래요? 잘 안 닫히네요. 창틀도 더럽고…" },
    { who: "임대인", text: "조금만 힘주면 잘 닫혀요! 청소를 못해서 그래요~ 입주 전엔 깔끔하게 해둘게요." },
    { who: "나", text: "(아무리 그래도… 창틀에 먼지랑 벌레가 너무 많은데?)" },
  ],
  h1_sink_buddy: [
    { who: "버디", text: "싱크대는 수압/배수 속도/하부 배관 누수 체크!" },
  ],
  h1_sink_after: [
    { who: "나", text: "(물 잘 나오고. 수압도 배수도 괜찮네.)" },
  ],
  h1_toilet_buddy: [
    { who: "버디", text: "화장실은 세면대/변기/환풍기 작동, 틈새 곰팡이 여부 확인!" },
  ],
  h1_toilet_after: [
    { who: "나", text: "여기 환풍기가 왜 이러죠? 고장인가요?" },
    { who: "임대인", text: "가끔 그럴 때 있어요~ 대신 창문 환기 잘 돼요!" },
    { who: "나", text: "(곰팡이 자국이 보이는데….)" },
  ],
  h1_select_prompt: [
    { who: "버디", text: "첫 번째 매물을 선택할지? 아니면 다른 매물도 더 볼지 결정하자." },
  ],

  /* 두 번째 매물 */
  house2_intro: [
    { who: "중개인", text: "두번째 매물도 살펴볼까요?\n이번 집은 보고 가신 분이 곧 연락 준다고 했어요.\n마음에 드시면 그분보다 빨리 계약하셔야 합니다~" },
    { who: "버디", text: "MISSION 3. 두 번째 매물 자세히 살펴보기\n(1) 벽지/바닥, (2) 붙박이장, (3) 베란다 모두 꼼꼼히 확인해!" },
  ],
  h2_wall_buddy: [
    { who: "버디", text: "벽지 곰팡이/얼룩/들뜸, 바닥 긁힘/틈새 벌어짐 체크! 입주 전 도배·바닥 교체 약속 가능 여부도 중요!" },
  ],
  h2_wall_after: [
    { who: "나", text: "벽지나 바닥 상태가 좀 안 좋네요…?" },
    { who: "임대인", text: "아이들이 어릴 때부터 살아서 그래요. 입주 전에 도배/장판 싹 새로 해드릴게요!" },
  ],
  h2_closet_buddy: [
    { who: "버디", text: "붙박이장은 문 여닫힘/경첩/냄새/곰팡이, 내부 수납 확인!" },
  ],
  h2_closet_after: [
    { who: "나", text: "(곰팡이 자국 없고 냄새도 안 나네. 수납도 충분.)" },
    { who: "임대인", text: "작년에 큰맘 먹고 새로 맞췄어요. 몇 년은 끄떡없죠!" },
  ],
  h2_veranda_buddy: [
    { who: "버디", text: "베란다는 채광/환기/배수/단열, 곰팡이·누수 흔적, 창문 여닫힘까지 체크!" },
  ],
  h2_veranda_after: [
    { who: "나", text: "(창문 잘 열리고 맞바람도 잘 분다. 배수구/타일도 깔끔.)" },
    { who: "임대인", text: "여름에 바람 솔솔, 이중창이라 겨울에도 따뜻해요. 계약하시면 화초 하나 드릴게요~" },
  ],

  /* 최종 선택 */
  final_select: [
    { who: "중개인", text: "다 둘러봤네요. 어떤 매물이 마음에 드세요? 어디로 계약하시겠어요?" },
    { who: "버디", text: "지금까지 둘러본것들을 잘 생각해서 골라봐!!" },
  ],

  /* 결과 */
  success: [
    { who: "버디", text: "MISSION COMPLETE! 하자 적은 좋은 매물 선택 성공. 가계약 진행하자!" },
    { who: "중개인", text: "가계약하고 가실 건가요?" },
    { who: "버디", text: "가계약은 일부 계약금을 먼저 송금(보통 10% 이하). 문서로 조건 명확히,\n임대인 본인 계좌로 송금 + 영수증 필수!" },
    { who: "나", text: "송금했습니다. 10일에 계약하러 오겠습니다!" },
    { who: "중개인", text: "입금 확인했습니다. 10일에 뵙겠습니다." },
    { who: "버디", text: "가계약은 정식 계약 전 임시 계약. 취소/반환 조건을 꼭 확인해!" },
  ],
  failed: [
    { who: "나", text: "첫 번째 매물로 할게요." },
    { who: "버디", text: "MISSION FAILED… 하자가 없는 매물을 찾는 데 실패. 계약 전 매물 재선택이 필요해." },
  ],
};

export default function Quest2MessageModal({
  isOpen,
  onComplete,
  onClose,
  scene = "intro",
  messages,
  avatarSrc,
  title,
  themeColor = "#815b3a",
  typingSpeed = 20,
  overlayClickAdvance = true,
  clickToAdvance = true,
  dimBackground = true
}: MessageModalQuest2Props) {
  /** custom 모드 여부 */
  const isCustom = !!(messages && messages.length);

  /** 표시할 대사 라인 */
  const lines: Line[] = useMemo(() => {
    if (isCustom) {
      return messages!.map((t) => ({ who: "나", text: t }));
    }
    return SCENES[scene] ?? SCENES.intro;
  }, [isCustom, messages, scene]);

  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<number | null>(null);

  const current = lines[idx];
  const total = lines.length;

  // 메타(화자별), custom 모드면 외부 스타일 사용
  const meta = META[current?.who ?? "중개인"];
  const headerName = isCustom ? (title ?? "안내") : current?.who;
  const avatar = isCustom ? (avatarSrc ?? meta.avatar) : meta.avatar;
  const borderColor = isCustom ? themeColor : meta.nameColor;
  const bubbleTint = isCustom ? "#ffffff" : `${meta.bubbleTint}`;

  const startTyping = useCallback(
    (text: string) => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
      if (!typingSpeed) {
        setShown(text);
        setIsTyping(false);
        return;
      }
      setShown("");
      setIsTyping(true);
      let i = 0;
      typingTimer.current = window.setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          setIsTyping(false);
          if (typingTimer.current) {
            window.clearInterval(typingTimer.current);
            typingTimer.current = null;
          }
        }
      }, typingSpeed) as unknown as number;
    },
    [typingSpeed]
  );

  useEffect(() => {
    if (!isOpen) return;
    startTyping(current?.text ?? "");
    return () => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
    };
  }, [isOpen, idx, current?.text, startTyping]);

  // scene/messages 바뀌면 처음부터
  useEffect(() => {
    setIdx(0);
    setShown("");
    setIsTyping(false);
  }, [scene, isCustom, messages]);

  const advance = useCallback(() => {
    if (!isOpen) return;
    if (isTyping) {
      setShown(current.text);
      setIsTyping(false);
      return;
    }
    if (idx < total - 1) {
      setIdx((v) => v + 1);
    } else {
      onComplete();
      setIdx(0);
      setShown("");
      onClose?.();
    }
  }, [isOpen, isTyping, current?.text, idx, total, onComplete, onClose]);

  // 키보드 진행
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      } else if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, advance, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1500}
      bg={dimBackground ? "rgba(0,0,0,0.55)" : "transparent"}   // ✅ 살짝 어둡게
      backdropFilter={dimBackground ? "blur(4px)" : "none"}      // ✅ 블러
      onClick={overlayClickAdvance ? advance : undefined}
      display="flex"
      alignItems="flex-end"
      justifyContent="center"
      pb="24px"
    >
      <Flex
        onClick={(e) => e.stopPropagation()}
        maxW="880px"
        w={["94%", "88%", "880px"]}
        bg={`${bubbleTint}F2`}
        borderRadius="16px"
        border={`3px solid ${borderColor}`}
        boxShadow={`0 12px 36px ${C.shadow}`}
        overflow="hidden"
      >
        {/* 아바타 */}
        <Flex align="center" justify="center" p={[3, 4]} minW={["88px", "110px"]}>
          <Image src={avatar} alt={String(headerName)} boxSize={["70px", "86px"]} objectFit="contain" draggable={false} />
        </Flex>

        {/* 텍스트 */}
        <VStack align="stretch" spacing={1} flex={1} pr={[2, 3, 4]} py={[2, 3]}>
          <Text fontWeight="bold" color={borderColor} fontFamily="NeoDGM" fontSize={["sm", "md"]} mb={1}>
            {headerName}
          </Text>

          <Box pb={[2, 3]} pr={[1, 2]}>
            <Text fontFamily="NeoDGM" fontSize={["md", "lg"]} color="#000" lineHeight="1.7" whiteSpace="pre-wrap" userSelect="none">
              {shown}
              <Box
                as="span"
                ml="6px"
                display="inline-block"
                w="10px"
                h="1em"
                transform="translateY(2px)"
                bg="#000"
                opacity={isTyping ? 1 : 0}
                animation="blink 1s steps(2, start) infinite"
              />
            </Text>
          </Box>

          <HStack align="center" justify="space-between" pb={[2, 3]} pr={[1, 2]}>
            <Text fontSize="xs" color="#333">
              {idx + 1} / {total}
            </Text>
            <HStack
              spacing={1}
              onClick={clickToAdvance ? advance : undefined}
              cursor={clickToAdvance ? "pointer" : "default"}
              userSelect="none"
            >
              <Text fontSize="sm" color="#333" mr={1} sx={{ animation: "pulse 1.6s ease-in-out infinite" }}>
                Enter로 다음
              </Text>
              <Icon as={FiChevronRight} boxSize={5} color="#333" sx={{ animation: "nudge 1.2s ease-in-out infinite" }} />
            </HStack>
          </HStack>
        </VStack>
      </Flex>

      <style>{`
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes pulse { 0%{opacity:.65;transform:translateZ(0)} 50%{opacity:1;transform:translateZ(0) scale(1.03)} 100%{opacity:.65;transform:translateZ(0)} }
        @keyframes nudge { 0%{transform:translateX(0)} 50%{transform:translateX(3px)} 100%{transform:translateX(0)} }
      `}</style>
    </Box>
  );
}
