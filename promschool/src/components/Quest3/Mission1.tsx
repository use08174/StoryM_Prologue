import { useState, useMemo } from "react";
import {
  Box, Button, Text, VStack, Image, HStack, Tag, useToast,
  Center,
} from "@chakra-ui/react";

type Props = { onResult: (success: boolean) => void };

const C = {
  primary: "#7E44A8", // 메인 보라
  accent:  "#FCCFDB", // 포인트 핑크
  mid:     "#A372C2", // 보조 보라
  dark:    "#121318", // 내부 패널
  panel:   "#1A1B22",
  border:  "#8B6AAE",
  ink:     "#0f172a",
  tileLight: "#2a2230",
  tileMid:   "#1f1824",
  shadow:    "rgba(12, 8, 15, 0.65)",
};

const pixelBorder = (outer = C.primary, inner = C.mid) => ({
  border: "0",
  boxShadow: `
    0 0 0 2px ${outer},
    0 0 0 4px ${inner},
    inset 0 0 0 2px ${inner}
  `,
  borderRadius: "0",
});

export default function Mission1({ onResult }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const correct = useMemo(() => ["id_card", "stamp", "phone"], []);

  const toggleSelect = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleConfirm = () => {
    const success =
      correct.every((k) => selected.includes(k)) && selected.length === correct.length;

    toast({
      duration: 900,
      isClosable: false,
      render: () => (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={2100}
          bg={
            success
              ? "linear-gradient(135deg, rgba(34,197,94,0.98), rgba(22,163,74,0.95))"
              : "linear-gradient(135deg, rgba(248,113,113,0.98), rgba(220,38,38,0.95))"
          }
          border={`3px solid ${success ? "#4ade80" : "#fb7185"}`}
          boxShadow={`0 16px 40px rgba(15,23,42,0.55)`}
          color="white"
          fontFamily="'NeoDGM', system-ui, sans-serif"
          px={5}
          py={4}
          borderRadius="20px"
        >
          <Text fontWeight="bold" fontSize="lg">
            {success ? "MISSION 3 COMPLETE!" : "MISSION FAILED"}
          </Text>
          {!success && (
            <Text fontSize="sm" opacity={0.9}>
              필수 3개(주민등록증·도장·전화기)만 정확히 담아야 해.
            </Text>
          )}
        </Box>
      ),
    });

    onResult(success);
  };

  const items = [
    {
      key: "id_card",
      name: "주민등록증",
      desc: "나의 신분을 증명할 수 있는 주민등록증.",
      img: "/assets/quest3_scenes/idcard.png",
      top: "5%",
      left: "10%",
      rotate: "-7deg",
      size: "350px",
    },
    {
      key: "student_card",
      name: "학생증",
      desc: "대학교 학번과 전공이 적힌 학생증.",
      img: "/assets/quest3_scenes/studentcard.png",
      top: "40%",
      left: "34%",
      rotate: "9deg",
      size: "300px",
    },
    {
      key: "stamp",
      name: "도장",
      desc: "계약서 날인 시 사용되는 도장.",
      img: "/assets/quest3_scenes/stamp.png",
      top: "60%",
      left: "5%",
      rotate: "12deg",
      size: "300px",
    },
    {
      key: "library_card",
      name: "도서관 카드",
      desc: "도서관에서 책을 대출할 때 필요한 카드.",
      img: "/assets/quest3_scenes/librarycard.png",
      top: "8%",
      left: "60%",
      rotate: "6deg",
      size: "300px",
    },
    {
      key: "phone",
      name: "전화기",
      desc: "계약서 확인을 위한 전화기.",
      img: "/assets/quest3_scenes/phone.png",
      top: "50%",
      left: "70%",
      rotate: "-12deg",
      size: "180px",
    },
  ];

  const doneCount = selected.filter((k) => correct.includes(k)).length;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      role="dialog"
      aria-modal="true"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/assets/background/quest_back.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        boxShadow: `inset 0 0 200px ${C.shadow}`,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 4px)",
        mixBlendMode: "overlay",
        opacity: 0.34,
      }}
    >
      {/* 좌상단 라벨(퀘스트1 스타일) */}
      <Box
        position="absolute"
        top={`max(10px, env(safe-area-inset-top))`}
        left="38px"
        bg={C.accent}
        border={`3px solid ${C.border}`}
        borderRadius="10px"
        px={10}
        py={0.5}
        zIndex={3}
        fontFamily="NeoDGM"
        color={C.primary}
      >
        <Text fontSize="20px" fontWeight="bold">QUEST 3</Text>
      </Box>

      {/* 중앙 프레임만 보여주는 레이아웃 */}
      <Box
        position="absolute"
        inset={0}
        pt={`max(64px, calc(env(safe-area-inset-top) + 32px))`}
        pb={`max(16px, env(safe-area-inset-bottom))`}
        px={[4, 8, 10]}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {/* 아우터 픽셀 프레임 (기존 Mission1의 메인 패널) */}
        <Box
          w="min(1300px, 95vw)"
          h="770px"
          bg={C.panel}
          color={C.accent}
          position="relative"
          overflow="hidden"
          {...pixelBorder(C.primary, C.mid)}
        >
          {/* 상단 타이틀 바 */}
          <Box
            h="36px"
            bg={C.primary}
            px={4}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontFamily="NeoDGM" fontSize="20px">
              [MISSION 1] 계약에 필요한 준비 완료하기
            </Text>
            <Tag bg={C.accent} color={C.primary}  {...pixelBorder(C.primary, C.primary)}>
              필수 {doneCount}/{correct.length}
            </Tag>
          </Box>

          {/* 안내 바 (퀘스트1 룩으로 위쪽 고정) */}
          <Box
            bg={C.dark}
            px={4}
            py={2}
            position="absolute"
            left="12px"
            right="12px"
            top="52px"
          >
            <Text fontSize="15px" fontFamily="NeoDGM">
              책상 위를 확인하고, 필요한 물건을 가방에 챙겨 갑시다.
              (필수: 주민등록증·도장·전화기)
            </Text>
          </Box>

          {/* 배경 캔버스 */}
          <Box
            position="absolute"
            top="100px"
            bottom="70px"
            left="12px"
            right="12px"
            bgImage="/assets/quest3_scenes/background.png"
            bgSize="cover"
            bgPos="center"
            {...pixelBorder(C.mid, C.primary)}
          >
            {/* 아이템들 */}
            {items.map((item) => {
              const isSel = selected.includes(item.key);
              return (
                <Box
                  key={item.key}
                  position="absolute"
                  top={item.top}
                  left={item.left}
                  transform={`rotate(${item.rotate}) scale(${isSel ? 1.05 : 1})`}
                  transition="transform 120ms"
                  cursor="pointer"
                  onClick={() => toggleSelect(item.key)}
                  {...(isSel
                    ? pixelBorder(C.accent, C.primary)
                    : { boxShadow: "lg", borderRadius: "md" })}
                >
                  <Image
                    src={item.img}
                    alt={item.name}
                    w={item.size || "160px"}
                    h="auto"
                    draggable={false}
                  />
                </Box>
              );
            })}
          </Box>

          {/* 하단 액션 바 */}
          <HStack
            position="absolute"
            bottom="12px"
            left="12px"
            right="12px"
            justify="center"
            bg={C.dark}
            px={3}
            py={2}
            {...pixelBorder(C.mid, C.primary)}
          >
            <Button
              onClick={handleConfirm}
              bg={C.accent}
              color={C.primary}
              px={5}
              height="36px"
              _hover={{ bg: C.accent }}
              fontFamily="NeoDGM"
            >
              가방에 챙기기 완료
            </Button>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
}
