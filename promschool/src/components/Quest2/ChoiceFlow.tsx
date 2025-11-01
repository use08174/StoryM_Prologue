import { useEffect, useMemo, useState } from "react";
import { Box, Button, HStack, Image, Text } from "@chakra-ui/react";
import Quest2Dialog from "./Quest2Dialog";

type Props = {
  type: 1 | 2 | 3; // 선택지 인덱스
  houseIndex?: 1 | 2 | 3; // 
  onClose: () => void;
  onComplete: () => void;
};

type ActionItem = {
  key: string;
  label: string;
  sfx?: string;
  img?: string;
};

// 첫 번째 매물 (창문 / 싱크대 / 화장실)
const house1Actions = {
  1: [
    { key: "open", label: "창문 열어보기", img: "/assets/quest2_scenes/room1_window.png" },
    { key: "sill", label: "창틀 들여다보기", img: "/assets/quest2_scenes/room1_window.png" },
    { key: "lock", label: "잠금장치 확인하기", img: "/assets/quest2_scenes/room1_window.png" },
  ],
  2: [
    { key: "sink", label: "싱크대 살펴보기", img: "/assets/quest2_scenes/room1_sink.png" },
    { key: "water", label: "물 틀어보기", img: "/assets/quest2_scenes/room1_sink_with_water.png" },
    { key: "drain", label: "배수 확인하기", img: "/assets/quest2_scenes/room1_sink_below.png" },
  ],
  3: [
    { key: "tap", label: "세면대 물 틀어보기", img: "/assets/quest2_scenes/toilet.png" },
    { key: "flush", label: "변기 물 내리기", img: "/assets/quest2_scenes/toilet.png" },
    { key: "fan", label: "환풍기 켜보기", img: "/assets/quest2/sfx_fan_bad.mp3" },
  ],
};

// 두 번째 매물 (현관문 / 보일러 / 외부환경)
const house2Actions = {
  1: [
    { key: "gap", label: "문틈새 확인하기", img: "/assets/quest2_scenes/door_gap.png" },
    { key: "lock2", label: "보조 잠금장치 확인하기", img: "/assets/quest2_scenes/door_lock.png" },
    { key: "squeak", label: "현관문 여닫아 보기", img: "/assets/quest2/sfx_door_squeak.mp3" },
  ],
  2: [
    { key: "on", label: "보일러 전원 켜기", img: "/assets/quest2_scenes/boiler_on.png" },
    { key: "water", label: "온수 틀어보기", img: "/assets/quest2/sfx_water_on.mp3" },
    { key: "check", label: "보일러 점검 상태 보기", img: "/assets/quest2_scenes/boiler_check.png" },
  ],
  3: [
    { key: "lamp", label: "가로등 살펴보기", img: "/assets/quest2_scenes/outside_lamp.png" },
    { key: "cctv", label: "CCTV 확인하기", img: "/assets/quest2_scenes/outside_cctv.png" },
  ],
};

// 세 번째 매물 (벽지와 바닥 / 붙박이장 / 베란다)
const house3Actions = {
  1: [
    { key: "wall", label: "벽지 가까이서 보기", img: "/assets/quest2_scenes/wallpaper.png" },
    { key: "floor", label: "바닥 자세히 보기", img: "/assets/quest2_scenes/floor.png" },
  ],
  2: [
    { key: "open", label: "붙박이장 열어보기", img: "/assets/quest2_scenes/closet_open.png" },
    { key: "inside", label: "붙박이장 내부 보기", img: "/assets/quest2_scenes/closet_inside.png" },
  ],
  3: [
    { key: "window", label: "창문 열어보기", img: "/assets/quest2_scenes/veranda_window.png" },
    { key: "drain", label: "배수구 살펴보기", img: "/assets/quest2_scenes/veranda_drain.png" },
    { key: "tile", label: "타일 상태 보기", img: "/assets/quest2_scenes/veranda_tile.png" },
  ],
};

