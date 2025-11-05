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
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input as ChakraInput } from "@chakra-ui/react";
import { Tooltip } from "@chakra-ui/react";

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
  PAGE_BG: `${PUB}assets/background/prologue_main.png`, // 페이지 전체 배경(선택)
  CARD_BASE: `${PUB}assets/ui/card_bg.png`,            // << 상단바+카드 배경이 합쳐진 "한 장" 이미지
  ICON_MALE: `${PUB}assets/ui/icon_male.png`,
  ICON_FEMALE: `${PUB}assets/ui/icon_female.png`,
  AVATAR_FRAME: `${PUB}assets/ui/icon_profile.png`,
  CHAR_MALE: `${PUB}assets/ui/icon_profile.png`,
  CHAR_FEMALE: `${PUB}assets/ui/icon_profile.png`,
  BTN_DEF: `${PUB}assets/ui/btn_default.png`,
  INP: `${PUB}assets/ui/input_bg.png`, // 기본
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
    bgImage={`url('${IMG.INP}')`}  // ← 항상 같은 이미지
    bgRepeat="no-repeat"
    bgSize="100% 100%"              // 컨테이너에 맞춰 스킨을 늘림
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
//  Figma의 "Frame 3" 기준 픽셀 크기(스크린샷에 보인 4137.53 × 1925.76).
//  정수로 반올림해서 써도 무방합니다.
//  *이 값은 '퍼센트'로 변환하는 기준에만 쓰이고, 렌더 사이즈는 이미지가 결정합니다.*
// ─────────────────────────────────────────────────────────────
const BASE_W = 4138;
const BASE_H = 1926;

// ─────────────────────────────────────────────────────────────
//  ⛳ 오버레이 좌표(퍼센트로 변환할 원본 px). 아래 값만 네 Figma 수치로 '정확히' 바꿔주세요.
//  각 좌표는 카드 "한 장" 이미지 안의 위치입니다.
//  (아래 숫자는 데모용 대략값이니, Figma에서 측정한 정확한 px로 바꾸세요.)
// ─────────────────────────────────────────────────────────────
const PX = {

  genderGroup: { x: 2550, y: 360, w: 420, h: 120 }, // 아이콘 두 개가 들어갈 작은 영역
  name: { x: 1110, y: 360, w: 1150, h: 200 },
  region: { x: 1110, y: 820, w: 1150, h: 200 },
  job    : { x: 2550, y: 820, w: 1220, h: 200 },
  cta: { x: 3150, y: 1510, w: 740, h: 180 },        // 발급받기 버튼 박스
  maleIcon: { x: 0, y: 0, w: 90, h: 90 },           // genderGroup 내부 상대 크기(임의=덮어씀)
  femaleIcon: { x: 180, y: 0, w: 90, h: 90 },       // genderGroup 내부 상대
  avatar: { x: 1100, y: 620, w: 440, h: 440 }, // 예시값
};

// px → % 변환 헬퍼
const pct = (v: number, base: number) => `${(v / base) * 100}%`;
// const charSrc = gender === "male" ? IMG.CHAR_MALE : IMG.CHAR_FEMALE;

