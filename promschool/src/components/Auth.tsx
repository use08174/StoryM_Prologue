import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 픽셀 폰트(Press Start 2P)
const PixelFontImporter = () => (
  <Global
    styles={`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    `}
  />
);

// 이 컴포넌트를 App.tsx의 /auth 라우트에 연결해주세요.
export const Auth = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false); // 로그인/회원가입 폼 전환
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const handleAuth = () => {
    if (isRegister) {
      // --- 회원가입 로직 ---
      if (password !== confirmPassword) {
        console.error("비밀번호가 일치하지 않습니다.");
        // (실제로는 alert() 대신 UI에 에러 메시지를 표시해야 합니다)
        return;
      }
      console.log("회원가입 시도:", { email, password });
    } else {
      // --- 로그인 로직 ---
      // (실제 앱에서는 여기서 Firebase/서버로 로그인 요청을 보냅니다)
      console.log("로그인 시도:", { email, password });
    }

    // 로그인/회원가입 성공 시 캐릭터 생성 페이지로 이동
    navigate("/profile");
  };

  // 픽셀아트 입력 필드 스타일
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
      <PixelFontImporter />
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
        overflowY="auto"
      >
        {/* 뒷배경 어둡게 처리 */}
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.6)" zIndex={5} />

        {/* 로그인/회원가입 팝업창 (Setting.tsx와 동일한 스타일) */}
        <VStack
          as="form" // 폼으로 감싸기 (onSubmit 방지)
          onSubmit={(e) => {
            e.preventDefault(); // Enter키로 페이지 새로고침 방지
            handleAuth();
          }}
          spacing={{ base: 4, md: 6 }}
          p={{ base: 6, md: 8 }}
          my={4}
          bg="#4a2e1f"
          borderWidth="4px"
          borderStyle="solid"
          borderColor="#c18c54"
          boxShadow="0 0 0 4px #2b1a0e"
          color="white"
          borderRadius="sm"
          zIndex={10}
          w="90vw"
          maxW="480px" // Setting.tsx보다 폭을 조금 좁게
        >
          {/* 제목 */}
          <Box
            fontSize={{ base: "lg", md: "xl" }}
            color="#e4d5b7"
            as="h1"
            pb={2}
          >
            {isRegister ? "회원가입" : "로그인"}
          </Box>

          {/* 이메일 */}
          <FormControl>
            <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
              이메일:
            </FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              {...pixelInputStyle}
            />
          </FormControl>

          {/* 비밀번호 */}
          <FormControl>
            <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
              비밀번호:
            </FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...pixelInputStyle}
            />
          </FormControl>

          {/* 비밀번호 확인 (회원가입 시에만 보임) */}
          {isRegister && (
            <FormControl>
              <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
                비밀번호 확인:
              </FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                {...pixelInputStyle}
              />
            </FormControl>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit" // 폼 제출 버튼으로
            mt={4}
            fontFamily="inherit"
            fontSize={{ base: "sm", md: "md" }}
            bg="#c18c54"
            color="#2b1a0e"
            border="2px solid #2b1a0e"
            borderRadius="none"
            px={8}
            py={2}
            w="100%"
            _hover={{ bg: "#e4d5b7" }}
            _active={{ bg: "#a16c34" }}
          >
            {isRegister ? "회원가입" : "로그인"}
          </Button>

          {/* 폼 전환 버튼 */}
          <Button
            variant="link"
            fontSize={{ base: "10px", md: "xs" }}
            color="#e4d5b7"
            onClick={() => setIsRegister(!isRegister)}
            _hover={{ color: "white" }}
            mt={2}
          >
            {isRegister
              ? "이미 계정이 있으신가요? 로그인"
              : "계정이 없으신가요? 회원가입"}
          </Button>
        </VStack>
      </Box>
    </>
  );
};

export default Auth;