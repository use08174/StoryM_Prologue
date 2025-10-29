import { Box, Text, HStack, Avatar, Badge, Image } from "@chakra-ui/react";

type Props = {
  speaker?: string;
  text: string;
  mission?: boolean;
  image?: string;
  end?: boolean;
};

export default function Quest2Dialog({ speaker, text, mission, image, end }: Props) {
  return (
    <Box
      position="absolute"
      bottom="30px"
      width="80%"
      left="10%"
      p={5}
      borderRadius="2xl"
      bg="whiteAlpha.900"
      boxShadow="lg"
      fontFamily="Pretendard"
    >
      {image && (
        <Image
          src={image}
          alt="scene"
          width="100%"
          borderRadius="xl"
          mb={3}
        />
      )}

      {speaker && (
        <HStack spacing={3} mb={2}>
          <Avatar size="sm" name={speaker} />
          <Badge colorScheme="pink" px={2} py={1} borderRadius="lg">
            {speaker}
          </Badge>
        </HStack>
      )}

      <Text whiteSpace="pre-line" fontSize="md">
        {text}
      </Text>

      {!end && (
        <Text textAlign="right" fontSize="sm" mt={3} color="gray.500">
          Enter 키로 다음 ▶
        </Text>
      )}
    </Box>
  );
}