// const charSrc = useMemo(
//   () => (gender === "male" ? IMG.CHAR_MALE : IMG.CHAR_FEMALE),
//   [gender]
// );


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

  // 카드 원본 비율 계산(이미지가 로드되면 자연 크기 가져와서 비율 검증)
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

  // 미입력 항목 안내 (한국어 라벨은 실제 라벨명으로)
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
            top={pct(y + CONTENT_OFFSET_Y, BASE_H)}   // ← 여기만 수정
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
    bg: "rgba(50,40,56,0.9)", // 네가 만든 인풋 PNG 위에 얹는 게 아니라면 색상/투명도 조정 가능
    border: "2px solid rgba(132,98,160,0.6)",
    _focus: { borderColor: "#fff", boxShadow: "none" },
    h: "100%",
    w: "100%",
    px: 3,
  } as const;

  return (
    <>
      <GlobalStyle />

      {/* 페이지 배경(선택). 필요 없으면 이 블록 삭제 */}
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
        />
        <Box pos="absolute" inset={0} bg="rgba(0,0,0,0.55)" />
          {/* 중앙 카드 컨테이너: 이미지 '그대로' + 오버레이 */}
          <Box
            pos="relative"
            zIndex={1}
            h="100%"
            display="grid"
            placeItems="center"
            px={{ base: 4, md: 8 }}
            py={{ base: 6, md: 10 }}
          >
            <Overlay {...PX.avatar}>
            <Box
              w="80%"
              h="80%"
              position="relative"
              zIndex={2}
              bgImage={`url('${IMG.AVATAR_FRAME}')`}  // 프레임은 배경으로만
              bgRepeat="no-repeat"
              bgSize="contain"
              bgPosition="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* ✅ 단일 이미지만 렌더 */}
              <Image
                key={gender}                // 성별 바뀔 때 강제 교체
                src={charSrc}
                alt="캐릭터"
                w="80%"
                h="80%"
                objectFit="contain"
                style={{ imageRendering: "pixelated" }}
                draggable={false}
              />
            </Box>
          </Overlay>
          {/* 카드 래퍼: aspect-ratio 유지, 크기는 부모 폭에 맞춤 */}
          <Box
            position="relative"
            width={{ base: "100%", md: "90%", lg: "80%" }}
            maxW="800px"                 // 너무 커지지 않게 상한만 둠(원하면 제거)
            aspectRatio={ratio}           // 이미지 자연 비율 유지
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

            {/* === 오버레이: 2×2 폼 === */}
            <Overlay {...PX.name}>
              <FormControl w="100%" h="100%">
                <FormLabel className="label-dot" m={0} mb={2} fontSize={{ base: "20px", md: "22px" }} color="white">
                  이름:
                </FormLabel>
                  <ImageInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    ariaLabel="이름"
                    insetX={18}  // ← 네 스킨 텍스트 영역에 맞게만 조절
                    insetY={12}
                    fontSize="16px"
                  />
              </FormControl>
            </Overlay>

            <Overlay {...PX.genderGroup}>
              <FormControl w="100%" h="100%">
                {/* ▶ 라벨 추가 (디자인용 네모점 유지) */}
                <FormLabel className="label-dot" m={0} mb={2} fontSize={{ base: "20px", md: "22px" }} color="white">
                  성별:
                </FormLabel>

                {/* ▶ 라디오그룹 역할 + 아이콘만 표시 */}
                <HStack
                  spacing={4}
                  role="radiogroup"
                  aria-label="성별"
                  align="center"
                  height="calc(100% -3rem)" /* 라벨 높이만큼 뺀 영역에서 중앙 정렬 */
                >
                  <IconButton
                    aria-label="남성"
                    role="radio"
                    aria-checked={gender === "male"}
                    icon={<Image src={IMG.ICON_MALE} alt="" w="18px" h="18px" />}
                    variant="ghost"
                    bg={gender === "male" ? "rgba(121,168,255,0.18)" : "transparent"}
                    border="2px solid"
                    borderColor={gender === "male" ? "#ffffff" : "transparent"}
                    borderRadius="12px"
                    _hover={{ bg: "rgba(121,168,255,0.22)" }}
                    onClick={() => setGender("male")}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setGender("male")}
                  />
                  <IconButton
                    aria-label="여성"
                    role="radio"
                    aria-checked={gender === "female"}
                    icon={<Image src={IMG.ICON_FEMALE} alt="" w="18px" h="18px" />}
                    variant="ghost"
                    bg={gender === "female" ? "rgba(255,159,178,0.18)" : "transparent"}
                    border="2px solid"
                    borderColor={gender === "female" ? "#ffffff" : "transparent"}
                    borderRadius="12px"
                    _hover={{ bg: "rgba(255,159,178,0.22)" }}
                    onClick={() => setGender("female")}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setGender("female")}
                  />
                </HStack>
              </FormControl>
            </Overlay>


            <Overlay {...PX.region}>
              <FormControl w="100%" h="100%">
                <FormLabel className="label-dot" m={0} mb={2} fontSize={{  base: "20px", md: "22px" }} color="white">
                  거주지역:
                </FormLabel>
                  <ImageInput
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    ariaLabel="거주지역"
                    insetX={18}  // ← 네 스킨 텍스트 영역에 맞게만 조절
                    insetY={12}
                    fontSize="16px"
                  />
              </FormControl>
            </Overlay>

            <Overlay {...PX.job}>
              <FormControl w="100%" h="100%">
                <FormLabel className="label-dot" m={0} mb={2} fontSize={{  base: "20px", md: "22px" }} color="white">
                  직업:
                </FormLabel>
                  <ImageInput
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    ariaLabel="직업"
                    insetX={18}  // ← 네 스킨 텍스트 영역에 맞게만 조절
                    insetY={12}
                    fontSize="16px"
                  />
              </FormControl>
            </Overlay>

            {/* CTA 버튼 위치 */}
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
                      // title={!isComplete ? tip : undefined}  // 모바일/비툴팁 브라우저 대비
                      onClick={handleClick}
                      onKeyDown={handleKeyDown}
                      w="100%"
                      h="100%"
                      bgImage={`url('${IMG.BTN_DEF}')`}  // 단일 이미지 스킨
                      bgRepeat="no-repeat"
                      bgSize="contain"
                      bgPosition="center"
                      cursor={disabled ? "not-allowed" : "pointer"}
                      filter={disabled ? "grayscale(100%) opacity(0.6)" : undefined}
                      userSelect="none"
                    />
                  );
                })()}
              </Tooltip>
            </Overlay>
            {/* 날짜 */}
            <Overlay
              x={BASE_W * 0.35}          // 가운데 영역 시작(가로 30%를 중앙에 배치)
              y={BASE_H - 400}           // 카드 하단에서 위로 올림(필요시 ± 조정)
              w={BASE_W * 0.30}
              h={70}
            >
              <Box w="100%" textAlign="center" color="#fff" fontFamily="var(--neo)" fontSize="16px">
                {todayStr}
              </Box>
            </Overlay>

            {/* 기관명 */}
            <Overlay
              x={BASE_W * 0.25}
              y={BASE_H - 300}           // 날짜보다 살짝 아래(필요시 ± 조정)
              w={BASE_W * 0.50}
              h={80}
            >
              <Box w="100%" textAlign="center" color="#fff" fontFamily="var(--neo)" fontSize="16px">
                프롤로그시 프롤로그구청
              </Box>
            </Overlay>


          </Box>
        </Box>
      </Box>
    </>
  );
}
