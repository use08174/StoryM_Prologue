// src/components/Quest2/ChoiceFlow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Image,
  Text,
  HStack,
  Circle,
  usePrefersReducedMotion,
  CloseButton,
  Checkbox,
  VStack,
  Divider,
  Flex,
} from "@chakra-ui/react";
import { WarningTwoIcon } from "@chakra-ui/icons";
import { useSfx } from "../../lib/usingSfx"; // 프로젝트 경로에 맞춰 유지

type ChoiceFlowProps = {
  type: 1 | 2 | 3;
  houseIndex?: 1 | 2 ;
  onClose: () => void;
  onComplete: () => void;
};

type ActionItem = { key: string; label: string; sfx?: string; img?: string };

type Hotspot = {
  key: string;
  title: string;
  /** overview 이미지 위의 박스 (left, top, width, height) in % */
  box: [number, number, number, number];
  /** 확대 이미지 */
  zoomImg: string;
  /** 확대 뷰에서 수행할 액션들(2~3개) */
  actions: ActionItem[];
  /** 확대 뷰에서 핀 좌표(액션과 1:1) in % */
  pins?: [number, number][];
};

type Scene = {
  overviewImg: string;
  hotspots: Record<1 | 2 | 3, Hotspot>;
};

const S = {
  border: "#333",
  primary: "#7E44A8",
  shadow: "rgba(0,0,0,0.45)",
  done: "#3DBE8B",
  warn: "#E4A11B",
};

const L = {
  contentW: 'min(1400px, 98vw)', // 🔼 전체 너비 (원래 1480/96)
  panelW: 420,                   // 🔼 체크리스트 폭(px) (원래 360/260)
  gap: 20,                       // 🔽 좌우 간격(px) (원래 24)
};

/* ====== 장면 정의 ====== */
/** 매물 1: 창문/싱크대/화장실 */
const scene1: Scene = {
  overviewImg: "/assets/quest2_scenes/room1_main.png",
  hotspots: {
    1: {
      key: "window",
      title: "창문",
      box: [64, 18, 24, 30],
      zoomImg: "/assets/quest2_scenes/room1_window.png",
      actions: [
        { key: "open", label: "창문 열어보기", img: "/assets/quest2_scenes/room1_window.png" },
        { key: "sill", label: "창틀 들여다보기", img: "/assets/quest2_scenes/room1_window_dust.png" },
        { key: "lock", label: "잠금장치 확인", img: "/assets/quest2_scenes/room1_window_lock.png" },
      ],
      pins: [[22, 62], [50, 70], [78, 60]],
    },
    2: {
      key: "sink",
      title: "싱크대",
      box: [1, 40, 16, 26],
      zoomImg: "/assets/quest2_scenes/room1_sink.png",
      actions: [
        { key: "sink", label: "싱크대 살펴보기", img: "/assets/quest2_scenes/room1_sink.png" },
        { key: "water", label: "물 틀어보기", sfx: "/assets/quest2/sfx_water_on.mp3", img: "/assets/quest2_scenes/room1_sink_with_water.png" },
        { key: "drain", label: "배수/하부 누수 확인", img: "/assets/quest2_scenes/room1_sink_below.png" },
      ],
      pins: [[20, 50], [55, 40], [80, 78]],
    },
    3: {
      key: "toilet",
      title: "화장실",
      box: [27, 20, 20, 60],
      zoomImg: "/assets/quest2_scenes/room1_toilet.png",
      actions: [
        { key: "tap", label: "세면대 물 틀기", sfx: "/assets/quest2_scenes/washstand.mp3" },
        { key: "flush", label: "변기 물 내리기", sfx: "/assets/quest2_scenes/toilet.wav" },
        { key: "fan", label: "환풍기 켜보기", sfx: "/assets/quest2_scenes/fan.mp3" },
      ],
      pins: [[78, 70], [36, 90], [12, 42]],
    },
  },
};
/** (필요 시) 매물 3: 벽지/붙박이/베란다 */
const scene2: Scene = {
  overviewImg: "/assets/quest2_scenes/room2_main.png",
  hotspots: {
    1: {
      key: "wallfloor",
      title: "벽지/바닥",
      box: [20, 18, 26, 78],
      zoomImg: "/assets/quest2_scenes/room2_wall_bad.png",
      actions: [
        { key: "wall", label: "벽지 가까이", img: "/assets/quest2_scenes/room2_wall_bad.png" },
        { key: "floor", label: "바닥 보기", img: "/assets/quest2_scenes/room2_floor_bad.png" },
      ],
      pins: [[36, 36], [70, 70]],
    },
    2: {
      key: "closet",
      title: "붙박이장",
      box: [2, 10, 14, 86],
      zoomImg: "/assets/quest2_scenes/room2_closet.png",
      actions: [
        { key: "inside", label: "내부 보기", img: "/assets/quest2_scenes/room2_closet_open.png" },
      ],
      pins: [[42, 62]],
    },
    3: {
      key: "veranda",
      title: "베란다",
      box: [56, 18, 28, 60],
      zoomImg: "/assets/quest2_scenes/room2_veranda.png",
      actions: [
        { key: "window", label: "창문 열기", img: "/assets/quest2_scenes/room2_veranda.png" },
        { key: "drain", label: "배수구", img: "/assets/quest2_scenes/room2_veranda_drain.png" },
        { key: "tile", label: "타일 상태", img: "/assets/quest2_scenes/room2_veranda_tile.png" },
      ],
      pins: [[34, 40], [62, 72], [84, 54]],
    },
  },
};

