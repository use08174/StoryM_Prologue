import { Box, Button, HStack, IconButton, Image, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBgm } from "../BgmProvider"; // ⬅️ 추가

const ICONS = {
  title: "/assets/icons/prologue_title.png",
  setting: "/assets/icons/setting.png",
  play: "/assets/icons/play.png",
  credit: "/assets/icons/credit.png",
};

// 인라인 사운드 아이콘
const SoundIcon = ({ muted = false, size = 24 }: { muted?: boolean; size?: number }) => (
  <Box as="svg" width={size} height={size} viewBox="0 0 30 30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.95}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" fill="white" stroke="white" />
    {!muted ? (<><path d="M15 9a3 3 0 010 6" /><path d="M17.5 7a6 6 0 010 10" /></>) : (<><line x1="15.5" y1="8.5" x2="20.5" y2="13.5" /><line x1="20.5" y1="8.5" x2="15.5" y2="13.5" /></>)}
  </Box>
);

export const Landing = () => {
  const navigate = useNavigate();
  const { muted, setMuted, play } = useBgm(); // ⬅️ Provider 상태 사용

  const ensurePlay = async () => {
    await play().catch(() => {});
  };

  return (
    <Box
      as="main"
      height="100vh"
      width="100vw"
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgImage="url('/assets/sprites/prologue_main.png')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      _before={{ content: '""', position: "absolute", inset: 0, bgGradient: "linear(to-b, rgba(40,20,80,0.25), rgba(20,10,40,0.35))" }}
    >
      {/* 우상단 사운드 토글 — Provider 상태로 제어 */}
      <IconButton
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={() => setMuted(!muted)}
        position="absolute"
        top={{ base: 3, md: 5 }}
        right={{ base: 3, md: 5 }}
        variant="unstyled"
        minW="auto"
        _focus={{ boxShadow: "none" }}
        _hover={{ filter: "brightness(1.15)" }}
      >
        <SoundIcon muted={muted} size={20} />
      </IconButton>

      {/* 중앙 컨텐츠(기존 레이아웃 그대로) */}
      <VStack
        spacing={{ base: 4, md: 6 }}
        zIndex={1}
        maxW="min(900px, 88vw)"
        transform={{ base: "translateY(-5vh)", md: "translateY(-5vh)" }}
      >
        <Image
          src={ICONS.title}
          alt="프롤로그"
          maxW={{ base: "56vw", sm: "48vw", md: "400px", lg: "280px" }}
          maxH={{ base: "80px", md: "110px" }}
          draggable={false}
          loading="eager"
          userSelect="none"
        />

        <HStack spacing={{ base: 5, md: 10 }} mt={{ base: 100, md: 100, lg: 130 }}>
          <Button variant="unstyled" onClick={() => { ensurePlay(); navigate("/setting"); }}>
            <Image src={ICONS.setting} alt="SETTING" maxH={{ base: "16px", sm: "20px", md: "22px" }} draggable={false} />
          </Button>
          <Button variant="unstyled" onClick={() => { ensurePlay(); navigate("/auth"); }}>
            <Image src={ICONS.play} alt="PLAY" maxH={{ base: "40px", sm: "44px", md: "48px" }} draggable={false} />
          </Button>
          <Button variant="unstyled" onClick={() => { ensurePlay(); navigate("/credit"); }}>
            <Image src={ICONS.credit} alt="CREDIT" maxH={{ base: "17px", sm: "21px", md: "23px" }} draggable={false} />
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Landing;