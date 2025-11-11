// src/components/Mission2/FinalizeContract.tsx
import { useState } from "react";
import {
  Box, Button, VStack, HStack, Text, Input, Select, Tag, TagLeftIcon, TagLabel, Divider, useToast
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import MessageModalQuest3 from "./MessageModalQuest3Mission2";
import type { Mission2Scene } from "./MessageModalQuest3Mission2";

const C = { primary:"#7E44A8", accent:"#FCCFDB", mid:"#A372C2", panel:"#1A1B22", dark:"#121318" };
const pixelBorder = (outer=C.primary, inner=C.mid)=>({
  border:"0",
  boxShadow:`0 0 0 2px ${outer}, 0 0 0 4px ${inner}, inset 0 0 0 2px ${inner}`,
  borderRadius:"0",
});

type Props = { onFinished: () => void };

export default function FinalizeContract({ onFinished }: Props) {
  const [showMsg, setShowMsg]   = useState(true);
  const [scene, setScene]       = useState<Mission2Scene>("final_intro");

  const [gotContract, setGotContract] = useState(false);
  const [sentMoney, setSentMoney]     = useState(false);
  const [gotReceipt, setGotReceipt]   = useState(false);

  // 송금 폼
  const [bank, setBank] = useState("00 은행");
  const [account, setAccount] = useState("1234-56-789012");
  const [amount, setAmount] = useState("3,000,000");

  const toast = useToast();

  const allDone = gotContract && sentMoney && gotReceipt;

  const open = (s: Mission2Scene) => { setScene(s); setShowMsg(true); };

  const handleTakeOriginal = () => {
    setGotContract(true);
    open("final_take_contract");
  };

  const handleTransfer = () => {
    if (!bank || !account || !amount) {
      toast({ title: "입력값을 확인하세요", description: "은행/계좌/금액을 모두 입력해주세요.", status: "warning" });
      return;
    }
    setSentMoney(true);
    open("final_transfer");
  };

  const handleReceipt = () => {
    if (!sentMoney) {
      toast({ title: "먼저 송금하세요", status: "info" });
      return;
    }
    setGotReceipt(true);
    open("final_receipt");
  };

  const finishAll = () => {
    open("outro");
  };

  return (
    <Box
      position="relative"
      w={["92%","860px"]}
      bg={C.panel}
      color={C.accent}
      p={5}
      {...pixelBorder()}
    >
      {/* 헤더 */}
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" fontFamily="NeoDGM" fontSize="lg">[STEP 3] 계약 완료하기</Text>
        <Tag bg={allDone ? C.accent : C.mid} color={allDone ? C.primary : "white"} {...pixelBorder()}>
          <TagLeftIcon as={CheckCircleIcon} />
          <TagLabel>{allDone ? "완료" : "진행 중"}</TagLabel>
        </Tag>
      </HStack>
      <Divider borderColor="#2e2f3a" mb={4} />

      <VStack align="stretch" spacing={4}>
        {/* 1. 계약서 원본 수령 */}
        <Box p={4} bg={C.dark} {...pixelBorder(C.primary, C.mid)}>
          <HStack justify="space-between" align="start">
            <Box>
              <Text fontWeight="bold" color={C.accent}>① 계약서 원본 받기</Text>
              <Text fontSize="sm" opacity={0.9}>
                계약서 원본(또는 사본)을 꼭 수령하세요. 분쟁 시 중요한 근거 자료가 됩니다.
              </Text>
            </Box>
            <Button
              bg={C.accent}
              color={C.primary}
              _hover={{ bg:C.accent }}
              onClick={handleTakeOriginal}
              isDisabled={gotContract}
              {...pixelBorder()}
            >
              {gotContract ? "수령 완료" : "원본 받기"}
            </Button>
          </HStack>
        </Box>

        {/* 2. 계약(잔금) 송금 */}
        <Box p={4} bg={C.dark} {...pixelBorder(C.primary, C.mid)}>
          <Text fontWeight="bold" color={C.accent} mb={2}>② 계약금/잔금 송금하기</Text>
          <Text fontSize="sm" opacity={0.9} mb={3}>
            반드시 <b>임대인(소유주) 명의 우리은행 계좌</b>로 송금하세요.
          </Text>
          <HStack spacing={3} align="end" flexWrap="wrap">
            <Box>
              <Text fontSize="xs" mb={1}>받는 사람</Text>
              <Input value="김부자(임대인)" isReadOnly w="200px" />
            </Box>
            <Box>
              <Text fontSize="xs" mb={1}>은행</Text>
              <Select value={bank} onChange={(e)=>setBank(e.target.value)} w="160px" bg="white">
                <option>00 은행</option>
                <option>국민은행</option>
                <option>신한은행</option>
                <option>우리은행</option>
              </Select>
            </Box>
            <Box>
              <Text fontSize="xs" mb={1}>계좌번호</Text>
              <Input value={account} onChange={(e)=>setAccount(e.target.value)} w="220px" bg="white" />
            </Box>
            <Box>
              <Text fontSize="xs" mb={1}>금액(원)</Text>
              <Input value={amount} onChange={(e)=>setAmount(e.target.value)} w="160px" bg="white" />
            </Box>
            <Button
              onClick={handleTransfer}
              isDisabled={sentMoney}
              {...pixelBorder()}
            >
              {sentMoney ? "송금 완료" : "송금하기"}
            </Button>
          </HStack>
        </Box>

        {/* 3. 영수증 받기 */}
        <Box p={4} bg={C.dark} {...pixelBorder(C.primary, C.mid)}>
          <HStack justify="space-between" align="start">
            <Box>
              <Text fontWeight="bold" color={C.accent}>③ 영수증/거래명세서 받기</Text>
              <Text fontSize="sm" opacity={0.9}>
                이체확인증 · 영수증 · 거래명세서 중 하나 이상을 받아 보관하세요.
              </Text>
            </Box>
            <Button
              variant="outline"
              borderColor={C.accent}
              color={C.accent}
              _hover={{ bg:"#2a2731" }}
              onClick={handleReceipt}
              isDisabled={!sentMoney || gotReceipt}
              {...pixelBorder(C.mid, C.mid)}
            >
              {gotReceipt ? "수령 완료" : "영수증 받기"}
            </Button>
          </HStack>
        </Box>

        <HStack justify="flex-end" pt={2}>
          <Button
            colorScheme="teal"
            onClick={finishAll}
            isDisabled={!allDone}
            {...pixelBorder()}
          >
            마무리하기
          </Button>
        </HStack>
      </VStack>

      {/* 💬 씬 모달 */}
      <MessageModalQuest3
        isOpen={showMsg}
        scene={scene}
        onClose={() => setShowMsg(false)}
        onComplete={() => {
          setShowMsg(false);
          // outro 씬 종료 시 퀘스트3 step4로 이동
          if (scene === "outro") onFinished();
        }}
      />
    </Box>
  );
}
