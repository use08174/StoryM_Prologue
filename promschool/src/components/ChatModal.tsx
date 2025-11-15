// src/components/ChatModal.tsx
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  Box,
  VStack,
  HStack,
  Textarea,
  Button,
  Text,
  Image,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";

type Role = "user" | "buddy" | "agent" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/** ───────── 스타일 팔레트 & 픽셀 보더 유틸 (디자인만 추가) ───────── */
const C = {
  primary: "#7E44A8",
  accent: "#FCCFDB",
  mid: "#A372C2",
  dark: "#121318",
  panel: "#1A1B22",
};
const pixelBorder = (outer = C.primary, inner = C.mid) => ({
  border: "0",
  boxShadow: `
    0 0 0 2px ${outer},
    0 0 0 4px ${inner},
    inset 0 0 0 2px ${inner}
  `,
  borderRadius: "0",
});

const getApiBase = () => {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL as string;
    }
  } catch {}
  if (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_API_BASE) {
    return (process as any).env.NEXT_PUBLIC_API_BASE as string;
  }
  if (typeof process !== "undefined" && (process as any)?.env?.REACT_APP_API_BASE_URL) {
    return (process as any).env.REACT_APP_API_BASE_URL as string;
  }
  return "http://localhost:8000";
};

export default function ChatModal({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // 모달 닫힐 때 스트림 중지
  useEffect(() => {
    if (!isOpen && controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    controllerRef.current = new AbortController();

    try {
      const API_BASE_URL = getApiBase();
      const res = await fetch(`${API_BASE_URL}/llm/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          user_id: "demo_user",
          character_id: 0,
        }),
        signal: controllerRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`No response stream (status ${res.status})`);

      let aiText = "";
      setMessages((m) => [...m, { role: "buddy", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });

        setMessages((m) => {
          const updated = [...m];
          const last = updated.length - 1;
          updated[last] = { ...updated[last], content: aiText };
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat stream error:", err);
      setMessages((m) => [
        ...m,
        { role: "agent", content: "⚠️ 연결 오류가 발생했습니다. 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  const onEnterSend = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  };

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isUser = msg.role === "user";
    const isBuddy = msg.role === "buddy";
    const isAgent = msg.role === "agent";
    const bubbleBg = isUser ? C.primary : C.dark;
    const borderOuter = isUser ? C.primary : "#3b2c49";
    const name = isUser ? "나" : isBuddy ? "버디" : isAgent ? "중개인" : "AI";
    const avatar = isUser
      ? "/assets/avatars/player.png"
      : isBuddy
      ? "/assets/avatars/buddy.png"
      : "/assets/avatars/agent.png";

    return (
      <HStack
        key={idx}
        align="flex-start"
        justify={isUser ? "flex-end" : "flex-start"}
        spacing={3}
        mb={3}
      >
        {!isUser && (
          <Image
            src={avatar}
            w="36px"
            h="36px"
            alt={name}
          />
        )}
        <Box maxW="72%">
          {!isUser && (
            <Text fontSize="xs" color="#CFCFD6" mb={1} fontFamily="NeoDGM">
              {name}
            </Text>
          )}
          <Box
            bg={bubbleBg}
            color="white"
            px={3}
            py={2}
            fontFamily="NeoDGM, sans-serif"
            whiteSpace="pre-wrap"
            {...pixelBorder(borderOuter, C.mid)}
          >
            {msg.content}
          </Box>
        </Box>
        {isUser && (
          <Image
            src={avatar}
            w="36px"
            h="36px"
            alt={name}
          />
        )}
      </HStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={C.panel} color={C.accent} maxW="760px" {...pixelBorder(C.primary, C.mid)}>
        {/* 상단 픽셀 바 */}
        <Box h="28px" bg={C.primary} />

         <ModalCloseButton
          sx={pixelBorder(C.accent, C.primary)}
          bg={C.accent}
          color={C.primary}
          _hover={{ bg: C.accent }}
          top="8px"
          right="8px"
        />
        

        <ModalHeader pt="10px" pb="0" fontFamily="NeoDGM" letterSpacing="0.5px">
          StoryM 챗봇
        </ModalHeader>

        <ModalBody pt="14px" pb="16px">
          <VStack spacing={3} align="stretch">
            {/* 대화 영역 카드 */}
            <Box
              ref={scrollRef}
              h="420px"
              overflowY="auto"
              p="12px"
              bg={C.dark}
              {...pixelBorder(C.primary, C.mid)}
              sx={{
                "&::-webkit-scrollbar": { width: "8px" },
                "&::-webkit-scrollbar-thumb": { background: C.primary },
              }}
            >
              {messages.map(renderMessage)}
              {loading && (
                <HStack mt={2} color="#CFCFD6">
                  <Spinner size="sm" color={C.accent} />
                  <Text fontSize="sm">응답 생성 중...</Text>
                </HStack>
              )}
            </Box>

            {/* 입력 영역 카드 */}
            <HStack
              bg={C.dark}
              p="10px"
              spacing={3}
              align="stretch"
              {...pixelBorder(C.primary, C.mid)}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onEnterSend}
                placeholder="메시지를 입력하세요… (Enter 전송, Shift+Enter 줄바꿈)"
                bg={C.panel}
                color="white"
                border="0"
                rows={2}
                resize="none"
                fontFamily="NeoDGM"
                _focus={{ outline: "none" }}
                isDisabled={loading}
              />
              <Button
                onClick={sendMessage}
                isLoading={loading}
                bg={C.accent}
                color={C.primary}
                _hover={{ bg: C.accent }}
                px={6}
                fontFamily="NeoDGM"
                {...pixelBorder(C.primary, C.primary)}
              >
                전송
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
