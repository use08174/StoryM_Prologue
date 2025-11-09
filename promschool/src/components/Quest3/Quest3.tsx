import { useState } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";
import Mission1 from "./Mission1";
//import Mission2 from "./Mission2";

type Props = {
  onClose: () => void;
  onFinish: () => void;
};


const Quest3 = ({ onClose, onFinish }: Props) => {
  const [missionComplete, setMissionComplete] = useState<boolean | null>(null);

  const handleMissionResult = (success: boolean) => {
    setMissionComplete(success);
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1001}
      bg="blackAlpha.800"
      w="100vw"
      h="100vh"
      display="flex"
      alignItems="center"       justifyContent="center"
      color="white"
    >
      {missionComplete === null && (
        <Mission1 onResult={handleMissionResult} />
      )}

      {missionComplete === true && (
        <VStack spacing={5}>
          <Text fontSize="2xl" fontWeight="bold" color="green.300">
            [MISSION 1. COMPLETE!]
          </Text>
          <Text fontSize="lg">
            계약에 필요한 준비를 잘 마쳤습니다!
          </Text>
          <Box bg="gray.700" p={4} borderRadius="lg">
            <Text fontSize="sm">
              버디: 잘했어! 임대인이 신원과 경제력을 확인하기 위해 주민등록등본이나
              신용조회 결과서를 요청할 수도 있어. 단, 불필요한 개인정보를 요구할 땐 신중히 대응해야 해!
            </Text>
          </Box>
          <Button colorScheme="teal" onClick={onFinish}>
            다음 미션으로
          </Button>
        </VStack>
      )}

      {missionComplete === false && (
        <VStack spacing={5}>
          <Text fontSize="2xl" fontWeight="bold" color="red.300">
            [MISSION 1. FAILED…]
          </Text>
          <Text fontSize="lg">
            불필요한 준비물이 포함되거나, 필요한 준비물이 선택되지 않았습니다.
          </Text>
          <Button colorScheme="orange" onClick={() => setMissionComplete(null)}>
            가방 다시 챙기기
          </Button>
        </VStack>
      )}
    </Box>
  );
};

export default Quest3;
