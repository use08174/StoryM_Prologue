import { useState } from "react";
import { Box, Button, Text, VStack, Image } from "@chakra-ui/react";

type Props = {
  onResult: (success: boolean) => void;
};

const Mission1 = ({ onResult }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);


  const toggleSelect = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleConfirm = () => {
    const correct = ["id_card", "stamp", "phone"];
    const success =
      correct.every((key) => selected.includes(key)) &&
      selected.length === correct.length;
    onResult(success);
  };

  const items = [
    { 
      key: "id_card", 
      name: "주민등록증", 
      desc: "나의 신분을 증명할 수 있는 주민등록증.", 
      img: "/assets/quest3_scenes/idcard.png",
      top: "5%", 
      left: "10%", 
      rotate: "-7deg", 
      size: "350px"        
    },
    { 
      key: "student_card", 
      name: "학생증", 
      desc: "대학교 학번과 전공이 적힌 학생증.", 
      img: "/assets/quest3_scenes/studentcard.png", 
      top: "40%", 
      left: "34%", 
      rotate: "9deg",
      size: "300px"
    },
    { 
      key: "stamp", 
      name: "도장", 
      desc: "계약서 날인 시 사용되는 도장.", 
      img: "/assets/quest3_scenes/stamp.png", 
      top: "60%", 
      left: "5%", 
      rotate: "12deg", 
      size: "300px"
    },
    { 
      key: "library_card", 
      name: "도서관 카드", 
      desc: "도서관에서 책을 대출할 때 필요한 카드.", 
      img: "/assets/quest3_scenes/librarycard.png", 
      top: "8%", 
      left: "60%", 
      rotate: "deg", 
      size: "300px"
    },
    { 
      key: "phone", 
      name: "전화기", 
      desc: "계약서 확인을 위한 전화기.", 
      img: "/assets/quest3_scenes/phone.png", 
      top: "50%", 
      left: "70%", 
      rotate: "-12deg", 
      size: "180px"
    }
    // ...
  ];


  return (
    <VStack spacing={5} position="relative" w="100%" h="700px" bgImage="/assets/quest3_scenes/background.png" bgSize="cover" bgPos="center" overflow="hidden">
      <Text fontSize="2xl" fontWeight="bold" color="yellow.300" mt={4}>
        [MISSION 1] 계약에 필요한 준비 완료하기
      </Text>
      <Text fontSize="md" color="white">
        책상 위를 확인하고, 필요한 물건을 가방에 챙겨 갑시다.
      </Text>

      {/* 아이템들 */}
      <Box position="relative" w="100%" h="100%">
        {items.map((item) => (
          <Box
            key={item.key}
            position="absolute"
            top={item.top}
            left={item.left}
            transform={`rotate(${item.rotate}) scale(${selected.includes(item.key) ? 1.05 : 1})`}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => toggleSelect(item.key)}
            boxShadow={selected.includes(item.key) ? "0 0 20px 5px rgba(255,255,150,0.8)" : "lg"}
            border={selected.includes(item.key) ? "3px solid yellow" : "none"}
            borderRadius="md"
          >
            <Image src={item.img} alt={item.name} w={item.size || "160px"} h="auto" draggable={false} />
          </Box>
        ))}
      </Box>

      <Button colorScheme="teal" onClick={handleConfirm} position="absolute" bottom="20px">
        가방에 챙기기 완료
      </Button>
    </VStack>
  );
};

export default Mission1;
