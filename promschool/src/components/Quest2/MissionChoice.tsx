// src/components/Quest2/MissionChoice.tsx
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { useEffect } from "react";

export type MissionChoiceProps = {
  title?: string;
  question: string;
  options: readonly string[] | [string, string, string];
  onSelect: (index: number) => void;
  enableKeySelect?: boolean;
};

export default function MissionChoice({
  title,
  question,
  options,
  onSelect,
  enableKeySelect = false,
}: MissionChoiceProps) {
  useEffect(() => {
    if (!enableKeySelect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") onSelect(0);
      if (e.key === "2") onSelect(1);
      if (e.key === "3") onSelect(2);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enableKeySelect, onSelect]);

  return (
    <Box
      position="absolute"
      left="50%"
      transform="translateX(-50%)"
      bottom="9%"
      width="84%"
      bg="#fff"
      border="3px solid #333"
      borderRadius="14px"
      boxShadow="xl"
      p={5}
      zIndex={960}
      color="black"
      textAlign="center"
    >
      {title && (
        <Text fontWeight="bold" fontSize="lg" mb={2}>
          {title}
        </Text>
      )}
      <Text mb={3}>{question}</Text>

      <HStack spacing={3} justify="center" flexWrap="wrap">
        {options.map((label, i) => (
          <Button
            key={i}
            onClick={() => onSelect(i)}
            bg="white"
            border="2px solid #333"
            _hover={{ bg: "gray.100" }}
            borderRadius="10px"
            minW="140px"
          >
            ({i + 1}) {label}
          </Button>
        ))}
      </HStack>

      {enableKeySelect && (
        <Text mt={3} fontSize="sm" color="gray.600">
          숫자키 1/2/3 으로도 선택할 수 있어요.
        </Text>
      )}
    </Box>
  );
}
