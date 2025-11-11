import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Box, Flex, VStack, Text, HStack, Image, Icon } from "@chakra-ui/react";
import { FiChevronRight } from "react-icons/fi";
import { PIXEL_PALETTE as C } from "../../pixelpalette";

/** 화자 */
type Speaker = "중개인" | "버디" | "나" | "임대인" | "공무원";
type Line = { who: Speaker; text: string };

/** 미션2 장면 키 */
export type Mission2Scene =
  | "intro"
  // 등기부등본
  | "deunggi_intro"
  | "deunggi_pyojabu"
  | "deunggi_gapgu"
  | "deunggi_eulgu"
  // 건축물대장
  | "building_intro"
  | "building"
  | "building_address"
  | "building_owner"
  | "building_usage"
  // 임대차계약서
  | "contract_intro"
  | "contract_basic"
  | "contract_special"
  | "contract_special_success" 
  | "contract_deposit_return"
  | "contract_address"
  | "contract_owner"
  // 계약 완료
  | "final_intro" 
  | "final_take_contract" 
  | "final_transfer" 
  | "final_receipt" 
  | "final_outro"
  // 전입신고
  | "transfer_intro"
  | "transfer_visit"
  | "transfer_online"
  | "transfer_complete"
  | "transfer_stamp"

  // 완료
  | "outro";

/** props: scene 모드 + custom 모드( messages ) 모두 지원 */
export interface MessageModalQuest3Mission2Props {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  dimBackground?: boolean;

  /** ── Scene 모드 ── */
  scene?: Mission2Scene;             // 지정 안 하면 "intro"

  /** ── Custom 모드(단일 화자) ── */
  messages?: string[];               // 이게 존재하면 scene 대신 이걸로 렌더링
  avatarSrc?: string;                // custom 모드에서 사용할 아바타
  title?: string;                    // custom 모드에서 좌측 이름(헤더)
  themeColor?: string;               // custom 모드 테두리색(기본 브라운)

  /** 공통 옵션 */
  typingSpeed?: number;              // ms/글자 (0=즉시)
  overlayClickAdvance?: boolean;     // 오버레이 클릭으로 진행
  clickToAdvance?: boolean;          // "Enter로 다음" 클릭 가능
}

/** 화자 메타 */
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
    nameColor: "#9c7519ff",
    bubbleTint: "#d9f7ef",
  },
  공무원: {
    avatar: "/assets/quest3_scenes/official.png",
    nameColor: "#59b922ff",
    bubbleTint: "#d9f7ef",
  },
};

