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

/** 환경변수 안전 로더 (Vite / Next / CRA 모두 지원) */
const getApiBase = () => {
  // Vite
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL as string;
    }
  } catch {}
  // Next.js
  if (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_API_BASE) {
    return (process as any).env.NEXT_PUBLIC_API_BASE as string;
  }
  // CRA
  if (typeof process !== "undefined" && (process as any)?.env?.REACT_APP_API_BASE_URL) {
    return (process as any).env.REACT_APP_API_BASE_URL as string;
  }
  // Fallback
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

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    // 스트림 제어
    controllerRef.current = new AbortController();

    try {
      const API_BASE_URL = getApiBase();
      // console.log("[Chat] API_BASE_URL =>", API_BASE_URL);

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

      if (!res.ok || !res.body) {
        throw new Error(`No response stream (status ${res.status})`);
      }

      // AI 버블(버디) 미리 추가
      let aiText = "";
      setMessages((m) => [...m, { role: "buddy", content: "" }]);

      // 서버가 text/plain 스트림을 주므로 chunk를 그대로 이어붙인다
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;

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

    const bubbleColor = isUser
      ? "teal.600"
      : isBuddy
      ? "#7E44A8" // 버디(보라)
      : isAgent
      ? "orange.600"
      : "gray.600";

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
        spacing={2}
        mb={2}
      >
        {!isUser && <Image src={avatar} w="36px" h="36px" borderRadius="md" alt={name} />}
        <Box maxW="72%">
          {!isUser && (
            <Text fontSize="xs" color="gray.300" mb={1} fontFamily="NeoDGM">
              {name}
            </Text>
          )}
          <Text
            bg={bubbleColor}
            px={3}
            py={2}
            borderRadius="xl"
            color="white"
            whiteSpace="pre-wrap"
            fontFamily="NeoDGM, sans-serif"
            boxShadow="0 2px 4px rgba(0,0,0,0.25)"
          >
            {msg.content}
          </Text>
        </Box>
        {isUser && <Image src={avatar} w="36px" h="36px" borderRadius="md" alt={name} />}
      </HStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.7)" />
      <ModalContent bg="#1a1b22" color="white" border="2px solid #7E44A8" borderRadius="xl" p={3}>
        <ModalHeader fontFamily="NeoDGM">StoryM 대화창</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* 대화 영역 */}
            <Box
              ref={scrollRef}
              h="420px"
              overflowY="auto"
              p={3}
              bg="#121318"
              borderRadius="lg"
              border="1px solid rgba(255,255,255,0.1)"
              sx={{
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": { background: "#7E44A8", borderRadius: "3px" },
              }}
            >
              {messages.map(renderMessage)}
              {loading && (
                <HStack mt={2}>
                  <Spinner size="sm" color="#FCCFDB" />
                  <Text fontSize="sm" color="gray.400">
                    응답 생성 중...
                  </Text>
                </HStack>
              )}
            </Box>

            {/* 입력 */}
            <HStack>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onEnterSend}
                placeholder="메시지를 입력하세요..."
                bg="#1a1b22"
                border="1px solid #7E44A8"
                resize="none"
                rows={1}
                fontFamily="NeoDGM"
                isDisabled={loading}
              />
              <Button
                onClick={sendMessage}
                colorScheme="purple"
                isLoading={loading}
                px={6}
                borderRadius="md"
                fontFamily="NeoDGM"
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
