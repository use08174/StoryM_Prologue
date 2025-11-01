import { Box, Text, Image as ChakraImage, VStack } from "@chakra-ui/react";

export type MissionOverlayProps = {
  title?: string;
  text?: string;
  reward?: string;
  imageSrc?: string;
  tone?: "yellow" | "white"; // 노란 박스(미션 안내) / 흰 배경(사진+라벨)
};

export default function MissionOverlay({
  title,
  text,
  reward,
  imageSrc,
  tone = "yellow",
}: MissionOverlayProps) {
  const isYellow = tone === "yellow";

  return (
    <Box
      position="absolute"
      top="12%"
      left="50%"
      transform="translateX(-50%)"
      bg={isYellow ? "yellow.300" : "white"}
      border={isYellow ? "3px solid #333" : "2px solid #333"}
      borderRadius="16px"
      boxShadow="2xl"
      p={isYellow ? 6 : 3}
      w="72%"
      textAlign="center"
      color="black"
      zIndex={900}
    >
      <VStack spacing={isYellow ? 3 : 2}>
        {title && (
          <Text fontSize={isYellow ? "2xl" : "xl"} fontWeight="bold">
            {title}
          </Text>
        )}
        {text && (
          <Text fontSize="md" whiteSpace="pre-line" lineHeight="1.5">
            {text}
          </Text>
        )}
        {reward && <Text fontSize="sm">{reward}</Text>}
        {imageSrc && (
          <ChakraImage
            src={imageSrc}
            alt="mission"
            width="100%"
            borderRadius="10px"
            mt={isYellow ? 1 : 0}
          />
        )}
      </VStack>
    </Box>
  );
}
