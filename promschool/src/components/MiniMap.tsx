// MiniMap.tsx
import { Box, Image, Modal, ModalOverlay, ModalContent, ModalCloseButton } from "@chakra-ui/react";
import { useState } from "react";

interface MiniMapProps {
  mapSrc: string;          // 맵 이미지 경로
  miniSize?: string;       // 작은 미니맵 사이즈 (정사각형)
  position?: {
    bottom?: string;
    right?: string;
    left?: string;
  };
}

const MiniMap = ({
  mapSrc,
  miniSize = "160px",
  position = { bottom: "20px", right: "20px" }, // 기본: 오른쪽 아래
}: MiniMapProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 화면 한 켠에 떠 있는 작은 미니맵 */}
      <Box
        position="absolute"
        zIndex={9}
        {...position}
        cursor="pointer"
        onClick={() => setIsOpen(true)}
      >
        <Box
          width={miniSize}
          height={miniSize}
          borderRadius="md"
          overflow="hidden"
          border="2px solid rgba(255,255,255,0.9)"
          boxShadow="0 0 10px rgba(0,0,0,0.6)"
          bg="black"
        >
          <Image
            src={mapSrc}
            alt="minimap"
            width="100%"
            height="100%"
            objectFit="cover"
          />
        </Box>
      </Box>

      {/* 클릭하면 뜨는 전체 지도 모달 */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="5xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.8)" />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          maxW="80vw"
          maxH="80vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ModalCloseButton color="white" />
          <Image
            src={mapSrc}
            alt="full-map"
            maxW="100%"
            maxH="100%"
            borderRadius="lg"
            boxShadow="0 0 20px rgba(0,0,0,0.8)"
          />
        </ModalContent>
      </Modal>
    </>
  );
};

export default MiniMap;
