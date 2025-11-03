import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  VStack,
  // Wrap은 더 이상 필요하지 않으므로 제거합니다.
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 픽셀 폰트(Press Start 2P)를 Google Fonts에서 가져옵니다.
const PixelFontImporter = () => (
  <Global
    styles={`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    `}
  />
);

// 이 컴포넌트를 App.tsx의 /setting 라우트에 연결해주세요.
export const Setting = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [region, setRegion] = useState(""); // '지역' 상태 (텍스트 입력을 위해 ""로 변경)
  const [job, setJob] = useState(""); // '직업' 상태 (텍스트 입력을 위해 ""로 변경)

  // 성별에 따라 표시할 이미지 경로
  // (경로는 public/assets/sprites/ 기준으로 가정합니다)
  const charImage =
    gender === "male"
      ? "/assets/sprites/char_male.png"
      : "/assets/sprites/char_female.png";

  const handleStart = () => {
    // 생성된 캐릭터 정보에 'region'과 'job'을 포함합니다.
    console.log("캐릭터 생성:", { name, gender, region, job });
    navigate("/prologue");
  };

  // 픽셀아트 버튼 스타일 (성별 버튼을 위해 남겨둡니다)
  const pixelButtonStyle = (isActive = false) => ({
    fontFamily: "inherit",
    fontSize: { base: "xs", md: "sm" },
    color: isActive ? "white" : "#e4d5b7",
    bg: isActive ? "#6a4e3a" : "#2b1a0e",
    border: "2px solid",
    borderColor: isActive ? "white" : "#c18c54",
    borderRadius: "none",
    px: { base: 2, md: 4 },
    py: { base: 1, md: 2 },
    _hover: { bg: "#6a4e3a", color: "white" },
    _active: { bg: "#4a2e1f" },
  });

  // 픽셀아트 입력 필드 스타일 (중복을 줄이기 위해 공통 스타일로 추출)
  const pixelInputStyle = {
    fontFamily: "inherit",
    fontSize: { base: "xs", md: "sm" },
    bg: "#2b1a0e",
    border: "2px solid #c18c54",
    borderRadius: "none",
    _hover: { borderColor: "#fff" },
    _focus: { borderColor: "#fff", boxShadow: "none" },
    autoComplete: "off",
  };

  return (
    <>
      {/* 픽셀 폰트 적용 */}
      <PixelFontImporter />

      {/* 배경 컨테이너 */}
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
        fontFamily="'Press Start 2P', monospace"
        overflowY="auto" // 내용이 길어질 경우 스크롤 허용
      >
        {/* 뒷배경 어둡게 처리 */}
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.6)" zIndex={5} />

        {/* 설정 팝업창 (스타듀밸리 스타일) */}
        <VStack
          spacing={{ base: 4, md: 6 }}
          p={{ base: 4, md: 8 }}
          my={{ base: 4, md: 0 }} // 모바일에서 위아래 여백 추가
          bg="#4a2e1f" // 어두운 나무색 배경
          borderWidth="4px"
          borderStyle="solid"
          borderColor="#c18c54" // 밝은 나무색 테두리
          boxShadow="0 0 0 4px #2b1a0e" // 더 어두운 테두리
          color="white"
          borderRadius="sm"
          zIndex={10}
          w="90vw"
          maxW="600px" // 팝업창 최대 너비
        >
          {/* 제목 */}
          <Box
            fontSize={{ base: "lg", md: "xl" }}
            color="#e4d5b7"
            as="h1"
            pb={2}
          >
            캐릭터 생성
          </Box>

          {/* 메인 컨텐츠 (좌: 미리보기, 우: 설정) */}
          <HStack
            spacing={{ base: 4, md: 8 }}
            w="100%"
            alignItems="flex-start"
            // 모바일에서 세로로 쌓이도록 변경
            flexDirection={{ base: "column", md: "row" }}
          >
            {/* 좌: 캐릭터 미리보기 */}
            <VStack
              spacing={2}
              align="center"
              w={{ base: "100%", md: "128px" }} // 모바일에서 꽉 차게, 데스크탑에서 고정
              alignSelf={{ base: "center", md: "flex-start" }}
            >
              <Box
                w={{ base: "100px", md: "128px" }}
                h={{ base: "100px", md: "128px" }}
                bg="#e4d5b7" // 양피지 배경
                border="4px solid #c18c54"
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
                style={{ imageRendering: "pixelated" }}
              >
                <Image
                  src={charImage}
                  alt="캐릭터 미리보기"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src =
                      gender === "male"
                        ? "https://placehold.co/128x128/663399/FFFFFF?text=MALE"
                        : "https://placehold.co/128x128/FF69B4/FFFFFF?text=FEMALE";
                    target.alt =
                      gender === "male" ? "남성 기본 이미지" : "여성 기본 이미지";
                  }}
                />
              </Box>
              <Box fontSize={{ base: "10px", md: "xs" }} color="#e4d5b7">
                {gender === "male" ? "남성" : "여성"}
              </Box>
            </VStack>

            {/* 우: 설정 (이름, 성별, 지역, 직업) */}
            <VStack spacing={4} align="flex-start" flex={1} w="100%">
              {/* 이름 */}
              <FormControl>
                <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
                  이름:
                </FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={12}
                  {...pixelInputStyle} // 공통 스타일 적용
                />
              </FormControl>

              {/* 성별 */}
              <FormControl>
                <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
                  성별:
                </FormLabel>
                <HStack>
                  <Button
                    {...pixelButtonStyle(gender === "male")}
                    onClick={() => setGender("male")}
                  >
                    남성
                  </Button>
                  <Button
                    {...pixelButtonStyle(gender === "female")}
                    onClick={() => setGender("female")}
                  >
                    여성
                  </Button>
                </HStack>
              </FormControl>

              {/* 지역 (텍스트 입력으로 변경) */}
              <FormControl>
                <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
                  거주 지역:
                </FormLabel>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  maxLength={20} // 최대 길이 설정 (선택 사항)
                  {...pixelInputStyle} // 공통 스타일 적용
                />
              </FormControl>

              {/* 직업 (텍스트 입력으로 변경) */}
              <FormControl>
                <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
                  직업:
                </FormLabel>
                <Input
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  maxLength={20} // 최대 길이 설정 (선택 사항)
                  {...pixelInputStyle} // 공통 스타일 적용
                />
              </FormControl>
            </VStack>
          </HStack>

          {/* 하단 시작하기 버튼 */}
          <Button
            mt={4}
            fontFamily="inherit"
            fontSize={{ base: "sm", md: "md" }}
            bg="#c18c54"
            color="#2b1a0e"
            border="2px solid #2b1a0e"
            borderRadius="none"
            px={8}
            py={2}
            _hover={{ bg: "#e4d5b7" }}
            _active={{ bg: "#a16c34" }}
            onClick={handleStart}
            isDisabled={!name.trim()} // 이름이 비어있으면 비활성화
          >
            시작하기
          </Button>
        </VStack>
      </Box>
    </>
  );
};

export default Setting;