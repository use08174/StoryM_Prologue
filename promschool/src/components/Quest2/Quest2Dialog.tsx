import { Box, Text, Badge, HStack, Image, VStack } from "@chakra-ui/react";

type Quest2DialogProps = {
  speaker?: string;
  text: string;
  tone?: "default" | "buddy";
  avatarSrc?: string;
  imageSrc?: string;
};

export default function Quest2Dialog({
  speaker,
  text,
  tone = "default",
  avatarSrc,
  imageSrc,
}: Quest2DialogProps) {
  const isBuddy = tone === "buddy";
  const avatar =
    avatarSrc ||
    (isBuddy
      ? "/assets/quest2_scenes/buddy.png"
      : "/assets/quest2_scenes/agent.png");

  return (
    <Box
      position="absolute"
      left="50%"
      transform="translateX(-50%)"
      bottom="130px"
      width="92%"
      zIndex={500}
    >
      {imageSrc && (
        <Box
          position="absolute"
          bottom="100%"
          left="50%"
          transform="translate(-50%, -12px)"
          width="640px"
          bg="white"
          borderRadius="16px"
          overflow="hidden"
          boxShadow="lg"
          mb={2}
        >
          <Image src={imageSrc} alt="매물 이미지" objectFit="cover" />
        </Box>
      )}

      {/* 말풍선 */}
      <Box
        bg={isBuddy ? "blue.50" : "white"}
        border="3px solid #333"
        borderRadius="24px"
        boxShadow="lg"
        color="black"
        p={5}
        position="relative"
      >
        {speaker && (
          <Badge
            position="absolute"
            top="-14px"
            left="20px"
            colorScheme={isBuddy ? "blue" : "gray"}
            px={3}
            py={1}
            borderRadius="lg"
            fontSize="sm"
            border="2px solid #333"
            bg={isBuddy ? "blue.100" : "gray.100"}
          >
            {speaker}
          </Badge>
        )}

        <HStack align="center" spacing={4}>
          <Image
            src={avatar}
            alt={speaker}
            boxSize="10%"            
            bg="white"
          />
          <VStack align="flex-start" spacing={2} flex="1">
            <Text whiteSpace="pre-line" lineHeight="1.6" fontSize="md">
              {text}
            </Text>
          </VStack>
        </HStack>

        <Text
          position="absolute"
          right="16px"
          bottom="10px"
          fontSize="sm"
          color="gray.500"
        >
          Enter / Space ▸
        </Text>
      </Box>
    </Box>
  );
}
