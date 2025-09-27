import { Box, Image, Text } from "@chakra-ui/react";
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

const arrowBounce = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
`;

type PhoneButtonProps = {
  alarm: number;                 
  highlight?: boolean;           
  onClick?: () => void;          
  label?: string;                
  iconSrc?: string;              
  rightAdornment?: ReactNode;    
};

export default function PhoneButton({
  alarm,
  highlight = false,
  onClick,
  label = "Alarm",
  iconSrc = "/assets/sprites/phone_button.png",
  rightAdornment,
}: PhoneButtonProps) {
  return (
    <Box position="relative">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        bg="rgba(255,255,255,0.9)"
        borderRadius="xl"
        px={3}
        py={2}
        boxShadow="md"
        cursor="pointer"
        _hover={{ bg: "rgba(255,255,255,1)" }}
        position="relative"
        minW="70px"
        animation={highlight ? `${wiggle} 900ms ease-in-out infinite` : undefined}
        onClick={onClick}
      >
        {highlight && (
          <Box
            position="absolute"
            inset="-4px"
            borderRadius="xl"
            animation={`${pulse} 1.4s ease-out infinite`}
            pointerEvents="none"
          />
        )}

        <Image src={iconSrc} alt="phone" boxSize="30px" />

        {alarm > 0 && (
          <Box
            position="absolute"
            top="2px"
            right="6px"
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
        <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
          {label}
        </Text>
        {rightAdornment}
      </Box>    
    </Box>
  );
}
