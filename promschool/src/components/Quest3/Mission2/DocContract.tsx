import { useState } from "react";
import { Box, Button, Image, VStack, Text } from "@chakra-ui/react";

const DocContract = ({ onComplete, setBuddyMsg }: any) => {
  const [step, setStep] = useState<string>("main");
  const [wrongSelected, setWrongSelected] = useState<string[]>([]);

  const openStep = (s: string, msg: string) => {
    setStep(s);
    setBuddyMsg(msg);
  };

  const handleSelect = (key: string) => {
    const correct = ["②", "③", "④"];
    const next = wrongSelected.includes(key)
      ? wrongSelected.filter((k) => k !== key)
      : [...wrongSelected, key];
    setWrongSelected(next);
    if (correct.every((k) => next.includes(k))) {
      setBuddyMsg("좋아! 불리한 특약을 모두 골랐어. 수정 요청을 해보자!");
    }
  };

  return (
    <VStack spacing={4} bg="rgba(20,20,20,0.95)" p={6} borderRadius="md">
      <Text color="yellow.300" fontWeight="bold">임대차계약서</Text>

      {step === "main" && (
        <>
          <Image src="/assets/quest3_scenes/contract_full.png" w="750px" />
          <VStack>
            <Button onClick={() => openStep("기본조항", "보증금, 월세, 기간, 관리비를 꼭 확인해!")}>기본 조항 보기</Button>
            <Button onClick={() => openStep("특약사항", "불리한 특약을 찾아서 선택해보자!")}>특약사항 보기</Button>
            <Button onClick={() => openStep("보증금", "보증금 반환 조건이 모호하진 않은지 확인!")}>보증금 반환 조건</Button>
            <Button onClick={() => openStep("주소", "계약서의 주소가 일치하는지 확인!")}>대상물 주소</Button>
            <Button onClick={() => openStep("소유자", "임대인 이름이 등기부등본과 일치하는지 확인!")}>소유자 확인</Button>
          </VStack>
          <Button colorScheme="teal" mt={3} onClick={onComplete}>임대차계약서 점검 완료</Button>
        </>
      )}

      {step === "기본조항" && <Image src="/assets/quest3_scenes/contract_basic.png" w="700px" />}
      {step === "특약사항" && (
        <Box>
          <Image src="/assets/quest3_scenes/contract_terms.png" w="700px" mb={3} />
          <Text color="white" mb={2}>임차인에게 불리한 항목을 모두 선택해주세요.</Text>
          <VStack>
            {["①", "②", "③", "④"].map((n) => (
              <Button
                key={n}
                variant={wrongSelected.includes(n) ? "solid" : "outline"}
                colorScheme={wrongSelected.includes(n) ? "red" : "gray"}
                onClick={() => handleSelect(n)}
              >
                {n} 선택
              </Button>
            ))}
          </VStack>
        </Box>
      )}
      {step === "보증금" && <Image src="/assets/quest3_scenes/contract_deposit.png" w="700px" />}
      {step === "주소" && <Image src="/assets/quest3_scenes/contract_address.png" w="700px" />}
      {step === "소유자" && <Image src="/assets/quest3_scenes/contract_owner.png" w="700px" />}
    </VStack>
  );
};

export default DocContract;
