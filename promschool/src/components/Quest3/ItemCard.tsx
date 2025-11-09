import { Box, Image, Text } from "@chakra-ui/react";

type Props = {
  item: {
    name: string;
    desc: string;
    img: string;
  };
  selected: boolean;
  onClick: () => void;
};

const ItemCard = ({ item, selected, onClick }: Props) => {
  return (
    <Box
      bg={selected ? "teal.600" : "gray.700"}
      border={selected ? "3px solid #38B2AC" : "1px solid gray"}
      borderRadius="lg"
      p={3}
      cursor="pointer"
      textAlign="center"
      w="160px"
      _hover={{ transform: "scale(1.05)" }}
      transition="all 0.2s"
      onClick={onClick}
    >
      <Image src={item.img} alt={item.name} w="120px" h="80px" mx="auto" />
      <Text fontWeight="bold" mt={2}>{item.name}</Text>
      <Text fontSize="sm" color="gray.200">{item.desc}</Text>
    </Box>
  );
};

export default ItemCard;