const SCENES: Record<1 | 2, Scene> = { 1: scene1, 2: scene2 };
export default function ChoiceFlow({
  type,
  houseIndex = 1,
  onClose,
  onComplete,
}: ChoiceFlowProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // 현재 장면/핫스팟
  const [viewType, setViewType] = useState<1 | 2 | 3>(type);
  useEffect(() => setViewType(type), [type]);

  // 확대/개요 단계
  const [phase, setPhase] = useState<"overview" | "zoom">("overview");

  // 액션 실행 상태
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [shotImg, setShotImg] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const { play: playSfx, preload } = useSfx();

  const scene = SCENES[houseIndex];
  const hotspot = scene.hotspots[viewType];

  // 이 장면의 모든 SFX 미리 로드
  useEffect(() => {
    const urls: (string | undefined)[] = [];
    (Object.values(scene.hotspots) as Hotspot[]).forEach((hs) => {
      hs.actions.forEach((a) => urls.push(a.sfx));
    });
    preload(urls);
  }, [scene, preload]);

  // 통합 체크리스트 소스(9개)
  const checklist = useMemo(() => {
    const items: {
      g: 1 | 2 | 3;
      gTitle: string;
      idx: number;
      key: string;
      label: string;
    }[] = [];
    (Object.entries(scene.hotspots) as [string, Hotspot][]).forEach(([k, hs]) => {
      hs.actions.forEach((a, i) =>
        items.push({
          g: Number(k) as 1 | 2 | 3,
          gTitle: hs.title,
          idx: i,
          key: `${k}-${a.key}`,
          label: a.label,
        })
      );
    });
    return items;
  }, [scene]);

  const checklistGroups = useMemo(() => {
    const map: Record<string, typeof checklist> = {};
    checklist.forEach((it) => {
      const k = `${it.g}-${it.gTitle}`;
      (map[k] ||= []).push(it);
    });
    return Object.entries(map).map(([k, arr]) => {
      const [gStr, gTitle] = k.split("-");
      return { g: Number(gStr) as 1 | 2 | 3, gTitle, items: arr };
    });
  }, [checklist]);

  const totalCount = checklist.length;
  const doneCount = checklist.filter((it) => visited[it.key]).length;
  const allDone = doneCount === totalCount;

  // 9개 모두 끝나면 부모로 완료 전달
  const completedRef = useRef(false);
  useEffect(() => {
    if (!completedRef.current && totalCount > 0 && allDone) {
      completedRef.current = true;
      
      onComplete();
    }
  }, [allDone, totalCount, onComplete]);

  // 키 입력: Backspace, Zoom에서 1/2/3
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Backspace") {
        if (phase === "zoom") setPhase("overview");
      }
      if (phase === "zoom" && ["1", "2", "3"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < hotspot.actions.length) triggerActionLocal(idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, hotspot.actions]);

  // 로컬(현재 viewType)에서 액션 실행
  const triggerActionLocal = (idx: number) => {
    const a = hotspot.actions[idx];
    if (!a) return;
    if (a.sfx) playSfx(a.sfx, { duck: 0.35, restoreMs: 250, volume: 1 });
    setVisited((v) => ({ ...v, [`${viewType}-${a.key}`]: true }));
    setShotImg(a.img ?? null);
    setActiveIdx(idx);
  };

  // 글로벌(체크리스트/개요)에서 특정 g, idx 실행
  const triggerActionGlobal = (g: 1 | 2 | 3, idx: number) => {
    setViewType(g);
    setPhase("zoom");
    setTimeout(() => {
      const a = scene.hotspots[g].actions[idx];
      if (!a) return;
      if (a.sfx) playSfx(a.sfx, { duck: 0.35, restoreMs: 250, volume: 1 });
      setVisited((v) => ({ ...v, [`${g}-${a.key}`]: true }));
      setShotImg(a.img ?? null);
      setActiveIdx(idx);
    }, 0);
  };

  /* ---------- 작은 UI 파츠 ---------- */
  const WarningBadge = () => (
    <Circle size="28px" bg="rgba(0,0,0,0.55)" border={`2px solid ${S.border}`} color="yellow.300">
      <WarningTwoIcon />
    </Circle>
  );

  const SideChecklist = () => (
    <Box
      flexShrink={0}
      w={["100%", "260px"]}
      bg="rgba(255,255,255,0.96)"
      border={`2px solid ${S.border}`}
      borderRadius="14px"
      fontFamily="neodgm"
      boxShadow={`0 10px 24px ${S.shadow}`}
      p={4}
    >
      <Text fontWeight="bold" mb={1}>
        체크리스트
      </Text>
      <Text mb={3} fontSize="sm" color="gray.600">
        {doneCount} / {totalCount} 완료
      </Text>
      <Divider mb={3} />
      <VStack align="stretch" spacing={3}>
        {checklistGroups.map(({ g, gTitle, items }) => (
          <Box key={`${g}-${gTitle}`}>
            <Text fontWeight="semibold" mb={1}>
              {gTitle}
            </Text>
            <VStack align="stretch" spacing={1}>
              {items.map((it) => (
                <Checkbox
                  key={it.key}
                  isChecked={!!visited[it.key]}
                  onChange={() => triggerActionGlobal(it.g, it.idx)}
                >
                  ({it.idx + 1}) {it.label}
                </Checkbox>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
      {!allDone ? (
        <Text mt={4} fontSize="sm" color="gray.500">
              모든 항목을 완료하세요.
        </Text>
      ) : (
        <Button mt={4} colorScheme="purple" onClick={() => { /* 안전망 버튼(자동 이동이 기본) */ }}>
          완료
        </Button>
      )}
    </Box>
  );

  /* ---------- 왼쪽: 이미지 카드(개요/확대) ---------- */
  const OverviewCard = () => (
    <Box
      maxW={L.contentW}
      position="relative"
      border={`3px solid ${S.border}`}
      borderRadius="16px"
      overflow="hidden"
      boxShadow={`0 10px 24px ${S.shadow}`}
    >
      <Image src={scene.overviewImg} alt="overview" w="110%" draggable={false} />

      {/* 세 개 핫스팟 모두 표시 + 경고 배지 */}
      {(Object.keys(scene.hotspots) as unknown as (1 | 2 | 3)[]).map((k) => {
        const hs = scene.hotspots[k];
        return (
          <Box key={hs.key}>
            <Box
              position="absolute"
              left={`${hs.box[0]}%`}
              top={`${hs.box[1]}%`}
              w={`${hs.box[2]}%`}
              h={`${hs.box[3]}%`}
              border={`3px dashed ${S.primary}`}
              borderRadius="12px"
              boxShadow={`0 0 0 6px rgba(126,68,168,0.22)`}
              cursor="pointer"
              onClick={() => {
                setViewType(k);
                setShotImg(null);
                setActiveIdx(null);
                setPhase("zoom");
              }}
              sx={
                !prefersReducedMotion
                  ? { animation: "pulseGlow 1.8s ease-in-out infinite" }
                  : undefined
              }
            />
            <Box
              position="absolute"
              left={`calc(${hs.box[0]}% - 14px)`}
              top={`calc(${hs.box[1]}% - 14px)`}
            >
              <WarningBadge />
            </Box>
          </Box>
        );
      })}

      <Text
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
        bottom="8px"
        px={3}
        py={1}
        bg="rgba(0,0,0,0.55)"
        color="#fff"
        borderRadius="8px"
        fontSize="sm"
      >
        보라색 박스 또는 ⚠️ 배지를 눌러 확대하세요. (Backspace로 돌아가기)
      </Text>

      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 6px rgba(126,68,168,0.20) }
          50% { box-shadow: 0 0 0 10px rgba(126,68,168,0.36) }
          100% { box-shadow: 0 0 0 6px rgba(126,68,168,0.20) }
        }
      `}</style>
    </Box>
  );

  const ZoomCard = () => (
    <Box
      position="relative"
      border={`3px solid ${S.border}`}
      borderRadius="16px"
      overflow="hidden"
      boxShadow={`0 16px 36px ${S.shadow}`}
    >
      <Image src={hotspot.zoomImg} alt="zoom" w="100%" draggable={false} />

      {/* 핀 + 라벨 */}
      {(hotspot.pins || []).map((pt, i) => {
        const a = hotspot.actions[i];
        const done = !!visited[`${viewType}-${a.key}`];
        const pinLeft = `calc(${pt[0]}% - 18px)`;
        const pinTop = `calc(${pt[1]}% - 18px)`;
        const labelSide = pt[0] > 50 ? "left" : "right";

        return (
          <Box key={a.key} position="absolute" left={pinLeft} top={pinTop}>
            <Circle
              size="36px"
              bg={done ? S.done : S.warn}
              color="white"
              border={`2px solid ${S.border}`}
              cursor="pointer"
              onClick={() => triggerActionLocal(i)}
              title={`${i + 1}. ${a.label}`}
            >
              !
            </Circle>

            <Box
              position="absolute"
              top="0"
              {...(labelSide === "right" ? { left: "42px" } : { right: "42px" })}
              bg="rgba(0,0,0,0.65)"
              color="#fff"
              border={`2px solid ${S.border}`}
              borderRadius="10px"
              px="10px"
              py="6px"
              whiteSpace="nowrap"
              pointerEvents="none"
              transform="translateY(-6px)"
            >
              ({i + 1}) {a.label}
            </Box>
          </Box>
        );
      })}

      {/* 프리뷰 카드 */}
      {shotImg && (
        <Box
          position="absolute"
          right="12px"
          bottom="12px"
          maxW={["70%", "50%", "420px"]}
          bg="#000"
          border={`2px solid ${S.border}`}
          borderRadius="12px"
          overflow="hidden"
          boxShadow={`0 10px 24px ${S.shadow}`}
          zIndex={5}
        >
          <HStack justify="space-between" align="center" px={3} py={2}>
            <Text fontSize="sm" color="#fff" noOfLines={1}>
              {activeIdx !== null ? hotspot.actions[activeIdx].label : "확대 보기"}
            </Text>
            <CloseButton size="sm" onClick={() => setShotImg(null)} color="#fff" />
          </HStack>
          <Image src={shotImg} alt="detail" maxH="280px" objectFit="cover" />
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* 상단 고정 배너 */}
      <Box
        position="fixed"
        top="16px"
        left="50%"
        transform="translateX(-50%)"
        bg="rgba(0,0,0,0.45)"
        border={`2px solid ${S.border}`}
        borderRadius="14px"
        px={5}
        py={2}
        zIndex={1200}
        boxShadow={`0 10px 24px ${S.shadow}`}
      >
        <Text fontWeight="bold" fontFamily="NeoDGM" color="white" >QUEST 2 · 집 확인하기</Text>
        <Text fontSize="sm" color="gray.400" textAlign="center">
          진행도: {doneCount} / {totalCount}
        </Text>
      </Box>

      {/* 중앙 2컬럼 레이아웃 */}
      <Flex
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
        bottom="4%"                     
        w={L.contentW}                  
        gap={`${L.gap}px`}              
        direction={["column", "row"]}
        align="stretch"
        justify="flex-start"
        zIndex={1000}
      >
        <Box flex="1" minW={0}>
          {phase === "overview" && <OverviewCard />}
          {phase === "zoom" && <ZoomCard />}

          <HStack mt={3} justify="space-between">
            {phase === "zoom" ? (
              <Button variant="outline" borderColor={S.border} onClick={() => setPhase("overview")}>
                ← 돌아가기(Backspace)
              </Button>
            ) : (
              <Box />
            )}
            {!allDone ? (
              <Text color="#bbb">모든 항목을 완료하세요.</Text>
            ) : (
              <Text color="#2f855a" fontWeight="semibold">
                완료! 다음 매물로 이동합니다…
              </Text>
            )}
          </HStack>
        </Box>

        {/* 오른쪽 통합 체크리스트 */}
        <SideChecklist />
      </Flex>
    </>
  );
}
