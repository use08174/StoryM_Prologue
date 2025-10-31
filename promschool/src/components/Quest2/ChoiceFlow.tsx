import { useEffect, useMemo, useState } from "react";
import { Box, Button, HStack, Image, Text } from "@chakra-ui/react";
import Quest2Dialog from "./Quest2Dialog";

type Props = {
  type: 1 | 2 | 3; // 1: 창문, 2: 싱크대, 3: 화장실
  onClose: () => void;
};

// 공통 액션 타입(이미지/사운드는 선택)
type ActionItem = {
  key: string;
  label: string;
  sfx?: string;
  img?: string;
};

const windowActions: ActionItem[] = [
  { key: "open", label: "창문 열어보기", sfx: "/assets/quest2/sfx_window_creak.mp3" },
  { key: "sill", label: "창틀 들여다보기", img: "/assets/quest2/window_sill_dirty.png" },
  { key: "lock", label: "잠금장치 확인하기", img: "/assets/quest2/window_lock.png" },
];

const sinkActions: ActionItem[] = [
  { key: "water", label: "물 틀어보기", sfx: "/assets/quest2/sfx_water_on.mp3" },
  { key: "drain", label: "배수 확인하기", sfx: "/assets/quest2/sfx_water_drain.mp3" },
];

const bathActions: ActionItem[] = [
  { key: "tap", label: "세면대 물 틀어보기", sfx: "/assets/quest2/sfx_water_on.mp3" },
  { key: "flush", label: "변기 물 내리기", sfx: "/assets/quest2/sfx_flush.mp3" },
  { key: "fan", label: "환풍기 켜보기", sfx: "/assets/quest2/sfx_fan_bad.mp3" },
];

export default function ChoiceFlow({ type, onClose }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0: 버디 메시지, 1: 액션, 2: 결론
  const [clicked, setClicked] = useState<Record<string, boolean>>({});
  const [showImg, setShowImg] = useState<string | null>(null);

  const actions: ActionItem[] = useMemo(() => {
    if (type === 1) return windowActions;
    if (type === 2) return sinkActions;
    return bathActions;
  }, [type]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.code === "Space") {
        if (phase === 0) setPhase(1);
        else if (phase === 2) onClose();
      }
      if (e.code === "Backspace") {
        if (phase === 2) setPhase(1);
        else if (phase === 1) setPhase(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const allDone = actions.every((a: ActionItem) => clicked[a.key] === true);

  const playSfx = (src?: string) => {
    if (!src) return;
    try {
      const audio = new Audio(src);
      audio.play().catch(() => {});
    } catch {}
  };

  const doAction = (a: ActionItem) => {
    setClicked((prev) => ({ ...prev, [a.key]: true }));
    if (a.sfx) playSfx(a.sfx);
    if (a.img) setShowImg(a.img);
  };

  const buddyLine =
    type === 1
      ? "창문이 덜걱대지 않고 잘 열리는지 확인해야 해. 창틀 사이사이에 먼지나 죽은 벌레들이 지나치게 많이 쌓여 있지는 않은지 꼭 확인하고! 이중창 여부와 잠금장치도 체크!"
      : type === 2
      ? "싱크대 수전의 수압, 배수 속도, 하부 배관 누수 여부를 확인해!"
      : "세면대 물, 변기 물내림, 환풍기 작동, 틈새 곰팡이 여부를 꼭 확인해!";

  const conclusionPlayer =
    type === 1
      ? "창문이 왜 이래요? 잘 안 닫히네요. 창틀도 더럽고…"
      : type === 2
      ? "(싱크대 물은 잘 나오네. 수압이나 물 빠지는 속도도 괜찮고….)"
      : "여기 환풍기가 왜 이러죠? 고장인가요? (곰팡이 자국도 보이는데…)";

  const conclusionOwner =
    type === 1
      ? "아 그거 조금만 힘주면 잘 닫혀요! 최근에 청소를 못해서 창틀이 좀 더러워요~ 입주 전에 깨끗하게 해 둘게요!"
      : type === 2
      ? "예, 최근에 점검도 받아서 작동에는 큰 문제 없을 거예요."
      : "며칠 전부터 한 번씩 그러더라구~ 우리집은 창문이 있어 환기 잘 돼요~~";

  return (
    <>
      {phase === 0 && (
        <Quest2Dialog speaker="버디" text={buddyLine} tone="buddy" />
      )}

      {phase === 1 && (
        <Box
          position="absolute"
          left="50%"
          transform="translateX(-50%)"
          bottom="9%"
          width="84%"
          bg="white"
          border="3px solid #333"
          borderRadius="14px"
          boxShadow="xl"
          p={5}
          zIndex={960}
          color="black"
          textAlign="center"
        >
          <Text mb={3} fontWeight="bold">
            {type === 1 && "창문 상태를 확인해보자"}
            {type === 2 && "싱크대 상태를 확인해보자"}
            {type === 3 && "화장실 상태를 확인해보자"}
          </Text>

          <HStack spacing={3} justify="center" flexWrap="wrap">
            {actions.map((a) => (
              <Button
                key={a.key}
                onClick={() => doAction(a)}
                bg={clicked[a.key] ? "green.100" : "white"}
                border="2px solid #333"
                _hover={{ bg: clicked[a.key] ? "green.100" : "gray.100" }}
                borderRadius="10px"
                minW="140px"
              >
                {a.label}
              </Button>
            ))}
          </HStack>

          {showImg && (
            <Box mt={4}>
              <Image
                src={showImg}
                alt="detail"
                maxH="220px"
                borderRadius="10px"
                mx="auto"
              />
            </Box>
          )}

          {allDone ? (
            <Button
              mt={4}
              onClick={() => setPhase(2)}
              colorScheme="pink"
              border="2px solid #333"
              borderRadius="10px"
            >
              다음 (Enter)
            </Button>
          ) : (
            <Text mt={3} fontSize="sm" color="gray.600">
              위 버튼을 모두 눌러 확인해 보세요.
            </Text>
          )}
        </Box>
      )}

      {phase === 2 && (
        <>
          <Quest2Dialog speaker="나" text={conclusionPlayer} />
          <Quest2Dialog speaker="집 주인" text={conclusionOwner} />
          <Box
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            bottom="8%"
            zIndex={970}
          >
            <Button
              onClick={onClose}
              colorScheme="blue"
              border="2px solid #333"
              borderRadius="10px"
            >
              선택지로 돌아가기 (Enter)
            </Button>
          </Box>
        </>
      )}
    </>
  );
}
