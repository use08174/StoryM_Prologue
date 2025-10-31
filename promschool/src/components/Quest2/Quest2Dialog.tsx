import { Box, Text, Badge } from "@chakra-ui/react";

type Quest2DialogProps = {
  speaker?: string;
  text: string;
  tone?: "default" | "buddy"; // buddy는 파란 강조
  onFinish?: () => void;
};

export default function Quest2Dialog({
  speaker,
  text,
  tone = "default",
}: Quest2DialogProps) {
  const isBuddy = tone === "buddy";

  return (
    <Box
      position="absolute"
      left="50%"
      transform="translateX(-50%)"
      bottom="0"
      width="92%"
      bg="white"
      border="3px solid #333"
      borderBottom="none"
      borderRadius="24px 24px 0 0"
      boxShadow="lg"
      color="black"
      p={5}
      zIndex={500}
    >
      {speaker && (
        <Badge
          colorScheme={isBuddy ? "blue" : "gray"}
          px={3}
          py={1}
          borderRadius="lg"
          mb={2}
          fontSize="sm"
        >
          {speaker}
        </Badge>
      )}
      <Text whiteSpace="pre-line" lineHeight="1.6">
        {text}
      </Text>
      <Text position="absolute" right="16px" bottom="10px" fontSize="sm" color="gray.500">
        Enter/Space ▸
      </Text>
    </Box>
  );
}
