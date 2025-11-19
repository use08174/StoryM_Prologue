// src/components/Quest1Rulebook.tsx
import {
  Badge,
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
  Tag,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { PIXEL_PALETTE as C } from "../pixelpalette";
import { SimpleGrid } from "@chakra-ui/react";

type Quest1RulebookProps = {
  stabilityMin: number;
  healthMin: number;
  autoOpen?: boolean; // 🔥 추가
};

type SlideDef = {
  key: string;
  title: string;
  subtitle?: string;
  imageSrc?: string;
  videoSrc?: string;
  content: React.ReactNode;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fontWeight="bold" fontSize="sm" color={C.ink} mb={1}>
      {children}
    </Text>
  );
}

// 위쪽 import에 SimpleGrid 추가도 같이 해줄 거라면:
// import { ..., SimpleGrid } from "@chakra-ui/react";

function ItemChip({
  icon,
  label,
  note,
}: {
  icon: string;
  label: string;
  note: string;
}) {
  return (
    <VStack
      spacing={1}
      align="center"
      bg={`${C.tileMid}E6`}
      borderRadius="md"
      border={`2px solid ${C.border}`}
      px={3}
      py={2}
      w="100%"           // ✅ 부모 그리드 칸을 가득 채우기
      h="100%"           // ✅ 같은 행/열에서 높이도 맞추기
      minH="88px"        // (필요하면 조절) 최소 높이
    >
      <Text fontSize="lg">{icon}</Text>
      <Text fontSize="sm" fontWeight="bold" color={C.ink}>
        {label}
      </Text>
      <Text fontSize="xs" color={C.border} textAlign="center" lineHeight="1.3">
        {note}
      </Text>
    </VStack>
  );
}


function TutorialMedia({
  imageSrc,
  videoSrc,
  alt,
}: {
  imageSrc?: string;
  videoSrc?: string;
  alt?: string;
}) {
  if (videoSrc) {
    return (
      <Box
        as="video"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        borderRadius="md"
        border={`2px solid ${C.border}`}
        w="100%"
        maxH="190px"
        objectFit="cover"
        mb={3}
      />
    );
  }
  if (imageSrc) {
    return (
      <Box
        as="img"
        src={imageSrc}
        alt={alt}
        borderRadius="md"
        border={`2px solid ${C.border}`}
        w="100%"
        maxH="190px"
        objectFit="cover"
        mb={3}
      />
    );
  }
  return null;
}

function GaugeCard({
  label,
  imageSrc,
  highlight,
}: {
  label: string;
  imageSrc: string;
  highlight: string;
}) {
  return (
    <VStack
      spacing={2}
      align="stretch"
      bg={`${C.tileMid}E6`}
      borderRadius="md"
      border={`2px solid ${C.border}`}
      px={3}
      py={2}
      h="100%"
    >
      <Box
        as="img"
        src={imageSrc}
        alt={label}
        borderRadius="sm"
        border={`1px solid ${C.border}`}
        w="100%"
        maxH="56px"
        objectFit="cover"
      />
      <Text fontSize="sm" fontWeight="bold" color={C.ink}>
        {label}
      </Text>
      <Text fontSize="xs" color={C.border}>
        {highlight}
      </Text>
    </VStack>
  );
}

function ImpactCell({
  title,
  happy,
  health,
  stability,
  note,
}: {
  title: string;
  happy: "▲" | "▼" | "–";
  health: "▲" | "▼" | "–";
  stability: "▲" | "▼" | "–";
  note?: string;
}) {
  return (
    <VStack
      spacing={1}
      align="stretch"
      bg={`${C.tileMid}E6`}
      borderRadius="md"
      border={`2px solid ${C.border}`}
      px={3}
      py={2}
      w="100%"
      h="100%"
    >
      <Text fontSize="sm" fontWeight="bold" color={C.ink}>
        {title}
      </Text>
      <HStack spacing={1}>
        <Tag size="xs" borderRadius="full" bg={C.tileLight}>
          <Text fontSize="xs">행복 {happy}</Text>
        </Tag>
        <Tag size="xs" borderRadius="full" bg={C.tileLight}>
          <Text fontSize="xs">건강 {health}</Text>
        </Tag>
        <Tag size="xs" borderRadius="full" bg={C.tileLight}>
          <Text fontSize="xs">안정성 {stability}</Text>
        </Tag>
      </HStack>
      {note && (
        <Text fontSize="xs" color={C.border}>
          {note}
        </Text>
      )}
    </VStack>
  );
}


