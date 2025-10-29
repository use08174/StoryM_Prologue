import { useEffect } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

type Props = {
  isOpen: boolean;
  title?: string;         
  message?: string;       
  onYes: () => void;
  onNo: () => void;
};

export default function ConfirmStartModal({
  isOpen,
  title = "퀘스트 1",
  message = "퀘스트 1을 시작하시겠습니까?",
  onYes,
  onNo,
}: Props) {
  // Enter=YES, Esc=NO
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Enter") onYes();
      if (e.key === "Escape") onNo();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onYes, onNo]);

  if (!isOpen) return null;

  return (
    <Box position="absolute" inset={0} zIndex={60} bg="rgba(0,0,0,0.15)">
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        maxW="640px"
        w={["92%", "620px"]}
        bg="#f7f7f5"                 
        border="2px solid #815b3a"   
        borderRadius="22px"
        boxShadow="0 10px 30px rgba(0,0,0,.2)"
        p={6}
      >
        <Box
          display="inline-block"
          bg="#f0e2cc"
          border="2px solid #815b3a"
          borderRadius="12px"
          px={3}
          py={1}
          mb={3}
        >
          <Text fontWeight="bold" color="#5b4633" fontSize="sm">
            {title}
          </Text>
        </Box>

        <VStack align="center" spacing={4} pt={1}>
          <Text fontSize="lg" color="#263238" textAlign="center">
            {message}
          </Text>

          <HStack spacing={3} pt={2}>
            <Button colorScheme="green" onClick={onYes}>
              YES (Enter)
            </Button>
            <Button onClick={onNo}>NO (Esc)</Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
