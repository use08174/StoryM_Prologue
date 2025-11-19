// src/components/SettingsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  Box, Image, HStack, Text, IconButton, Tooltip, Switch, useToast
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { useBgm } from "../BgmProvider";

// 공통 리소스 경로
const PUB =
  (import.meta as any)?.env?.BASE_URL ??
  (process.env as any)?.PUBLIC_URL ??
  "";

const IMG = {
  CARD_BASE: `${PUB}assets/ui/card_bg.png`,
  ICON_MALE: `${PUB}assets/ui/icon_male.png`,
  ICON_FEMALE: `${PUB}assets/ui/icon_female.png`,
  CHAR_MALE: `${PUB}assets/sprites/main_boy_profile.png`,
  CHAR_FEMALE: `${PUB}assets/sprites/main_girl_profile.png`,
};

// 카드 기준 해상도
const BASE_W = 4138;
const BASE_H = 1926;

// 배치 좌표(Setting.tsx와 동일 계열)
const PX = {
  avatar:     { x: 260,  y: 520,  w: 600,  h: 600 },
  name:       { x: 1110, y: 360,  w: 1150, h: 200 },
  officialId: { x: 1110, y: 580,  w: 1150, h: 750 },
  region:     { x: 1110, y: 820,  w: 1150, h: 1350 },
  job:        { x: 2550, y: 820,  w: 1220, h: 300 },
  gender:     { x: 2550, y: 360,  w: 900,  h: 300 },
  bgm:        { x: 2550, y: 540,  w: 700,  h: 1950 },
};
const pct = (v: number, base: number) => `${(v / base) * 100}%`;
const CONTENT_OFFSET_Y = 80;

