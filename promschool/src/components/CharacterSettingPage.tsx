// Setting.tsx
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Image,
  Input,
  Tooltip,
} from "@chakra-ui/react";
import { Input as ChakraInput } from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// 오늘 날짜를 "YYYY. MM. DD" 형식으로
const formatKDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}`;
};
const todayStr = formatKDate();

// ✅ public 경로에 있는 자산만 맞춰 주세요.
const PUB =
  (import.meta as any)?.env?.BASE_URL ??
  (process.env as any)?.PUBLIC_URL ??
  "";

const IMG = {
  PAGE_BG: `${PUB}assets/background/prologue_main.png`, // 페이지 전체 배경
  CARD_BASE: `${PUB}assets/ui/card_bg.png`,            // 상단바+카드 배경 한 장
  ICON_MALE: `${PUB}assets/ui/icon_male.png`,
  ICON_FEMALE: `${PUB}assets/ui/icon_female.png`,
  AVATAR_FRAME: `${PUB}assets/ui/icon_profile.png`,    // 프레임용 이미지를 쓰고 싶으면 교체
  CHAR_MALE: `${PUB}assets/ui/icon_profile.png`,
  CHAR_FEMALE: `${PUB}assets/sprites/main_girl_profile.png`,
  BTN_DEF: `${PUB}assets/ui/btn_default.png`,
  INP: `${PUB}assets/ui/input_bg.png`, // 인풋 스킨
};

type ImageInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  ariaLabel?: string;
  insetX?: number;   // 좌우 안쪽 여백(px)
  insetY?: number;   // 상하 안쪽 여백(px)
  fontSize?: string | number;
  color?: string;    // 글자 색
  placeholderColor?: string;
};

const ImageInput = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  insetX = 16,
  insetY = 10,
  fontSize = "18px",
  color = "#fff",
  placeholderColor = "rgba(255,255,255,0.6)",
}: ImageInputProps) => (
  <Box
    position="relative"
    w="100%"
    h="100%"
    bgImage={`url('${IMG.INP}')`}  // 인풋 배경 이미지
    bgRepeat="no-repeat"
    bgSize="100% 100%"
    bgPosition="center"
    userSelect="none"
  >
    <ChakraInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      position="absolute"
      top={`${insetY}px`}
      bottom={`${insetY}px`}
      left={`${insetX}px`}
      right={`${insetX}px`}
      height="auto"
      bg="transparent"
      border="0"
      borderRadius="0"
      fontFamily="var(--neo)"
      fontSize={fontSize}
      color={color}
      _focus={{ boxShadow: "none" }}
      _placeholder={{ color: placeholderColor }}
    />
  </Box>
);

// ─────────────────────────────────────────────────────────────
//  Figma 기준 px (카드 한 장 기준)
// ─────────────────────────────────────────────────────────────
const BASE_W = 4138;
const BASE_H = 1926;

// 오버레이 좌표(카드 "한 장" 기준 px)
const PX = {
  genderGroup: { x: 2550, y: 360, w: 420, h: 120 }, // 아이콘 두 개 들어갈 영역
  name: { x: 1110, y: 360, w: 1150, h: 200 },
  region: { x: 1110, y: 820, w: 1150, h: 200 },
  job: { x: 2550, y: 820, w: 1220, h: 200 },
  cta: { x: 3150, y: 1510, w: 740, h: 180 },        // 발급받기 버튼 박스
  // ⬇️ 프로필 사진을 카드 "왼쪽 중앙" 근처로 배치
  //    x를 줄이면 더 왼쪽, y를 올리면 더 위로 감. 필요하면 이 숫자만 조정해도 됨.
  avatar: { x: 260, y: 520, w: 600, h: 600 },
};

// px → % 변환
const pct = (v: number, base: number) => `${(v / base) * 100}%`;

// NeoDGM + 보조 스타일
const GlobalStyle = () => (
  <Global
    styles={`
      :root { --neo: 'NeoDGM', system-ui, sans-serif; }
      body { font-family: var(--neo); }
      .label-dot::after {
        content: '';
        display:inline-block;width:6px;height:6px;margin-left:6px;
        border-radius:1px;transform:translateY(-1px);
      }
    `}
  />
);

const CONTENT_OFFSET_Y = 80;

export default function Setting() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [region, setRegion] = useState("");
  const [job, setJob] = useState("");

  // 카드 원본 비율 계산
  const [ratio, setRatio] = useState(BASE_W / BASE_H);
  useEffect(() => {
    const img = new window.Image();
    img.src = IMG.CARD_BASE;
    img.onload = () => setRatio(img.naturalWidth / img.naturalHeight);
  }, []);

  const onSubmit = () => {
    console.log({ name, gender, region, job });
    nav("/prologue");
  };

  const charSrc = useMemo(
    () => (gender === "male" ? IMG.CHAR_MALE : IMG.CHAR_FEMALE),
    [gender]
  );

  // 모든 입력 완료 여부
  const isComplete = !!(name.trim() && region.trim() && job.trim());

  // 미입력 항목 안내
  const missing: string[] = [];
  if (!name.trim())   missing.push("이름");
  if (!region.trim()) missing.push("거주지역");
  if (!job.trim())    missing.push("직업");

  const tip = isComplete ? "" : `먼저 ${missing.join(", ")} 입력해주세요.`;

  // 오버레이 공통 스타일: 부모가 relative, 자식 absolute + % 좌표
  const Overlay = useMemo(
    () =>
      function Overlay({
        x,
        y,
        w,
        h,
        children,
      }: {
        x: number;
        y: number;
        w: number;
        h: number;
        children: React.ReactNode;
      }) {
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

  const inputSkin = {
    fontFamily: "var(--neo)",
    fontSize: { base: "12px", md: "14px" },
    color: "white",
    bg: "rgba(50,40,56,0.9)",
    border: "2px solid rgba(132,98,160,0.6)",
    _focus: { borderColor: "#fff", boxShadow: "none" },
    h: "100%",
    w: "100%",
    px: 3,
  } as const;

  return (
    <>
      <GlobalStyle />

      {/* 페이지 배경 */}
      <Box as="main" pos="relative" h="100vh" w="100vw" overflow="hidden">
        <Image
          src={IMG.PAGE_BG}
          alt=""
          pos="absolute"
          inset={0}
          w="100%"
          h="100%"
          objectFit="cover"
          draggable={false}
          style={{ imageRendering: "pixelated" }}
          filter="blur(6px)"        // 🔹 배경을 더 흐리게
          transform="scale(1.03)"   // blur로 생기는 가장자리 빈틈 가리기
        />
        <Box pos="absolute" inset={0} bg="rgba(0,0,0,0.55)" /> {/* 어두운 오버레이는 유지 */}

        {/* 중앙 카드 컨테이너 */}
        <Box
          pos="absolute"
          inset={0}
          zIndex={1}
          h="100%"
          display="grid"
          placeItems="center"
          px={{ base: 4, md: 8 }}
          py={{ base: 6, md: 10 }}
        >
          {/* 카드 래퍼: 여기에 프로필/폼 전부 올라감 */}
          <Box
            position="relative"
            width={{ base: "100%", md: "90%", lg: "80%" }}
            maxW="800px"
            aspectRatio={ratio}
            borderRadius="24px"
            overflow="hidden"
            boxShadow="0 18px 40px rgba(0,0,0,0.55)"
          >
            {/* 카드 베이스 이미지(상단바+배경 한 장) */}
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

            {/* ✅ 프로필(캐릭터) - 카드 안, 왼쪽 중앙 근처 */}
            <Overlay {...PX.avatar}>
              <Box
                w="100%"
                h="100%"
                position="relative"
                zIndex={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Image
                  key={gender}
                  src={charSrc}
                  alt="캐릭터"
                  w="100%"
                  h="100%"
                  objectFit="contain"
                  style={{ imageRendering: "pixelated" }}
                  draggable={false}
                />
              </Box>
            </Overlay>

            {/* === 이름 === */}
            <Overlay {...PX.name}>
              <FormControl w="100%" h="100%">
                <FormLabel
                  className="label-dot"
                  m={0}
                  mb={2}
                  fontSize={{ base: "20px", md: "22px" }}
                  color="white"
                >
                  이름:
                </FormLabel>
                <ImageInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  ariaLabel="이름"
                  insetX={18}
                  insetY={12}
                  fontSize="16px"
                />
              </FormControl>
            </Overlay>

            {/* === 성별 === */}
            <Overlay {...PX.genderGroup}>
              <FormControl w="100%" h="100%">
                <FormLabel
                  className="label-dot"
                  m={0}
                  mb={2}
                  fontSize={{ base: "20px", md: "22px" }}
                  color="white"
                >
                  성별:
                </FormLabel>

                <HStack
                  spacing={4}
                  role="radiogroup"
                  aria-label="성별"
                  align="center"
                  height="calc(100% -2rem)"
                >
                  <IconButton
                    aria-label="남성"
                    role="radio"
                    aria-checked={gender === "male"}
                    icon={
                      <Image
                        src={IMG.ICON_MALE}
                        alt=""
                        w="18px"
                        h="18px"
                      />
                    }
                    variant="ghost"
                    bg={
                      gender === "male"
                        ? "rgba(121,168,255,0.18)"
                        : "transparent"
                    }
                    border="2px solid"
                    borderColor={
                      gender === "male" ? "#ffffff" : "transparent"
                    }
                    borderRadius="12px"
                    _hover={{ bg: "rgba(121,168,255,0.22)" }}
                    onClick={() => setGender("male")}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      setGender("male")
                    }
                  />
                  <IconButton
                    aria-label="여성"
                    role="radio"
                    aria-checked={gender === "female"}
                    icon={
                      <Image
                        src={IMG.ICON_FEMALE}
                        alt=""
                        w="18px"
                        h="18px"
                      />
                    }
                    variant="ghost"
                    bg={
                      gender === "female"
                        ? "rgba(255,159,178,0.18)"
                        : "transparent"
                    }
                    border="2px solid"
                    borderColor={
                      gender === "female" ? "#ffffff" : "transparent"
                    }
                    borderRadius="12px"
                    _hover={{ bg: "rgba(255,159,178,0.22)" }}
                    onClick={() => setGender("female")}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      setGender("female")
                    }
                  />
                </HStack>
              </FormControl>
            </Overlay>

            {/* === 거주지역 === */}
            <Overlay {...PX.region}>
              <FormControl w="100%" h="100%">
                <FormLabel
                  className="label-dot"
                  m={0}
                  mb={2}
                  fontSize={{ base: "20px", md: "22px" }}
                  color="white"
                >
                  거주지역:
                </FormLabel>
                <ImageInput
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  ariaLabel="거주지역"
                  insetX={18}
                  insetY={12}
                  fontSize="16px"
                />
              </FormControl>
            </Overlay>

            {/* === 직업 === */}
            <Overlay {...PX.job}>
              <FormControl w="100%" h="100%">
                <FormLabel
                  className="label-dot"
                  m={0}
                  mb={2}
                  fontSize={{ base: "20px", md: "22px" }}
                  color="white"
                >
                  직업:
                </FormLabel>
                <ImageInput
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  ariaLabel="직업"
                  insetX={18}
                  insetY={12}
                  fontSize="16px"
                />
              </FormControl>
            </Overlay>

            {/* CTA 버튼 */}
            <Overlay {...PX.cta}>
              <Tooltip
                isDisabled={isComplete}   // 완료되면 툴팁 비활성
                label={tip}
                hasArrow
                placement="top"
                openDelay={200}
              >
                {(() => {
                  const disabled = !isComplete;

                  const handleClick = () => {
                    if (disabled) return;
                    console.log({ name, gender, region, job });
                    nav("/prologue");
                  };

                  const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleClick();
                    }
                  };

                  return (
                    <Box
                      as="button"
                      type="button"
                      aria-label="발급받기"
                      aria-disabled={disabled}
                      onClick={handleClick}
                      onKeyDown={handleKeyDown}
                      w="100%"
                      h="100%"
                      bgImage={`url('${IMG.BTN_DEF}')`}  // 단일 이미지 스킨
                      bgRepeat="no-repeat"
                      bgSize="contain"
                      bgPosition="center"
                      cursor={disabled ? "not-allowed" : "pointer"}
                      filter={
                        disabled
                          ? "grayscale(100%) opacity(0.6)"
                          : undefined
                      }
                      userSelect="none"
                    />
                  );
                })()}
              </Tooltip>
            </Overlay>

            {/* 날짜 */}
            <Overlay
              x={BASE_W * 0.35}
              y={BASE_H - 400}
              w={BASE_W * 0.30}
              h={70}
            >
              <Box
                w="100%"
                textAlign="center"
                color="#fff"
                fontFamily="var(--neo)"
                fontSize="16px"
              >
                {todayStr}
              </Box>
            </Overlay>

            {/* 기관명 */}
            <Overlay
              x={BASE_W * 0.25}
              y={BASE_H - 300}
              w={BASE_W * 0.50}
              h={80}
            >
              <Box
                w="100%"
                textAlign="center"
                color="#fff"
                fontFamily="var(--neo)"
                fontSize="16px"
              >
                프롤로그시 프롤로그구청
              </Box>
            </Overlay>
          </Box>
        </Box>
      </Box>
    </>
  );
}
