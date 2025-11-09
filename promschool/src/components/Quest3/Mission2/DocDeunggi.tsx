import { useState } from "react";
import { Box, Button, Image, VStack, Text } from "@chakra-ui/react";

const DocDeunggi = ({ onComplete, setBuddyMsg }: any) => {
  const [step, setStep] = useState<string>("main");

  const openStep = (s: string, msg: string) => {
    setStep(s);
    setBuddyMsg(msg);
  };

  return (
    <VStack spacing={4} bg="rgba(20,20,20,0.95)" p={6} borderRadius="md">
      <Text color="yellow.300" fontWeight="bold">등기부등본</Text>
      {step === "main" && (
        <>
          <Image src="/assets/quest3_scenes/deunggi_full.png" w="750px" />
          <VStack>
            <Button onClick={() => openStep("표제부", "표제부에서는 주소 일치 여부를 확인해봐!")}>표제부 보기</Button>
            <Button onClick={() => openStep("갑구", "갑구에서는 소유자 이름과 압류 여부를 확인!")}>갑구 보기</Button>
            <Button onClick={() => openStep("을구", "을구에서는 근저당권 설정 여부를 확인!")}>을구 보기</Button>
          </VStack>
          <Button colorScheme="teal" mt={3} onClick={onComplete}>등기부등본 점검 완료</Button>
        </>
      )}
      {step === "표제부" && <Image src="/assets/quest3_scenes/deunggi_title.png" w="700px" />}
      {step === "갑구" && <Image src="/assets/quest3_scenes/deunggi_ga.png" w="700px" />}
      {step === "을구" && <Image src="/assets/quest3_scenes/deunggi_ul.png" w="700px" />}
    </VStack>
  );
};

export default DocDeunggi;