export default function Quest1Rulebook({
  stabilityMin,
  healthMin,
  autoOpen = false, // 🔥 추가
}: Quest1RulebookProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [page, setPage] = useState(0);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);   // 🔥 추가
  // 🔥 autoOpen === true가 되면, 한 번만 자동으로 모달 열기
  useEffect(() => {
    if (autoOpen && !hasAutoOpened) {
      setPage(0);          // 첫 페이지부터
      onOpen();
      setHasAutoOpened(true);
    }
  }, [autoOpen, hasAutoOpened, onOpen]);


  // ✅ 진짜 필수 규칙만 남긴 버전
    // ✅ 진짜 필수 규칙 + 영향도 요약
  const SLIDES: SlideDef[] = [
  {
    key: "controls",
    title: "어떻게 움직이나요?",
    subtitle: "마우스를 움직여 예산 바구니를 움직여보세요.",
    videoSrc: "/assets/quest1_icons/tutorial/q1_control.mp4",
    content: (
      <VStack align="stretch" spacing={2}>
        <SectionLabel>조작</SectionLabel>
        <HStack spacing={3} justify="space-between">
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm" color={C.ink}>
              ← → : 카트 이동
            </Text>
            <Text fontSize="sm" color={C.ink}>
              Space : 시작 / 일시정지
            </Text>
            <Text fontSize="sm" color={C.ink}>
              종료 버튼 : 지금 상태로 평가
            </Text>
          </VStack>
        </HStack>
        <Box mt={1}>
          <SectionLabel>목표</SectionLabel>
          <Text fontSize="sm" color={C.border}>
            나의 월급(1,800,000원) 안에서 필수 3가지(주거, 식비, 통신)를 채우고,
            행복·건강·안정성 지표를 기준 이상으로 맞추기.
          </Text>
        </Box>
      </VStack>
    ),
  },
  {
    key: "required",
    title: "필수 3가지부터!",
    subtitle: "이 셋을 채우지 못하면 무조건 실패",
    content: (
      <VStack align="stretch" spacing={2}>
        <SectionLabel>필수 항목</SectionLabel>
        <HStack spacing={2} justify="space-between">
          <ItemChip icon="🏠" label="주거" note="집 / 관리비" />
          <ItemChip icon="🥦" label="식비" note="밥 / 간식" />
          <ItemChip icon="📶" label="통신" note="폰 / 인터넷" />
        </HStack>
        <Text fontSize="sm" color={C.border} mt={2}>
          세 항목을{" "}
          <Text as="span" fontWeight="bold" color={C.ink}>
            각각 1번 이상
          </Text>
          은 꼭 담아야 해요.
        </Text>
      </VStack>
    ),
  },
  {
  key: "items-kpi",
  title: "지수 채우기 한눈에 보기",
  subtitle: "",
  content: (
    <VStack align="stretch" spacing={3}>

      {/* 항목별 3×2 표 */}
      <SectionLabel >항목별 영향 요약</SectionLabel>
      <SimpleGrid
        columns={[2, 3]}
        spacing={2}
        templateRows="repeat(2, minmax(0, 1fr))"
      >
        <ImpactCell
          title="주거비"
          happy="–"
          health="–"
          stability="▲"
          note="너무 비싸면 안정성 약간 ▼"
        />
        <ImpactCell
          title="식비"
          happy="▲"
          health="▲"
          stability="–"
          note="너무 적으면 건강 ▼"
        />
        <ImpactCell
          title="통신비"
          happy="–"
          health="–"
          stability="–"
          note="필수 항목 (없으면 실패)"
        />
        <ImpactCell
          title="여가비"
          happy="▲"
          health="–"
          stability="–"
          note="0원이면 행복 ▼"
        />
        <ImpactCell
          title="저축"
          happy="–"
          health="–"
          stability="▲"
          note="없으면 안정성 ▼"
        />
        <ImpactCell
          title="교통비"
          happy="–"
          health="–"
          stability="–"
          note="점수엔 영향 없음"
        />
      </SimpleGrid>

      {/* 성공 기준은 한 줄로만 */}
      <Box
        mt={2}
        bg={`${C.tileMid}E0`}
        borderRadius="md"
        border={`2px dashed ${C.border}`}
        px={3}
        py={2}
      >
        <Text fontSize="xs" color={C.border}>
          필수 3가지(주거비·식비·통신비)를 담고{" "}
          건강 {healthMin} 이상, 안정성 {stabilityMin} 이상이면 성공입니다.
        </Text>
      </Box>
    </VStack>
  ),
}


];



  const totalPages = SLIDES.length;

  const goPrev = () =>
    setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  // 화살표 키로 넘기기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      {/* 트리거 버튼 */}
      <Button
        variant="outline"
        borderColor={C.border}
        color={C.border}
        _hover={{ bg: C.ribbon }}
        onClick={() => {
          setPage(0);
          onOpen();
        }}
        fontFamily="'NeoDGM', system-ui, sans-serif"
      >
        튜토리얼 보기
      </Button>

      {/* 튜토리얼 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay bg="rgba(0,0,0,0.7)" />
        <ModalContent
          bg={C.tileLight}
          border={`3px solid ${C.border}`}
          borderRadius="18px"
          boxShadow={`0 12px 30px ${C.shadow}`}
          position="relative"
          overflow="hidden"
          maxW="620px"
          fontFamily="'NeoDGM', system-ui, sans-serif"
        >
          {/* 배경 장식 */}
          <Box
            position="absolute"
            inset={0}
            pointerEvents="none"
            backgroundImage="
              linear-gradient(135deg, rgba(255,255,255,0.10) 0, transparent 40%),
              linear-gradient(315deg, rgba(15,23,42,0.25) 0, transparent 55%)
            "
            opacity={0.85}
          />

          <ModalHeader position="relative" zIndex={1} pb={2}>
            <HStack justify="space-between" align="flex-start">
              <VStack align="flex-start" spacing={1}>
                <Badge
                  bg={C.ribbon}
                  color={C.ink}
                  border={`2px solid ${C.border}`}
                  borderRadius="full"
                  px={3}
                  py={0.5}
                  fontSize="xs"
                  boxShadow={`0 2px 0 ${C.border}`}
                >
                  QUEST 1 TUTORIAL
                </Badge>
                <Text fontWeight="bold" fontSize="lg" color={C.ink}>
                  월별 예산 정하기, 이렇게 플레이해요
                </Text>
                <Text fontSize="xs" color={C.border} opacity={0.9}>
                  ← → 키 버튼으로 페이지 넘기기
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>

          <ModalCloseButton zIndex={2} color={C.ink} />

          <ModalBody position="relative" zIndex={1} pb={4} pt={1}>
            {/* 슬라이드 컨테이너 */}
            <Box overflow="hidden" mt={1}>
              <Box
                display="flex"
                width={`${totalPages * 100}%`}
                transform={`translateX(-${page * (100 / totalPages)}%)`}
                transition="transform 0.28s ease-out"
              >
                {SLIDES.map((slide) => (
                  <Box
                    key={slide.key}
                    w={`${100 / totalPages}%`}
                    flexShrink={0}
                    px={1}
                  >
                    <VStack align="stretch" spacing={2}>
                      <TutorialMedia
                        imageSrc={slide.imageSrc}
                        videoSrc={slide.videoSrc}
                        alt={slide.title}
                      />
                      <VStack align="stretch" spacing={1}>
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          color={C.ink}
                        >
                          {slide.title}
                        </Text>
                        {slide.subtitle && (
                          <Text
                            fontSize="xs"
                            color={C.border}
                            mb={1}
                          >
                            {slide.subtitle}
                          </Text>
                        )}
                      </VStack>
                      {slide.content}
                    </VStack>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* 페이지 인디케이터 */}
            <HStack justify="center" mt={3} spacing={2}>
              {SLIDES.map((s, i) => (
                <Box
                  key={s.key}
                  w={page === i ? "22px" : "12px"}
                  h="8px"
                  borderRadius="999px"
                  bg={page === i ? C.ink : C.border}
                  opacity={page === i ? 1 : 0.5}
                  boxShadow={
                    page === i ? `0 0 0 2px ${C.ribbon}` : "none"
                  }
                  cursor="pointer"
                  onClick={() => setPage(i)}
                />
              ))}
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