/** 장면별 스크립트 */
const SCENES: Record<Mission2Scene, Line[]> = {
  /* 인트로 */
  intro: [
    { who: "중개인", text: "이제 계약에 앞서 확인해야 하는 서류를 보여드릴게요." },
    { who: "버디", text: "이번 미션은 ‘계약 관련 서류 점검’이야. 등기부등본, 건축물대장, 임대차계약서를 꼼꼼히 확인해!" },
    { who: "버디", text: "의심스러운 점이 보이면 그냥 넘어가지 말고, 반드시 수정 요청해야 해. 안전한 계약의 핵심이거든!" },
    { who: "나", text: "(좋아. 하나씩 살펴보자. 먼저 등기부등본부터!)" },
  ],

  /* 등기부등본 */
  deunggi_intro: [
    { who: "중개인", text: "이건 계약할 집의 등기부등본입니다. 한 번 살펴보시죠." },
    { who: "버디", text: "등기부등본은 부동산의 전체 정보 문서야. 집 주인/압류/담보 대출 등을 확인할 수 있어." },
    { who: "버디", text: "구성은 표제부, 갑구, 을구로 나뉘어!" },
  ],
  deunggi_pyojabu: [
    { who: "버디", text: "표제부에서는 실제 주소와 ‘소재지번/건물번호’가 일치하는지부터 체크!" },
    { who: "나", text: "(표제부 주소 일치 확인 완료.)" },
  ],
  deunggi_gapgu: [
    { who: "버디", text: "갑구는 소유권. 등기부 소유자가 임대인 신분증과 일치하는지 확인!" },
    { who: "버디", text: "‘가등기·신탁·가압류·경매개시결정·임차권등기명령’이 보이면 주의." },
    { who: "나", text: "(소유자 정보 일치, 위험 단어 없음.)" },
  ],
  deunggi_eulgu: [
    { who: "나", text: "(을구에 근저당권설정이 있네. 괜찮을까?)" },
    { who: "버디", text: "채권최고액은 보통 실제 대출의 120~130%. 3,600만이면 실제 대출은 약 3,000만." },
    { who: "버디", text: "‘집주인 대출액 + 내 보증금’이 시세의 70% 미만이면 보통 안전선이야." },
    { who: "나", text: "(보증금 3,000만 + 대출 3,000만, 시세 1억 → 안전선 안쪽!)" },
  ],

  /* 건축물대장 */
  building_intro: [
    { who: "중개인", text: "이건 계약하실 집의 건축물대장이에요. 이것도 살펴보시죠!" },
    { who: "버디", text: "위반건축물 여부, 주소/소유자 일치, ‘주용도=주택’인지 확인해!" },
  ],
  building: [
    { who: "나", text: "(우측 상단 ‘위반건축물’ 표시 없음. 정상!)" },
  ],
  building_address: [
    { who: "버디", text: "‘대지위치’(주소)가 등기부/계약서와 동일한지 교차 확인!" },
    { who: "나", text: "(주소 일치.)" },
  ],
  building_owner: [
    { who: "버디", text: "‘소유자 현황’ 성명이 등기부 소유자와 같은지 확인." },
    { who: "나", text: "(소유자 이름 일치!)" },
  ],
  building_usage: [
    { who: "버디", text: "‘주용도’가 주택인지 확인. 주거 외면 각종 문제가 생길 수 있어." },
    { who: "나", text: "(주용도: 주택 — 정상.)" },
  ],

  /* 임대차계약서 */
  contract_intro: [
    { who: "중개인", text: "이제 임대차계약서를 작성해 봅시다. 중요한 내용이 많으니 꼼꼼히 확인해 주세요." },
  ],
  contract_basic: [
    { who: "버디", text: "보증금·월세·기간·관리비·지급일 확인. 관리비 ‘포함/별도’도 명확해야 해." },
    { who: "버디", text: "전기/수도/가스가 ‘별도’면 실제 월 지출이 달라질 수 있어." },
    { who: "나", text: "(핵심 조건 및 관리비 포함 항목 확인 완료.)" },
  ],
  contract_special: [
    { who: "버디", text: "특약은 계약서보다 우선. ‘임차인 전액/임차인 부담’은 위험!" },
    { who: "버디", text: "‘임차인이 원인 제공 시 부담’처럼 조건을 명확히 바꾸도록 요청해." },
  ],
  contract_special_success: [
    { who: "나", text: "일부 특약사항은 임차인에게 너무 불리하네요.\n시설물 수리는 원칙적으로 임대인의 책임이니 ‘임차인 부담’,\n특약사항들은 ‘임차인이 원인 제공 시 부담’으로 수정해주세요." },
    { who: "중개인", text: "좋습니다. ‘임차인이 원인 제공 시 부담’으로 반영해 임대인께 전달하겠습니다." },
    { who: "버디", text: "잘했어! 위험 특약을 정정했어. 다음 항목도 꼼꼼히 확인하자." },
  ],
  contract_deposit_return: [
    { who: "버디", text: "보증금 반환이 모호하면 지연돼. \n‘종료일로부터 14일 이내, 임차인 계좌로’처럼 구체화되어있어야 해!" },
    { who: "나", text: "이 조항의 ‘확인 후 반환’ 부분을\n‘계약 종료일로부터 14일 이내, 임차인 계좌로 반환’으로 수정해 주세요." },
    { who: "중개인", text: "네, 이것도 반영하여 임대인에게 전달하겠습니다." },
  ],
  contract_address: [
    { who: "버디", text: "계약서 ‘소재지’가 등기부/대장과 동일한지 확인." },
    { who: "나", text: "(소재지 동일.)" },
  ],
  contract_owner: [
    { who: "버디", text: "임대인 인적사항(성명/주민번호 앞자리/주소)이 소유주와 일치하는지 재확인!" },
    { who: "나", text: "(임대인 정보 일치 확인.)" },
  ],
  final_intro: [
  { who: "버디", text: "집 계약이 끝났다면 계약서 원본이나 사본을 꼭 받아 둬. 분쟁 시 중요한 근거야!" },
  { who: "버디", text: "계약금·잔금은 반드시 '임대인 명의 계좌'로 송금하고, 영수증/거래명세서도 챙기자." },
  ],
  final_take_contract: [
    { who: "중개인", text: "모든 서류 확인 끝났습니다. 계약서 원본 챙겨가세요." },
    { who: "나", text: "(계약서 원본은 챙겼다!)" },
  ],
  final_transfer: [
    { who: "중개인", text: "이제 소유주 명의 계좌로 계약금 잔금을 송금해 주세요." },
  ],
  final_receipt: [
    { who: "나", text: "송금 완료했습니다!" },
    { who: "임대인", text: "네, 이체 확인했습니다. 영수증 드릴게요." },
    { who: "나", text: "(영수증도 받았고… 이제 정말 끝!)" },
  ],
  final_outro: [
    { who: "버디", text: "완료! 다음은 주민센터 방문(전입신고/확정일자)으로 넘어가자." },
  ],

  transfer_intro: [
  { who: "버디", text: "아직 한 단계가 남아있어! 주민센터에 방문하거나 온라인으로 전입신고를 해야 해." },
  { who: "버디", text: "보증금 6천만 원 또는 월세 30만 원 초과 시, 30일 내 임대차계약 공동신고도 잊지 말자!" },
  ],
  transfer_visit: [
    { who: "버디", text: "주민센터에 도착했어. 전입신고서 작성부터 해보자." },
    { who: "공무원", text: "안녕하세요. 작성하신 전입신고서와 주민등록증 보여주세요." },
    { who: "나", text: "네 여기요." },
  ],
  transfer_online: [
  { who: "버디", text: "공인인증서만 있으면 집에서도 전입신고를 할 수 있어!" },
  { who: "버디", text: "이건 정부24 사이트 화면이야. 여기에 로그인해서 절차를 진행하면 돼." },
],
  transfer_stamp: [
    { who: "나", text: "확정일자 도장도 부탁드릴게요." },
    { who: "공무원", text: "네, 완료되었습니다." },
  ],
  transfer_complete: [
    { who: "버디", text: "전입신고와 확정일자까지 완료! 이제 정말 내 집이야 🏡" },
    { who: "버디", text: "계약서 원본, 영수증, 확정일자 증서 모두 잘 보관해!" },
  ],

  /* 완료 */
  outro: [
    { who: "버디", text: "필요한 서류 점검을 모두 마쳤어! 중개사 등록증도 확인해 두면 좋아." },
    { who: "버디", text: "대리인과 계약 시 신분증/위임장/인감증명서 필수. 가능하면 임대인 본인과 계약하자." },
    { who: "나", text: "(좋아. 다음 단계로 진행하자!)" },
  ],
};

