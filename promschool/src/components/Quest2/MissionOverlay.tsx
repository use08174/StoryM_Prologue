import { Box, Text } from "@chakra-ui/react";

type MissionOverlayProps = {
  title?: string;
  text: string;
  reward?: string;
};

export default function MissionOverlay({ title = "MISSION", text, reward }: MissionOverlayProps) {
  return (
    <Box
      position="absolute"
      top="15%"
      left="50%"
      transform="translateX(-50%)"
      bg="yellow.300"
      color="black"
      borderRadius="lg"
      boxShadow="2xl"
      p={8}
      w="65%"
      textAlign="center"
      zIndex={1000}
      fontWeight="bold"
      border="3px solid black"
    >
      <Text fontSize="2xl" mb={3}>
        {title}
      </Text>
      <Text fontSize="md" whiteSpace="pre-line" lineHeight="1.5">
        {text}
      </Text>
      {reward && (
        <Text mt={4} fontSize="sm">
          {reward}
        </Text>
      )}
    </Box>
  );
}
