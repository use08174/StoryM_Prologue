import { Box, Button, HStack, Text, Badge } from "@chakra-ui/react";
import { useEffect } from "react";

type MissionChoiceProps = {
  title: string;
  question: string;
  options: string[];
  onSelect: (index: number) => void; // 0-based
  enableKeySelect?: boolean;
};

export default function MissionChoice({
  title,
  question,
  options,
  onSelect,
  enableKeySelect = true,
}: MissionChoiceProps) {
  useEffect(() => {
    if (!enableKeySelect) return;
    const onKey = (e: KeyboardEvent) => {
      if (["1", "2", "3"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < options.length) onSelect(idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enableKeySelect, options.length, onSelect]);

  return (
    <Box
      position="absolute"
      left="50%"
      transform="translateX(-50%)"
      bottom="8%"
      width="76%"
      bg="white"
      border="3px solid #333"
      borderRadius="14px"
      boxShadow="xl"
      p={5}
      zIndex={950}
      textAlign="center"
      color="black"
    >
      <Badge
        bg="pink.200"
        color="black"
        border="2px solid #333"
        borderRadius="10px"
        px={4}
        py={1}
        mb={3}
        fontWeight="bold"
      >
        {title}
      </Badge>

      <Text fontSize="lg" mb={3}>
        {question}
      </Text>

      <HStack spacing={4} justify="center">
        {options.map((opt, i) => (
          <Button
            key={i}
            onClick={() => onSelect(i)}
            bg="white"
            border="2px solid #333"
            _hover={{ bg: "gray.100" }}
            borderRadius="10px"
            minW="110px"
          >
            {opt}
          </Button>
        ))}
      </HStack>

      <Text mt={2} fontSize="sm" color="gray.600">
        숫자키 1/2/3 또는 버튼 클릭
      </Text>
    </Box>
  );
}