export default function MessageModalQuest3Mission2({
  isOpen,
  onComplete,
  onClose,
  scene = "intro",
  dimBackground = true,
  messages,                 
  avatarSrc,
  title,
  themeColor = "#815b3a",
  typingSpeed = 20,
  overlayClickAdvance = true,
  clickToAdvance = true,
}: MessageModalQuest3Mission2Props) {
  /** custom 모드 여부 */
  const isCustom = !!(messages && messages.length);

  /** 표시할 대사 라인 */
  const lines: Line[] = useMemo(() => {
    if (isCustom) {
      // 단일 화자(타이틀 표시)로 렌더링
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

  // scene 혹은 messages가 바뀌면 처음부터
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

  // 키보드
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
      bg="transparent"   
      backdropFilter="none"
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
              <Box as="span" ml="6px" display="inline-block" w="10px" h="1em" transform="translateY(2px)" bg="#000"
                   opacity={isTyping ? 1 : 0} animation="blink 1s steps(2, start) infinite" />
            </Text>
          </Box>

          <HStack align="center" justify="space-between" pb={[2, 3]} pr={[1, 2]}>
            <Text fontSize="xs" color="#333">
              {idx + 1} / {total}
            </Text>
            <HStack spacing={1} onClick={clickToAdvance ? advance : undefined} cursor={clickToAdvance ? "pointer" : "default"} userSelect="none">
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
