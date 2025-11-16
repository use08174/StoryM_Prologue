// src/components/Quest2Dialog.tsx
import { Box, Flex, VStack, Text, HStack, Image, Icon } from "@chakra-ui/react";
import { FiChevronRight } from "react-icons/fi";

type Quest2DialogProps = {
  speaker?: string;
  text: string;
  tone?: "default" | "buddy";
  avatarSrc?: string;
  imageSrc?: string;
};

const UI = {
  primary: "#815b3a",  // 에이전트 계열 보라
  buddy:   "#A372C2",  // 버디 보라
  shadow:  "rgba(0,0,0,0.45)",
  bubbleAgent: "#fff6e9",  // 에이전트 말풍선 틴트
  bubbleBuddy: "#e1d2f9",  // 버디 말풍선 틴트
};

export default function Quest2Dialog({
  speaker,
  text,
  tone = "default",
  avatarSrc,
  imageSrc,
}: Quest2DialogProps) {
  const isBuddy = tone === "buddy";
  const borderColor = isBuddy ? UI.buddy : UI.primary;
  const bubbleTint = isBuddy ? UI.bubbleBuddy : UI.bubbleAgent;

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
      zIndex={1500}
      pointerEvents="none"           
    >
      {imageSrc && (
        <Box
          position="absolute"
          bottom="100%"
          left="50%"
          transform="translate(-50%, -12px)"
          width={["98%", "880px"]}
          maxW="880px"
          bg="white"
          borderRadius="16px"
          border={`3px solid ${borderColor}`}
          overflow="hidden"
          boxShadow={`0 12px 32px ${UI.shadow}`}
          mb={2}
          pointerEvents="auto"
        >
          <Image src={imageSrc} alt="scene" objectFit="cover" w="100%" />
        </Box>
      )}

      {/* 말풍선 */}
      <Flex
        pointerEvents="auto"
        maxW="880px"
        w={["94%", "88%", "880px"]}
        mx="auto"
        bg={`${bubbleTint}F2`}
        borderRadius="16px"
        border={`3px solid ${borderColor}`}
        boxShadow={`0 12px 36px ${UI.shadow}`}
        overflow="hidden"
        position="relative"
        _after={{
          content: '""',
          position: "absolute",
          bottom: "-12px",
          left: "80px",
          borderWidth: "12px 10px 0 10px",
          borderStyle: "solid",
          borderColor: `${borderColor} transparent transparent transparent`,
          filter: `drop-shadow(0 2px 2px ${UI.shadow})`,
        }}
      >
        {/* 아바타 */}
        <Flex align="center" justify="center" p={[3, 4]} minW={["88px", "110px"]}>
          <Image
            src={avatar}
            alt={speaker || (isBuddy ? "버디" : "중개인")}
            boxSize={["70px", "86px"]}
            objectFit="contain"
            draggable={false}
          />
        </Flex>

        {/* 텍스트 */}
        <VStack align="stretch" spacing={1} flex={1} pr={[2, 3, 4]} py={[2, 3]}>
          {speaker && (
            <Text
              fontWeight="bold"
              color={borderColor}
              fontFamily="NeoDGM"
              fontSize={["sm", "md"]}
              mb={1}
            >
              {speaker}
            </Text>
          )}

          <Box pb={[2, 3]} pr={[1, 2]}>
            <Text
              fontFamily="NeoDGM"
              fontSize={["md", "lg"]}
              color="#000"
              lineHeight="1.7"
              whiteSpace="pre-wrap"
              userSelect="none"
            >
              {text}
            </Text>
          </Box>

          <HStack align="center" justify="flex-end" pb={[2, 3]} pr={[1, 2]}>
            <HStack
              spacing={1}
              userSelect="none"
              cursor="default"
              sx={{ animation: "pulse 1.6s ease-in-out infinite" }}
            >
              <Text fontSize="sm" color="#333" opacity={0.95}>
                Enter / Space
              </Text>
              <Icon as={FiChevronRight} boxSize={5} color="#333" />
            </HStack>
          </HStack>
        </VStack>
      </Flex>

      {/* keyframes */}
      <style>{`
        @keyframes pulse {
          0% { opacity: .65; transform: translateZ(0); }
          50% { opacity: 1; transform: translateZ(0) scale(1.03); }
          100% { opacity: .65; transform: translateZ(0); }
        }
      `}</style>
    </Box>
  );
}
