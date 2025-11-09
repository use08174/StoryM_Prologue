// src/components/common/StageScene.tsx
import { ReactNode, useEffect } from "react";
import { Box } from "@chakra-ui/react";

type Props = {
  bg: string;                // 전체 배경 이미지
  children: ReactNode;       // 가운데 컨텐츠
  width?: string | number;   // 중앙 컨테이너 폭 (기본 980px)
  dim?: number;              // 어둡게(0~1) 기본 0.25
  zIndex?: number;           // 기본 1000
  onEsc?: () => void;        // Esc 닫기 (선택)
};

export default function StageScene({
  bg,
  children,
  width = 980,
  dim = 0.25,
  zIndex = 1000,
  onEsc,
}: Props) {
  useEffect(() => {
    if (!onEsc) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onEsc(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onEsc]);

  return (
    <Box position="fixed" inset={0} zIndex={zIndex}>
      {/* 배경 */}
      <Box
        position="absolute"
        inset={0}
        bgImage={`url('${bg}')`}
        bgSize="cover"
        bgPos="center"
      />
      {/* 딤/스캔라인(옵션) */}
      <Box position="absolute" inset={0} bg={`rgba(0,0,0,${dim})`} />
      {/* 중앙 컨테이너 */}
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        w={["92%", width]}
      >
        {children}
      </Box>
    </Box>
  );
}
