import {
  Box,
  FormControl,
  Input,
  VStack,
  Text,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiSignup, apiMe } from "../lib/api";

// 👉 이미지 경로는 프로젝트 구조에 맞게 바꿔 써줘
const IMG = {
  BG: "/assets/sprites/prologue_main.png",
  BTN_LOGIN: "/assets/ui/btn_login.png",           // 로그인 버튼 이미지
  ID_SAVE_OFF: "/assets/ui/id_save_off.png",      // 아이디 저장 OFF
  ID_SAVE_ON: "/assets/ui/id_save_on.png",        // 아이디 저장 ON
};

// 네오둠 글꼴 임포트 (경로는 프로젝트에 맞게 수정)
const GlobalStyle = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'NeoDGM';
        src: url('/assets/fonts/neodgm.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      body {
        font-family: 'NeoDGM', system-ui, sans-serif;
      }
    `}
  />
);

export const Auth = () => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false); // 로그인/회원가입 전환

  // 입력 상태
  const [id, setId] = useState("");
  const [email, setEmail] = useState(""); // 회원가입 전용
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 아이디 저장 토글
  const [rememberId, setRememberId] = useState(false);

  // UX 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 첫 진입 시 저장된 아이디 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("savedId");
    if (saved) {
      setId(saved);
      setRememberId(true);
    }
  }, []);

  const handleAuth = useCallback(async () => {
    setError(null);

    // 간단 유효성 검사
    if (!id) return setError("아이디를 입력해주세요.");
    if (isRegister && !email) return setError("이메일을 입력해주세요.");
    if (!password) return setError("비밀번호를 입력해주세요.");
    if (isRegister && password !== confirmPassword) {
      return setError("비밀번호가 일치하지 않습니다.");
    }

    try {
      setLoading(true);
      let token: string | null = null;

      if (isRegister) {
        // 회원가입
        await apiSignup({ id, email, password });

        // 바로 로그인
        const res = await apiLogin({ id, password });
        if (res?.token) {
          token = res.token;
          localStorage.setItem("token", token);
        } else {
          throw new Error("회원가입은 성공했으나, 로그인에 실패했습니다.");
        }
      } else {
        // 로그인
        const res = await apiLogin({ id, password });
        if (res?.token) {
          token = res.token;
          localStorage.setItem("token", token);
        } else {
          throw new Error("로그인에 성공했으나, 토큰을 받지 못했습니다.");
        }
      }

      // 🔹 아이디 저장 처리
      if (rememberId) {
        localStorage.setItem("savedId", id);
      } else {
        localStorage.removeItem("savedId");
      }

      await apiMe(token);
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
  }, [id, email, password, confirmPassword, rememberId, isRegister, navigate]);

  // 인풋 스타일 (투명 + 흰 테두리)
  const glassInputStyle = {
    bg: "transparent",
    borderRadius: "md",
    border: "1px solid rgba(255,255,255,0.45)",
    color: "white",
    fontSize: "md",
    _placeholder: { color: "rgba(255,255,255,0.7)" },
    _hover: { borderColor: "rgba(255,255,255,0.85)" },
    _focus: {
      borderColor: "white",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.9)",
      bg: "rgba(0,0,0,0.10)",
    },
  } as const;

  return (
    <>
      <GlobalStyle />
      <Box
        as="main"
        height="100vh"
        width="100vw"
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgImage={`url('${IMG.BG}')`}
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        overflowY="auto"
      >
        {/* 전체를 살짝 어둡게 */}
        <Box position="absolute" inset={0} bg="rgba(0,0,0,0.7)" zIndex={1} />

        {/* 로그인 카드 */}
        <VStack
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleAuth();
          }}
          spacing={4}
          p={{ base: 6, md: 8 }}
          // 2. 폼 배경: #362740 + 투명도 50
          bg="rgba(54,39,64,0.5)"
          backdropFilter="blur(18px)"
          borderRadius="2xl"
          boxShadow="0 24px 60px rgba(0,0,0,0.7)"
          color="white"
          w="90vw"
          maxW="480px"
          position="relative"
          zIndex={5}
          fontFamily="'NeoDGM', system-ui, sans-serif"
        >
          {/* X 버튼 (옵션) */}
          <Box
            as="button"
            type="button"
            position="absolute"
            top={4}
            right={4}
            fontSize="lg"
            color="rgba(255,255,255,0.7)"
            _hover={{ color: "white" }}
            onClick={() => navigate(-1)}
            fontFamily="'NeoDGM', system-ui, sans-serif"
          >
            ✕
          </Box>

          {/* 제목 */}
          <Text as="h1" fontSize="xl" mb={2}>
            {isRegister ? "회원가입" : "로그인"}
          </Text>

          {/* 에러 메시지 */}
          {error && (
            <Text fontSize="xs" color="pink.200" textAlign="center">
              {error}
            </Text>
          )}

          {/* 아이디 */}
          <FormControl>
            <Input
              placeholder="아이디"
              value={id}
              onChange={(e) => setId(e.target.value)}
              h="48px"
              {...glassInputStyle}
            />
          </FormControl>

          {/* 이메일 (회원가입일 때만) */}
          {isRegister && (
            <FormControl>
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                h="48px"
                {...glassInputStyle}
              />
            </FormControl>
          )}

          {/* 비밀번호 */}
          <FormControl>
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              h="48px"
              {...glassInputStyle}
            />
          </FormControl>

          {/* 비밀번호 확인 (회원가입일 때만) */}
          {isRegister && (
            <FormControl>
              <Input
                type="password"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                h="48px"
                {...glassInputStyle}
              />
            </FormControl>
          )}

          {/* 아이디 저장 + 회원가입 링크 (로그인 모드일 때만) */}
          {!isRegister && (
            <HStack w="100%" justify="space-between" pt={1} align="center">
              <HStack spacing={2} align="center">
                {/* 4. 아이디 저장 버튼 이미지 토글 */}
                <Box
                  as="button"
                  type="button"
                  w="24px"
                  h="24px"
                  bgImage={`url('${
                    rememberId ? IMG.ID_SAVE_ON : IMG.ID_SAVE_OFF
                  }')`}
                  bgSize="contain"
                  bgRepeat="no-repeat"
                  bgPosition="center"
                  border="none"
                  aria-pressed={rememberId}
                  aria-label="아이디 저장"
                  onClick={() => setRememberId((prev) => !prev)}
                />
                <Text fontSize="sm">아이디 저장</Text>
              </HStack>

              <Box
                as="button"
                type="button"
                fontSize="sm"
                color="rgba(255,255,255,0.85)"
                _hover={{ color: "white" }}
                onClick={() => setIsRegister(true)}
              >
                회원가입
              </Box>
            </HStack>
          )}

          {/* 3. 로그인 버튼을 이미지로 */}
          <Box
            as="button"
            type="submit"
            mt={6}
            bgImage={`url('${IMG.BTN_LOGIN}')`}
            bgRepeat="no-repeat"
            bgSize="contain"
            bgPosition="center"
            w="200px"        // 이미지 비율에 맞게 조절
            h="45px"
            border="none"
            aria-label={isRegister ? "회원가입" : "로그인"}
            pointerEvents={loading ? "none" : "auto"}
            opacity={loading ? 0.7 : 1}
            _hover={{ filter: "brightness(1.05)" }}
            _active={{ transform: "translateY(1px)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
          >
            {/* 로딩 중이면 위에 스피너만 살짝 올려줌 (이미지 안 가리게 반투명) */}
            {loading && (
              <Box
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="rgba(0,0,0,0.50)"
                borderRadius="md"
              >
                <Spinner size="sm" color="white" />
              </Box>
            )}
          </Box>

          {/* 회원가입 모드일 때: 로그인으로 돌아가기 */}
          {isRegister && (
            <Box
              as="button"
              type="button"
              fontSize="xs"
              color="rgba(255,255,255,0.85)"
              _hover={{ color: "white" }}
              mt={1}
              onClick={() => setIsRegister(false)}
            >
              이미 계정이 있으신가요? 로그인
            </Box>
          )}
        </VStack>
      </Box>
    </>
  );
};

export default Auth;
