import { Box, Image } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ReactNode } from "react";

const wiggle = keyframes`
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.06); }
  100% { transform: translateY(0) scale(1); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,.6); }
  70% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
`;

type PhoneButtonProps = {
  alarm: number;
  highlight?: boolean;
  onClick?: () => void;
  label?: string;          // 더 이상 사용하지 않지만, 타입은 호환 위해 유지
  iconSrc?: string;
  rightAdornment?: ReactNode;
};

export default function PhoneButton({
  alarm,
  highlight = false,
  onClick,
  iconSrc = "/assets/sprites/storym_phone.png",
  rightAdornment,
}: PhoneButtonProps) {
  return (
    <Box position="relative">
      <Box
        as="button"
        onClick={onClick}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        bg="transparent"
        border="none"
        borderRadius="0"
        px={0}
        py={0}
        boxShadow="none"
        cursor="pointer"
        position="relative"
        // minW="70px"  제거
        _hover={{ transform: "scale(1.06)" }}
        _active={{ transform: "scale(0.98)" }}
        animation={highlight ? `${wiggle} 900ms ease-in-out infinite` : undefined}
      >
        {highlight && (
          <Box
            position="absolute"
            inset="-4px"
            // 배경 없이 pulse만
            borderRadius="12px"
            animation={`${pulse} 1.4s ease-out infinite`}
            pointerEvents="none"
          />
        )}

        <Image src={iconSrc} alt="phone" boxSize="60px" pointerEvents="none" />

        {alarm > 0 && (
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            bg="red.500"
            color="white"
            fontSize="xs"
            fontWeight="bold"
            px={2}
            borderRadius="full"
            lineHeight="18px"
            minW="18px"
            textAlign="center"
          >
            {alarm}
          </Box>
        )}

        {/* 라벨 제거 */}
        {/* <Text ...>{label}</Text> */}

        {rightAdornment}
      </Box>
    </Box>
  );
}
