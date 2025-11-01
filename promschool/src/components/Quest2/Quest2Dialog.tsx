import { Box, Text, Badge, HStack, Image, VStack } from "@chakra-ui/react";

type Quest2DialogProps = {
  speaker?: string;
  text: string;
  tone?: "default" | "buddy"; // buddy는 파란 강조
  avatarSrc?: string; // 🧍 캐릭터 이미지 (선택적)
  onFinish?: () => void;
};

export default function Quest2Dialog({
  speaker,
  text,
  tone = "default",
  avatarSrc,
}: Quest2DialogProps) {
  const isBuddy = tone === "buddy";

  const avatar =
    avatarSrc ||
    (isBuddy
      ? "/assets/quest2_scenes/buddy.png" // 버디 (가이드) 이미지
      : "/assets/quest2_scenes/agent.png"); // 중개인 이미지


  return (
    <Box
      position="absolute"
      left="50%"
      transform="translateX(-50%)"
      bottom="130px"
      width="82%"
      zIndex={500}
    >
      <Box
        bg={isBuddy ? "blue.50" : "white"}
        border="3px solid #333"
        borderRadius="24px"
        boxShadow="lg"
        color="black"
        p={5}
        position="relative"
      >
        <HStack align="center" spacing={4}>
          <Image
            src={avatar}
            alt={speaker}
            boxSize="85px"
            borderRadius="lg"
            bg="white"
          />

          <VStack align="flex-start" spacing={2} flex="1">
            <Text whiteSpace="pre-line" lineHeight="1.6" fontSize="md">
              {text}
            </Text>
          </VStack>
        </HStack>

        {/* 안내 텍스트 */}
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