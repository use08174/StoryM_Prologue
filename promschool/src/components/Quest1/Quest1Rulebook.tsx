// src/components/Quest1Rulebook.tsx
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { PIXEL_PALETTE as C } from "../pixelpalette";

type Quest1RulebookProps = {
  stabilityMin: number;
  healthMin: number;
};

export default function Quest1Rulebook({
  stabilityMin,
  healthMin,
}: Quest1RulebookProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [page, setPage] = useState(0);
  const totalPages = 3;

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
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
  }, [isOpen]);

  // 페이지들 정의
  const pages = [
    <Page1 key="page1" stabilityMin={stabilityMin} healthMin={healthMin} />,
    <Page2 key="page2" />,
    <Page3 key="page3" />,
  ];

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
        규칙 보기
      </Button>

      {/* 룰북 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay bg="rgba(0,0,0,0.7)" />
        <ModalContent
          bg={C.tileLight}
          border={`3px solid ${C.border}`}
          borderRadius="18px"
          boxShadow={`0 12px 30px ${C.shadow}`}
          position="relative"
          overflow="hidden"
          maxW="520px"
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
          {/* 접힌 모서리 느낌 */}
          <Box
            position="absolute"
            top={0}
            right={0}
            borderLeft="16px solid transparent"
            borderBottom={`16px solid ${C.border}`}
            opacity={0.45}
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
                  QUEST 1 RULE BOOK
                </Badge>
                <Text fontWeight="bold" fontSize="lg" color={C.ink}>
                  첫 월 예산 생존 가이드
                </Text>
                <Text fontSize="xs" color={C.border} opacity={0.9}>
                  ← → 키 또는 버튼으로 페이지 넘기기
                </Text>
              </VStack>

              {/* 페이지 네비 */}
              <HStack spacing={1}>
                <IconButton
                  aria-label="prev"
                  icon={<ChevronLeftIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={goPrev}
                  _hover={{ bg: C.ribbon }}
                />
                <IconButton
                  aria-label="next"
                  icon={<ChevronRightIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={goNext}
                  _hover={{ bg: C.ribbon }}
                />
              </HStack>
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
                {pages.map((pComp, idx) => (
                  <Box
                    key={idx}
                    w={`${100 / totalPages}%`}
                    flexShrink={0}
                    px={1}
                  >
                    {pComp}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* 페이지 인디케이터 */}
            <HStack justify="center" mt={3} spacing={2}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Box
                  key={i}
                  w={page === i ? "22px" : "12px"}
                  h="8px"
                  borderRadius="999px"
                  bg={page === i ? C.ink : C.border}
                  opacity={page === i ? 1 : 0.5}
                  boxShadow={page === i ? `0 0 0 2px ${C.ribbon}` : "none"}
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

/* ================== 각 페이지 정의 ================== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text fontWeight="bold" fontSize="md" color={C.ink} mb={1}>
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <HStack align="flex-start" spacing={2}>
      <Box
        mt="7px"
        w="5px"
        h="5px"
        borderRadius="2px"
        bg={C.ink}
        flexShrink={0}
      />
      <Text fontSize="sm" color={C.border} lineHeight="1.4">
        {children}
      </Text>
    </HStack>
  );
}

// PAGE 1: 기본 룰 & 성공 조건
function Page1({
  stabilityMin,
  healthMin,
}: {
  stabilityMin: number;
  healthMin: number;
}) {
  return (
    <VStack align="stretch" spacing={3}>
      <Box
        bg={`${C.tileMid}DD`}
        borderRadius="md"
        border={`2px solid ${C.border}`}
        px={3}
        py={2}
      >
        <SectionTitle>🎯 미션 목표</SectionTitle>
        <Text fontSize="sm" color={C.border} lineHeight="1.4">
          한 달 급여 안에서{" "}
          <Text as="span" fontWeight="bold" color={C.ink}>
            필수 항목(주거·식비·통신)
          </Text>
          을 모두 채우고,
          {" "}
          <Text as="span" fontWeight="bold" color={C.ink}>
            행복 · 건강 · 안정성
          </Text>
          지표를 기준 이상으로 맞추면 클리어!
        </Text>
      </Box>

      <Box>
        <SectionTitle>✅ 필수 항목 (각 1개 이상)</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>🏠 주거비 : 월세/관리비 등 “지붕” 유지 비용</Bullet>
          <Bullet>🥦 식비 : 한 달 동안 먹고 사는 비용</Bullet>
          <Bullet>📶 통신 : 인터넷 + 휴대폰 요금</Bullet>
        </VStack>
      </Box>

      <Box>
        <SectionTitle>📊 성공 판정</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>필수 3종(🏠 🥦 📶)을 모두 1개 이상 담을 것</Bullet>
          <Bullet>
            안정성(Stability) 지수{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              {stabilityMin} 이상
            </Text>
          </Bullet>
          <Bullet>
            건강(Health) 지수{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              {healthMin} 이상
            </Text>
          </Bullet>
          <Bullet>
            위 조건을 만족하면{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              MISSION CLEAR!
            </Text>
          </Bullet>
        </VStack>
      </Box>

      <Box>
        <SectionTitle>💰 예산 규칙</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>월급(총 예산)을 초과하는 항목은 장바구니에 담기지 않아요.</Bullet>
          <Bullet>
            <Text as="span" fontWeight="bold" color={C.ink}>
              남은 예산이 0
            </Text>
            이 되는 순간, 즉시 평가가 시작됩니다.
          </Bullet>
          <Bullet>우측 하단 “종료” 버튼으로 지금 상태를 바로 평가 받을 수도 있어요.</Bullet>
        </VStack>
      </Box>
    </VStack>
  );
}

// PAGE 2: 지표 설명 + 어떤 선택이 뭘 바꾸는지
function Page2() {
  return (
    <VStack align="stretch" spacing={3}>
      <Box
        bg={`${C.ribbon}E0`}
        borderRadius="md"
        border={`2px solid ${C.border}`}
        px={3}
        py={2}
      >
        <SectionTitle>📈 세 가지 지표</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>
            <Text as="span" fontWeight="bold" color={C.ink}>
              행복 (Happiness)
            </Text>
            : 취미·여가·식비의 질과 직접 연결 →{" "}
            삶의 재미와 정서적 여유
          </Bullet>
          <Bullet>
            <Text as="span" fontWeight="bold" color={C.ink}>
              건강 (Health)
            </Text>
            : 식비·영양·생활 위생 유지 여부 →{" "}
            몸과 마음이 버틸 수 있는 힘
          </Bullet>
          <Bullet>
            <Text as="span" fontWeight="bold" color={C.ink}>
              안정성 (Stability)
            </Text>
            : 주거/저축/통신 →{" "}
            다음 달도 버틸 수 있는 기반
          </Bullet>
        </VStack>
      </Box>

      <Box>
        <SectionTitle>🎮 예산 선택 → 지표 변화</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>여가/취미(🎉)를 너무 안 쓰면 행복 지수가 낮게 유지돼요.</Bullet>
          <Bullet>식비(🥦)를 과하게 줄이면 건강 지수가 눈에 띄게 떨어집니다.</Bullet>
          <Bullet>저축(💰)과 주거(🏠)에 아무것도 안 쓰면 안정성이 크게 깎여요.</Bullet>
          <Bullet>
            게임에서 바로{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              “선택 → 지표 변화”
            </Text>
            를 확인하면서,
            {" "}
            <Text as="span" color={C.border}>
              “아, 이렇게 쓰면 다음 달이 위험하겠구나”
            </Text>
            를 몸으로 느껴볼 수 있어요.
          </Bullet>
        </VStack>
      </Box>

      <Box
        bg={`${C.tileMid}CC`}
        borderRadius="md"
        border={`2px dashed ${C.border}`}
        px={3}
        py={2}
      >
        <Text fontSize="xs" color={C.border} lineHeight="1.4">
          TIP. 필수(🏠🥦📶)를 먼저 채우고, 남는 예산을
          {" "}
          <Text as="span" fontWeight="bold" color={C.ink}>
            행복(🎉) · 안정성(💰) · 교통(🚌)
          </Text>
          사이에서 어떻게 나눌지 고민해 보세요.
        </Text>
      </Box>
    </VStack>
  );
}

// PAGE 3: 교육 포인트 (독립 과정 핵심 리스크 설명)
function Page3() {
  return (
    <VStack align="stretch" spacing={3}>
      <Box
        bg={`${C.tileMid}E6`}
        borderRadius="md"
        border={`2px solid ${C.border}`}
        px={3}
        py={2}
      >
        <SectionTitle>🎓 교육 포인트 1 · 실제 독립 리스크 반영</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>
            첫 독립에서 청년이 부딪히는 핵심 리스크는{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              ① 생활비 부족(생존) ② 식습관 악화(건강) ③ 여가·정서적 고립(행복)
            </Text>{" "}
            이 세 가지예요.
          </Bullet>
          <Bullet>
            그래서 이 게임에서{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              “예산”
            </Text>
            은 단순한 숫자 계산이 아니라,{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              삶의 질 · 생존력 · 안정성의 균형
            </Text>
            을 맞추는 문제로 설계되어 있습니다.
          </Bullet>
          <Bullet>
            그 균형을 가장 직관적으로 볼 수 있는 프레임이 바로{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              행복 / 건강 / 안정성 3지표
            </Text>
            랍니다.
          </Bullet>
        </VStack>
      </Box>

      <Box
        bg={`${C.ribbon}E0`}
        borderRadius="md"
        border={`2px solid ${C.border}`}
        px={3}
        py={2}
      >
        <SectionTitle>🎓 교육 포인트 2 · “바로 연결되는 결과”</SectionTitle>
        <VStack align="flex-start" spacing={1}>
          <Bullet>
            행복(Happiness): 취미·여가·식비의 질과 연결 →{" "}
            <Text as="span" color={C.ink} fontWeight="bold">
              당장의 삶의 질
            </Text>
          </Bullet>
          <Bullet>
            건강(Health): 식비·영양·생활위생 유지 여부 →{" "}
            <Text as="span" color={C.ink} fontWeight="bold">
              신체·정신적 회복력
            </Text>
          </Bullet>
          <Bullet>
            안정성(Stability): 주거/저축/통신 →{" "}
            <Text as="span" color={C.ink} fontWeight="bold">
              다음 달을 버틸 수 있는 기반
            </Text>
          </Bullet>
          <Bullet>
            게임 안에서는{" "}
            <Text as="span" fontWeight="bold" color={C.ink}>
              예산 선택 → 지표 변화 → 결과
            </Text>
            가 바로 연결되기 때문에,
            {" "}
            <Text as="span" color={C.border}>
              “식비 너무 줄이면 건강이 떨어진다”, “저축 없으면 다음 달 위험하다”
            </Text>
            를 단순 설명이 아니라 체험으로 배우게 됩니다.
          </Bullet>
        </VStack>
      </Box>

      <Text fontSize="xs" color={C.border} textAlign="center" mt={1}>
        이 룰북을 다 봤다면, 이제 직접 예산을 짜 보면서 나만의 생존 전략을 세워보자!
      </Text>
    </VStack>
  );
}