export default function ChoiceFlow({ type, houseIndex = 1, onClose, onComplete }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [clicked, setClicked] = useState<Record<string, boolean>>({});
  const [showImg, setShowImg] = useState<string | null>(null);

  const actions: ActionItem[] = useMemo(() => {
    if (houseIndex === 1) return house1Actions[type] || [];
    if (houseIndex === 2) return house2Actions[type] || [];
    if (houseIndex === 3) return house3Actions[type] || [];
    return [];
  }, [houseIndex, type]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.code === "Space") {
        if (phase === 0) setPhase(1);
        else if (phase === 2) {
          onClose();
          onComplete();
        }
      }
      if (e.code === "Backspace") {
        if (phase === 2) setPhase(1);
        else if (phase === 1) setPhase(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose, onComplete]);

  const allDone = actions.every((a: ActionItem) => clicked[a.key]);

  const doAction = (a: ActionItem) => {
    setClicked((prev) => ({ ...prev, [a.key]: true }));
    if (a.img) setShowImg(a.img);
  };
  const buddyLine =
    houseIndex === 1
      ? type === 1
        ? "창문이 덜걱대지 않고 잘 열리는지 확인해야 해.\n창틀 먼지나 잠금장치도 잊지 마!"
        : type === 2
        ? "싱크대 수압, 배수 속도, 하부 누수 여부를 확인해!"
        : "세면대 물, 변기 물내림, 환풍기 작동, 곰팡이 여부를 살펴봐!"
      : houseIndex === 2
      ? type === 1
        ? "출입문을 살필 때는 도어락, 보조 잠금장치, 문틈 외풍 등을 꼭 확인해야 해!"
        : type === 2
        ? "보일러 조작기, 온수 공급, 소음, 관리비 수준을 체크해!"
        : "외부 소음, 조망, 치안, 조명, CCTV 등 주변 환경을 확인해!"
      : houseIndex === 3
      ? type === 1
        ? "벽지 곰팡이, 얼룩, 바닥 긁힘 등 집의 인상을 좌우하는 부분을 잘 살펴봐!"
        : type === 2
        ? "붙박이장 문이 잘 열리는지, 곰팡이나 냄새는 없는지도 꼭 확인해!"
        : "베란다 채광, 배수, 단열, 곰팡이 흔적을 체크해봐!"
      : "";

  const conclusionPlayer =
    houseIndex === 1
      ? type === 1
        ? "창문이 잘 안 닫히네요. 창틀도 좀 더럽고…"
        : type === 2
        ? "물은 잘 나오네. 수압이나 배수 속도도 괜찮고…"
        : "환풍기가 이상한데요? 곰팡이도 보이네요."
      : houseIndex === 2
      ? type === 1
        ? "문틈이 벌어져 있네… 벌레 들어오겠는데."
        : type === 2
        ? "온수는 잘 나오지만 소음이 심하네…"
        : "CCTV가 깨져 있네요. 밤에 다니기 무서울 듯."
      : houseIndex === 3
      ? type === 1
        ? "벽지랑 바닥 상태가 좀 안 좋네요…"
        : type === 2
        ? "붙박이장 상태 괜찮네. 냄새도 없고."
        : "베란다 곰팡이도 없고 환기 잘 되네."
      : "";

  const conclusionOwner =
    houseIndex === 1
      ? type === 1
        ? "조금만 힘주면 닫혀요~ 입주 전에 청소해 둘게요!"
        : type === 2
        ? "예, 최근 점검받아서 문제 없어요."
        : "며칠 전부터 그런 것 같아요. 그래도 환기 잘 돼요~"
      : houseIndex === 2
      ? type === 1
        ? "집이 좀 낡아서 그래요. 사는 데는 지장 없어요."
        : type === 2
        ? "좀 된 보일러지만 점검 완료됐어요."
        : "CCTV는 곧 고칠 겁니다. 밤엔 가로등도 있어요."
      : houseIndex === 3
      ? type === 1
        ? "입주 전에 벽지랑 장판 새로 해드릴게요!"
        : type === 2
        ? "작년에 새로 맞춘 붙박이장이에요. 상태 좋아요!"
        : "햇빛 잘 들어오죠? 여름엔 시원하고 겨울엔 따뜻해요~"
      : "";
  return (
    <>
      {phase === 0 && <Quest2Dialog speaker="버디" text={buddyLine} tone="buddy" />}

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
            {houseIndex === 1 && (type === 1 ? "창문" : type === 2 ? "싱크대" : "화장실")} 상태를 확인해보자
            {houseIndex === 2 && (type === 1 ? "현관문" : type === 2 ? "보일러" : "외부환경")} 상태를 확인해보자
            {houseIndex === 3 && (type === 1 ? "벽지와 바닥" : type === 2 ? "붙박이장" : "베란다")} 상태를 확인해보자
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
                maxH="420px"
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
              onClick={() => {
                onClose();
                onComplete(); // 
              }}
              colorScheme="blue"
              border="2px solid #333"
              borderRadius="10px"
            >
              선택지로 돌아가기
            </Button>
          </Box>
        </>
      )}
    </>
  );
}
