// src/components/Mission1.tsx
import { useState, useMemo } from "react";
import {
  Box, Button, Text, VStack, Image, HStack, Tag, Checkbox, SimpleGrid,
} from "@chakra-ui/react";

type Props = { onResult: (success: boolean) => void };

const C = {
  primary: "#7E44A8", // 메인 보라
  accent:  "#FCCFDB", // 포인트 핑크
  mid:     "#A372C2", // 보조 보라
  dark:    "#121318", // 내부 패널
  panel:   "#1A1B22",
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
  const [selected, setSelected] = useState<string[]>([]);
  const correct = useMemo(() => ["id_card", "stamp", "phone"], []);

  const toggleSelect = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleConfirm = () => {
    const success = correct.every((k) => selected.includes(k)) && selected.length === correct.length;
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
      rotate: "6deg", // ← 'deg' 오타 수정
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
    <Box w="100%" display="flex" justifyContent="center">
      {/* 아우터 픽셀 프레임 */}
      <Box
        w="min(1100px, 95vw)"
        h="760px"
        bg={C.panel}
        color={C.accent}
        position="relative"
        overflow="hidden"
        {...pixelBorder(C.primary, C.mid)}
      >
        {/* 상단 타이틀 바 */}
        <Box h="36px" bg={C.primary} px={4} display="flex" alignItems="center" justifyContent="space-between">
          <Text fontFamily="NeoDGM" fontSize="14px">[MISSION 1] 계약에 필요한 준비 완료하기</Text>
          <Tag bg={C.accent} color={C.primary}  {...pixelBorder(C.primary, C.primary)}>
            필수 {doneCount}/{correct.length}
          </Tag>
        </Box>

        {/* 안내 바 */}
        <Box
          bg={C.dark}
          px={4}
          py={2}
          {...pixelBorder(C.mid, C.primary)}
          position="absolute"
          left="12px"
          right="12px"
          top="52px"
        >
          <Text fontSize="13px" fontFamily="NeoDGM">책상 위를 확인하고, 필요한 물건을 가방에 챙겨 갑시다.</Text>
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
            const isNeed = correct.includes(item.key);
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
                // 픽셀 하이라이트
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
                {/* 라벨 배지 */}
                <Box position="absolute" top="-18px" left="0">
                </Box>
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
          justify="space-between"
          bg={C.dark}
          px={3}
          py={2}
          {...pixelBorder(C.mid, C.primary)}
        >
          <Text fontSize="12px" color="#CFCFD6">선택: {selected.length}개</Text>
          <Button
            onClick={handleConfirm}
            bg={C.accent}
            color={C.primary}
            px={5}
            height="36px"
            _hover={{ bg: C.accent }}
            {...pixelBorder(C.primary, C.primary)}
          >
            가방에 챙기기 완료
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
