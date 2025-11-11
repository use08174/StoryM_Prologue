// src/components/Quest3/Mission2/DocContract.tsx
import { useMemo, useState } from "react";
import { Box, Button, Image, VStack, Text, HStack, useToast } from "@chakra-ui/react";
import MessageModalQuest3, { Mission2Scene } from "./MessageModalQuest3Mission2";

type Props = {
  onComplete: () => void;              // Mission2 -> checkedDocs 에 반영하는 콜백(부모에서 넘겨줌)
  setBuddyMsg?: (msg: string) => void; // 선택: 하단 버디바 문구 갱신용
};

const C = { primary:"#7E44A8", accent:"#FCCFDB", mid:"#A372C2" };
const pixelBorder = (outer=C.primary, inner=C.mid)=>({
  border:"0",
  boxShadow:`0 0 0 2px ${outer}, 0 0 0 4px ${inner}, inset 0 0 0 2px ${inner}`,
  borderRadius:"0",
});

// 문서 내 단계
type Step = "main" | "기본조항" | "특약사항" | "보증금" | "주소" | "소유자";

// 특약 정답
const CORRECT_TERMS = ["②","③","④"] as const;

export default function DocContract({ onComplete, setBuddyMsg }: Props) {
  const [step, setStep] = useState<Step>("main");
  const toast = useToast();

  // ✅ 메시지 모달 상태 + 장면 키
  const [showMsg, setShowMsg] = useState(true);                    // 진입 시 인트로 표시
  const [scene, setScene] = useState<Mission2Scene>("contract_intro");

  // ✅ 진행 체크: 각 섹션을 방문/수정 완료했는지
  const [visited, setVisited] = useState<Record<Exclude<Step,"main">, boolean>>({
    "기본조항": false,
    "특약사항": false,  // ‘수정 요청’까지 완료되면 true
    "보증금":   false,
    "주소":     false,
    "소유자":   false,
  });

  // ✅ 특약 선택 상태
  const [picked, setPicked] = useState<string[]>([]);

  const correctAllPicked = useMemo(
    () => (CORRECT_TERMS as readonly string[]).every(k => picked.includes(k)),
    [picked]
  );
  const wrongPicks = useMemo(
    () => picked.filter(n => !(CORRECT_TERMS as readonly string[]).includes(n)),
    [picked]
  );
  const missingPicks = useMemo(
    () => (CORRECT_TERMS as readonly string[]).filter(n => !picked.includes(n)),
    [picked]
  );

  const allDone = useMemo(
    () => visited["기본조항"] && visited["특약사항"] && visited["보증금"] && visited["주소"] && visited["소유자"],
    [visited]
  );

  // 모달 열기 헬퍼
  const openScene = (s: Mission2Scene, buddyTip?: string) => {
    setScene(s);
    setShowMsg(true);
    if (buddyTip && setBuddyMsg) setBuddyMsg(buddyTip);
  };

  // 섹션 버튼 클릭
  const goStep = (s: Step) => {
    setStep(s);
    if (s === "기본조항") {
      openScene(
        "contract_basic",
        "보증금·월세·계약기간·관리비·지급일을 반드시 확인! 포함/별도 항목이 뭔지도 체크하자."
      );
    } else if (s === "특약사항") {
      openScene(
        "contract_special",
        "‘임차인 전액/임차인 부담’ 같은 문구는 위험. ‘임차인이 원인 제공 시 부담’으로 수정 요청!"
      );
    } else if (s === "보증금") {
      openScene(
        "contract_deposit_return",
        "‘확인 후 반환’은 모호해. ‘계약 종료일로부터 14일 이내 계좌로 반환’처럼 구체화가 안전."
      );
    } else if (s === "주소") {
      openScene(
        "contract_address",
        "계약서 ‘소재지’가 등기부/건축물대장과 일치하는지 확인!"
      );
    } else if (s === "소유자") {
      openScene(
        "contract_owner",
        "임대인 이름·주민번호 앞자리가 등기부/건축물대장 소유자와 일치해야 해."
      );
    }
  };

  // 섹션 방문 완료 표시
  const markVisited = (k: Exclude<Step,"main">) =>
    setVisited(prev => ({ ...prev, [k]: true }));

  // 특약 선택 토글
  const toggleTerm = (key: string) => {
    setPicked(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // 특약 ‘수정 요청’ 버튼 → 방문 완료 + 안내 대사
  const handleFixRequest = () => {
    if (!correctAllPicked) {
      const desc = [
        wrongPicks.length ? `정답이 아닌 선택: ${wrongPicks.join(", ")}` : null,
        missingPicks.length ? `빠진 항목: ${missingPicks.join(", ")}` : null,
      ].filter(Boolean).join(" / ");

      toast({
        title: "임차인에게 불리한 특약사항을 모두 선택해주세요",
        description: desc || "②, ③, ④를 모두 고르고 다른 번호는 해제하세요.",
        status: "warning",
        duration: 2200,
      });
      return;
    }
    markVisited("특약사항");
    openScene(
      "contract_special",
      "잘 골랐어! ‘임차인이 원인 제공 시 부담’처럼 조건을 명확히 바꾸자."
    );
  };

  // 각 섹션 완료(이미지 보기 후) 시점에 방문 처리
  const completeSection = (k: Exclude<Step,"main">) => {
    markVisited(k);
    setStep("main");
  };

  return (
    <VStack spacing={5} bg="rgba(20,20,20,0.95)" p={6} {...pixelBorder()}>
      <Text color={C.accent} fontWeight="bold" fontFamily="NeoDGM" fontSize="lg">
        임대차계약서
      </Text>

      {/* 메인 */}
      {step === "main" && (
        <>
          <Image src="/assets/quest3_scenes/contract.png" w="360px" />
          <VStack spacing={3}>
            <HStack wrap="wrap" spacing={3}>
              <Button onClick={() => goStep("기본조항")} bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}>기본 조항 보기</Button>
              <Button onClick={() => goStep("특약사항")} bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}>특약사항 보기</Button>
              <Button onClick={() => goStep("보증금")}   bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}>보증금 반환 조건</Button>
              <Button onClick={() => goStep("주소")}     bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}>대상물 주소</Button>
              <Button onClick={() => goStep("소유자")}   bg={C.accent} color={C.primary} _hover={{ bg:C.accent }} {...pixelBorder()}>소유자 확인</Button>
            </HStack>

            {/* 최종 완료: 모든 섹션 완료 후 활성화 */}
            <Button
              colorScheme="teal"
              mt={2}
              onClick={() => { openScene("outro"); onComplete(); }}
              isDisabled={!allDone}
              {...pixelBorder()}
            >
              임대차계약서 점검 완료
            </Button>
          </VStack>
        </>
      )}

      {/* 기본조항 */}
      {step === "기본조항" && (
        <>
          <Image src="/assets/quest3_scenes/contract_basic.png" w="400px" />
          <Button onClick={() => completeSection("기본조항")} mt={3} {...pixelBorder()}>전체 보기로</Button>
        </>
      )}

      {/* 특약사항 (정답 ②③④ 선택 → ‘수정 요청’) */}
      {step === "특약사항" && (
        <Box>
          <Image src="/assets/quest3_scenes/contract_terms.png" w="400px" mb={3} />
          <Text color="white" mb={1}>임차인에게 불리한 항목을 모두 선택하세요. (정답: ②③④)</Text>
          <Text color="gray.300" fontSize="sm" mb={2}>
            현재 선택: {picked.length ? picked.join(", ") : "없음"}
          </Text>

          <HStack spacing={3} mb={3}>
            {["①", "②", "③", "④"].map(n => {
              const pickedNow = picked.includes(n);
              const isCorrect = (CORRECT_TERMS as readonly string[]).includes(n);
              return (
                <Button
                  key={n}
                  variant={pickedNow ? "solid" : "outline"}
                  colorScheme={pickedNow ? (isCorrect ? "red" : "gray") : "gray"}
                  borderColor={!isCorrect && pickedNow ? "orange.300" : undefined}
                  borderWidth={!isCorrect && pickedNow ? "2px" : undefined}
                  onClick={() => toggleTerm(n)}
                >
                  {n} 선택
                </Button>
              );
            })}
          </HStack>

          <HStack>
            <Button variant="outline" onClick={() => setStep("main")} {...pixelBorder()}>전체 보기로</Button>
            <Button
              colorScheme="purple"
              onClick={handleFixRequest}
              isDisabled={!correctAllPicked}
              {...pixelBorder()}
            >
              부동산 중개인에게 수정 요청하기
            </Button>
          </HStack>
        </Box>
      )}

      {/* 보증금/주소/소유자 */}
      {step === "보증금" && (
        <>
          <Image src="/assets/quest3_scenes/contract_deposit.png" w="700px" />
          <Button onClick={() => completeSection("보증금")} mt={3} {...pixelBorder()}>전체 보기로</Button>
        </>
      )}
      {step === "주소" && (
        <>
          <Image src="/assets/quest3_scenes/contract_address.png" w="700px" />
          <Button onClick={() => completeSection("주소")} mt={3} {...pixelBorder()}>전체 보기로</Button>
        </>
      )}
      {step === "소유자" && (
        <>
          <Image src="/assets/quest3_scenes/contract_owner.png" w="700px" />
          <Button onClick={() => completeSection("소유자")} mt={3} {...pixelBorder()}>전체 보기로</Button>
        </>
      )}

      {/* 💬 메시지 모달 */}
      <MessageModalQuest3
        isOpen={showMsg}
        onComplete={() => setShowMsg(false)}
        onClose={() => setShowMsg(false)}
        scene={scene} // contract_intro / contract_basic / contract_terms / contract_fix_request / contract_deposit / contract_address / contract_owner / contract_done
      />
    </VStack>
  );
}
