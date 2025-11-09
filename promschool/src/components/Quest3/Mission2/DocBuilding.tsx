import { useState } from "react";
import { Box, Button, Image, VStack, Text } from "@chakra-ui/react";

const DocBuilding = ({ onComplete, setBuddyMsg }: any) => {
  const [step, setStep] = useState<string>("main");

  const openStep = (s: string, msg: string) => {
    setStep(s);
    setBuddyMsg(msg);
  };

  return (
    <VStack spacing={4} bg="rgba(20,20,20,0.95)" p={6} borderRadius="md">
      <Text color="yellow.300" fontWeight="bold">건축물대장</Text>
      {step === "main" && (
        <>
          <Image src="/assets/quest3_scenes/building_full.png" w="750px" />
          <VStack>
            <Button onClick={() => openStep("위반건축물", "위반건축물 표시가 있는지 확인해!")}>위반건축물 여부</Button>
            <Button onClick={() => openStep("주소", "주소가 등기부등본과 일치하는지 봐!")}>대상물 주소</Button>
            <Button onClick={() => openStep("소유자", "소유자 정보가 일치하는지 확인!")}>소유자 확인</Button>
            <Button onClick={() => openStep("용도", "건축물 용도가 주거용인지 확인!")}>주용도 확인</Button>
          </VStack>
          <Button colorScheme="teal" mt={3} onClick={onComplete}>건축물대장 점검 완료</Button>
        </>
      )}
      {step === "위반건축물" && <Image src="/assets/quest3_scenes/building_violation.png" w="700px" />}
      {step === "주소" && <Image src="/assets/quest3_scenes/building_address.png" w="700px" />}
      {step === "소유자" && <Image src="/assets/quest3_scenes/building_owner.png" w="700px" />}
      {step === "용도" && <Image src="/assets/quest3_scenes/building_usage.png" w="700px" />}
    </VStack>
  );
};

export default DocBuilding;