type Props = { isOpen: boolean; onClose: () => void };

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const { muted, setMuted, play } = useBgm();

  // 뷰 모드 표시용 로컬 상태(로컬스토리지에서 읽음)
  const [officialId, setOfficialId] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [job, setJob] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");

  // 카드 비율(원본 비율로 컨테이너 aspect 유지)
  const [ratio, setRatio] = useState(BASE_W / BASE_H);

  useEffect(() => {
    const img = new window.Image();
    img.src = IMG.CARD_BASE;
    img.onload = () => setRatio(img.naturalWidth / img.naturalHeight);
  }, []);

  useEffect(() => {
    // 열릴 때마다 최신 값 반영
    if (!isOpen) return;
    setOfficialId(localStorage.getItem("officialId") || "");
    setName(localStorage.getItem("playerName") || "");
    setRegion(localStorage.getItem("playerRegion") || "");
    setJob(localStorage.getItem("playerJob") || "");
    setGender(
      (localStorage.getItem("playerGender") as "male" | "female") || "male"
    );
  }, [isOpen]);

  const charSrc = useMemo(
    () => (gender === "male" ? IMG.CHAR_MALE : IMG.CHAR_FEMALE),
    [gender]
  );

  const Overlay = useMemo(
    () =>
      function Overlay({
        x, y, w, h, children,
      }: { x: number; y: number; w: number; h: number; children: React.ReactNode }) {
        return (
          <Box
            position="absolute"
            left={pct(x, BASE_W)}
            top={pct(y + CONTENT_OFFSET_Y, BASE_H)}
            width={pct(w, BASE_W)}
            height={pct(h, BASE_H)}
            display="flex"
            alignItems="center"
          >
            {children}
          </Box>
        );
      },
    []
  );

  const toggleBgm = async () => {
    if (muted) { try { await play(); } catch {} }
    setMuted(!muted);
  };

  const copyId = async () => {
    if (!officialId) return;
    try {
      await navigator.clipboard.writeText(officialId);
      toast({ title: "Official ID가 복사되었습니다.", status: "success", duration: 1200 });
    } catch {
      toast({ title: "복사 실패", status: "error", duration: 1200 });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="4xl">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalHeader color="white" fontFamily="NeoDGM">환경설정</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          {/* 카드 컨테이너 */}
          <Box
            position="relative"
            width="100%"
            maxW="900px"
            aspectRatio={ratio}
            borderRadius="24px"
            overflow="hidden"
            mx="auto"
            boxShadow="0 18px 40px rgba(0,0,0,0.55)"
          >
            {/* 카드 베이스 */}
            <Image
              src={IMG.CARD_BASE}
              alt="ID Card Base"
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="contain"
              draggable={false}
              style={{ imageRendering: "pixelated" }}
            />

            {/* 아바타 */}
            <Overlay {...PX.avatar}>
              <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
                <Image
                  key={gender}
                  src={charSrc}
                  alt="캐릭터"
                  w="100%"
                  h="100%"
                  objectFit="contain"
                  draggable={false}
                  style={{ imageRendering: "pixelated" }}
                />
              </Box>
            </Overlay>

            {/* 이름(뷰) */}
            <Overlay {...PX.name}>
              <Box w="100%">
                <Text color="white" fontFamily="NeoDGM"fontSize={{ base: "20px", md: "22px" }} mb={2}>이름:</Text>
                <Box px={4} py={3} border="2px solid rgba(132,98,160,0.6)" bg="rgba(50,40,56,0.6)" color="white" borderRadius="8px" fontSize="16px">
                  {name || "—"}
                </Box>
              </Box>
            </Overlay>

            {/* Official ID(뷰) */}
            <Overlay {...PX.officialId}>
              <Box w="100%">
                <Text color="white" fontFamily="NeoDGM"fontSize={{ base: "20px", md: "22px" }} mb={2}>Official ID:</Text>
                <HStack px={4} py={3} border="2px solid rgba(132,98,160,0.6)" bg="rgba(50,40,56,0.6)" color="white" borderRadius="8px" fontSize="16px" justify="space-between">
                  <Text noOfLines={1} pr={2}>{officialId || "—"}</Text>
                  
                   
                </HStack>
              </Box>
            </Overlay>

            {/* 성별(아이콘 + 텍스트) */}
            <Overlay {...PX.gender}>
              <HStack spacing={4} height="100%">
                <Text color="white" fontFamily="NeoDGM"fontSize={{ base: "20px", md: "22px" }} mr={3}>성별:</Text>
                <Image src={gender === "male" ? IMG.ICON_MALE : IMG.ICON_FEMALE} alt="" w="22px" h="22px" />
                <Text color="white">{gender === "male" ? "남성" : "여성"}</Text>
              </HStack>
            </Overlay>

            {/* BGM 토글 */}
            <Overlay {...PX.bgm}>
              <HStack w="100%" justify="space-between">
                <Text color="white" fontFamily="NeoDGM"fontSize={{ base: "20px", md: "22px" }}>배경음악(BGM)</Text>
                <Switch isChecked={!muted} onChange={toggleBgm} colorScheme="purple" />
              </HStack>
            </Overlay>

            {/* 거주지역/직업(뷰) */}
            <Overlay {...PX.region}>
              <Box w="100%">
                <Text color="white" fontFamily="NeoDGM"fontSize={{ base: "20px", md: "22px" }} mb={2}>거주지역:</Text>
                <Box px={4} py={3} border="2px solid rgba(132,98,160,0.6)" bg="rgba(50,40,56,0.6)" color="white" borderRadius="8px" fontSize="16px">
                  {region || "—"}
                </Box>
              </Box>
            </Overlay>

            <Overlay {...PX.job}>
              <Box w="100%">
                <Text color="white"fontFamily="NeoDGM" fontSize={{ base: "20px", md: "22px" }} mb={2}>직업:</Text>
                <Box px={4} py={3} border="2px solid rgba(132,98,160,0.6)" bg="rgba(50,40,56,0.6)" color="white" borderRadius="8px" fontSize="16px">
                  {job || "—"}
                </Box>
              </Box>
            </Overlay>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal;
