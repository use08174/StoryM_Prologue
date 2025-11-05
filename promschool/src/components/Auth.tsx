import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiSignup, apiMe } from "../lib/api";

// 픽셀 폰트(Press Start 2P)
const PixelFontImporter = () => (
  <Global
    styles={`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    `}
  />
);

export const Auth = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isRegister, setIsRegister] = useState(false); // 로그인/회원가입 폼 전환

  // 각각 필요한 입력 상태
  const [id, setId] = useState("");
  const [email, setEmail] = useState(""); // 회원가입 전용
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UX 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
  setError(null);

  // (유효성 검사 부분은 동일...)
  if (!id) return setError("아이디를 입력해주세요.");
  if (isRegister && !email) return setError("이메일을 입력해주세요.");
  if (!password) return setError("비밀번호를 입력해주세요.");
  if (isRegister && password !== confirmPassword)
    return setError("비밀번호가 일치하지 않습니다.");

  try {
    setLoading(true);
    let token: string | null = null; // 👈 토큰을 저장할 변수

    if (isRegister) {
      // --- 회원가입 ---
      await apiSignup({ id, email, password });
      // toast({ title: "회원가입 완료!", description: "자동으로 로그인합니다.", status: "success" });

      // [ ✅ 수정된 부분 ]
      // 회원가입 후, 즉시 로그인 API를 호출해서 토큰을 받아옵니다.
      const res = await apiLogin({ id, password });
      if (res?.token) {
        token = res.token;
        localStorage.setItem("token", token);
      } else {
        // 회원가입은 성공했는데 로그인이 안되면 에러
        throw new Error("회원가입은 성공했으나, 로그인에 실패했습니다.");
      }
    } else {
      // --- 로그인 ---
      const res = await apiLogin({ id, password });
      if (res?.token) {
        token = res.token; // 👈 변수에 토큰 저장
        localStorage.setItem("token", token);
      } else {
         throw new Error("로그인에 성공했으나, 토큰을 받지 못했습니다.");
      }
      // toast({ title: "로그인 성공!", status: "success" });
    }

    // 로그인/회원가입 후 본인 정보 확인 (세션 or 토큰)
    // [ ✅ 수정된 부분 ]
    // localStorage에서 다시 읽는 대신, 방금 얻은 'token' 변수를 사용합니다.
    await apiMe(token); // 👈 이제 token은 null이 아닙니다.
    navigate("/profile");
  } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();

      if (isRegister) {
        if (msg.includes("at least") && msg.includes("6")) {
          return setError("비밀번호는 최소 6자 이상이어야 합니다.");
        }
        return setError("아이디가 이미 존재합니다. 다른 아이디를 사용해주세요.");
      } else {
        return setError("아이디 또는 비밀번호가 일치하지 않습니다.");
      }
  } finally {
    setLoading(false);
  }
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
  } as const;

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
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.6)" zIndex={5} />

        <VStack
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleAuth();
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
          maxW="480px"
        >
          <Box fontSize={{ base: "lg", md: "xl" }} color="#e4d5b7" as="h1" pb={2}>
            {isRegister ? "회원가입" : "로그인"}
          </Box>

          {/* 에러 메시지 */}
          {error && (
            <Text fontSize="xs" color="pink.200">
              {error}
            </Text>
          )}

          {/* 아이디(공통) */}
          <FormControl>
            <FormLabel fontSize={{ base: "xs", md: "sm" }} mb={2}>
              아이디:
            </FormLabel>
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              {...pixelInputStyle}
            />
          </FormControl>

          {/* 이메일(회원가입 전용) */}
          {isRegister && (
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
          )}

          {/* 비밀번호(공통) */}
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

          {/* 비밀번호 확인(회원가입 전용) */}
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

          <Button
            type="submit"
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
            isDisabled={loading}
            leftIcon={loading ? <Spinner size="sm" /> : undefined}
          >
            {isRegister ? "회원가입" : "로그인"}
          </Button>

          <Button
            variant="link"
            fontSize={{ base: "10px", md: "xs" }}
            color="#e4d5b7"
            onClick={() => setIsRegister(!isRegister)}
            _hover={{ color: "white" }}
            mt={2}
            isDisabled={loading}
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
