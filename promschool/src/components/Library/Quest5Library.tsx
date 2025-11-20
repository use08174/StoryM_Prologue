import { useEffect, useState } from "react";
import {
  Box, Flex, Heading, Text, VStack, HStack, Button, Tag, TagLabel, Badge, StackDivider,
  Image, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
} from "@chakra-ui/react";

const AGENCY_IMG = "/assets/library_scenes/library_site.png"; 
const C = { shadow: "rgba(0,0,0,0.55)" };

type CategoryId = "housing" | "saving" | "job" | "portal";

type Quest5LibraryProps = {
  onClose?: () => void;
  onFinish?: () => void;
};

type ResourceType = "공공기관" | "블로그" | "포털" | "채용";

type Resource = {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  region?: string;
  tags?: string[];
  description?: string;
};

type CategoryConfig = {
  id: CategoryId;
  label: string;
  icon: string;
  intro: string;
  tip?: string;
  featuredIds: string[]; 
};

// ====== 데이터 정의 영역 ======

const resources: Record<CategoryId, Resource[]> = {
  housing: [
    {
      id: "seoul-housing-portal",
      title: "서울시 주거포털",
      url: "https://housing.seoul.go.kr/site/main/home",
      type: "공공기관",
      region: "서울",
      tags: ["공공임대", "월세지원", "정책 모음"],
      description: "서울 거주 청년을 위한 공공임대, 월세지원 등 주거 정책이 모여 있는 포털.",
    },
    {
      id: "seoul-youth-monthly-rent",
      title: "청년 월세 지원 (서울)",
      url: "https://youth.seoul.go.kr/content.do?key=2310100046",
      type: "공공기관",
      region: "서울",
      tags: ["월세", "지원금"],
      description: "조건에 맞는 청년에게 일정 금액의 월세를 지원해주는 제도.",
    },
    {
      id: "seoul-youth-dorm",
      title: "대학생 주거 지원 (서울)",
      url: "https://youth.seoul.go.kr/content.do?key=2310100051",
      type: "공공기관",
      region: "서울",
      tags: ["기숙사", "대학생"],
    },
    {
      id: "gg-housing-portal",
      title: "경기 주거포털",
      url: "https://housing.gg.go.kr/",
      type: "공공기관",
      region: "경기",
      tags: ["청년 주거복지"],
      description: "경기도 청년 주거복지, 공공임대 정보를 볼 수 있는 포털.",
    },
    {
      id: "gg-youth-housing",
      title: "경기도 청년 주거복지",
      url: "https://housing.gg.go.kr/html/51100.do",
      type: "공공기관",
      region: "경기",
      tags: ["청년", "복지"],
    },
    {
      id: "incheon-housing",
      title: "인천 주거포털",
      url: "https://www.incheon.go.kr/housing/index",
      type: "공공기관",
      region: "인천",
      tags: ["주거", "인천"],
    },
    {
      id: "myhome-main",
      title: "마이홈 포털",
      url: "https://www.myhome.go.kr/hws/portal/main/getMgtMainPage.do",
      type: "포털",
      region: "전국",
      tags: ["공공임대", "전국"],
      description: "국토부에서 운영하는 전국 공공주택, 청년주거 지원 포털.",
    },
    {
      id: "myhome-youth",
      title: "마이홈 – 청년 주거지원",
      url: "https://www.myhome.go.kr/hws/portal/main/getMgtMainYhsPage.do",
      type: "포털",
      region: "전국",
      tags: ["청년", "임대"],
    },
    {
      id: "blog-budget-guide",
      title: "자취 예산 가이드 블로그",
      url: "https://guide.ziptoss.com/types",
      type: "블로그",
      tags: ["자취", "예산"],
      description: "처음 자취할 때 필요한 초기 비용과 월 예산을 정리한 글.",
    },
    {
      id: "blog-living-cost",
      title: "초보 자취생 비용 총정리",
      url: "https://zippoom.com/%EB%B8%94%EB%A1%9C%EA%B7%B8/%EC%B4%88%EB%B3%B4-%EC%9E%90%EC%B7%A8%EC%83%9D-%EB%B9%84%EC%9A%A9-%EC%B4%9D%EC%A0%95%EB%A6%AC/225",
      type: "블로그",
      tags: ["자취", "생활비"],
    },
    {
      id: "assembly-youth-housing",
      title: "국회 제도 보기 – 청년 주거지원",
      url: "https://clik.nanet.go.kr/potal/policyinfo/curationDetail.do?tabIndex=1&pageIndex=2&posIndex=2&yearInfo=&curation_seq=CURATION_0000000000111",
      type: "공공기관",
      region: "전국",
      tags: ["입법", "제도"],
      description: "청년 주거지원 관련 법·제도, 국회 진행 상황을 볼 수 있는 페이지.",
    },
  ],
  saving: [
    {
      id: "yl-account",
      title: "청년 도약 계좌",
      url: "https://ylaccount.kinfa.or.kr/yltInit",
      type: "공공기관",
      region: "전국",
      tags: ["적금", "장기저축"],
      description: "일정 기간 꾸준히 납입하면 목돈을 모을 수 있는 정부 지원 계좌.",
    },
    {
      id: "kinfa",
      title: "서민금융진흥원",
      url: "https://www.kinfa.or.kr/main.do",
      type: "공공기관",
      region: "전국",
      tags: ["서민금융", "정책자금"],
    },
    {
      id: "seoul-double-hope",
      title: "희망두배 청년통장 (서울)",
      url: "https://youth.seoul.go.kr/content.do?key=2310100069",
      type: "공공기관",
      region: "서울",
      tags: ["적금", "매칭지원"],
      description: "본인이 적립한 금액에 서울시가 매칭해줘서 목돈을 만드는 통장.",
    },
    {
      id: "blog-saving-guide",
      title: "사회초년생 청년 적금 가이드",
      url: "https://community.linkareer.com/employment_data/4099005",
      type: "블로그",
      tags: ["적금", "사회초년생"],
    },
    {
      id: "toss-youth-saving",
      title: "토스뱅크 – 청년 적금 소개",
      url: "https://www.tossbank.com/articles/youth-future-savings",
      type: "블로그",
      tags: ["토스뱅크", "적금"],
    },
  ],
  job: [
    {
      id: "seoul-public-job",
      title: "서울 공공기관 채용",
      url: "https://youth.seoul.go.kr/api/publicEmplInfo/list.do?key=2309240003",
      type: "채용",
      region: "서울",
      tags: ["공공기관", "채용"],
    },
    {
      id: "job-alio",
      title: "잡 알리오 – 공공기관 채용정보",
      url: "https://job.alio.go.kr/main.do",
      type: "채용",
      region: "전국",
      tags: ["공공기관", "정규직", "인턴"],
      description: "공공기관 채용 정보가 모여 있는 대표 포털.",
    },
    {
      id: "youth-work-experience",
      title: "청년일경험 포털",
      url: "https://yw.work24.go.kr/main.do",
      type: "채용",
      region: "전국",
      tags: ["인턴", "체험형"],
    },
    {
      id: "jobkorea-intern",
      title: "잡코리아 – 공공기관 청년인턴 검색",
      url: "https://www.jobkorea.co.kr/Search/?stext=%EA%B3%B5%EA%B3%B5%EA%B8%B0%EA%B4%80%20%EC%B2%AD%EB%85%84%EC%9D%B8%ED%84%B4",
      type: "채용",
      region: "전국",
      tags: ["민간포털", "인턴"],
    },
    {
      id: "gg-job",
      title: "경기도일자리포털 잡아바",
      url: "https://job.gg.go.kr/pblcEmpmn/list.do",
      type: "채용",
      region: "경기",
      tags: ["경기", "일자리"],
    },
  ],
  portal: [
    {
      id: "seoul-youth-all",
      title: "청년 몽땅 정보통 (서울)",
      url: "https://youth.seoul.go.kr/mainA.do",
      type: "포털",
      region: "서울",
      tags: ["정보통합", "정책", "활동"],
      description: "서울 청년을 위한 정책, 활동, 공간 정보를 한 번에 모아둔 포털.",
    },
    {
      id: "ontong-youth",
      title: "온통청년",
      url: "https://www.youthcenter.go.kr/",
      type: "포털",
      region: "전국",
      tags: ["청년정책", "전국"],
      description: "전국 청년 정책, 생활 정보, 참여 프로그램을 검색할 수 있는 통합 포털.",
    },
    {
      id: "nysc",
      title: "중앙청년지원센터",
      url: "https://nysc.or.kr/nysc/",
      type: "공공기관",
      region: "전국",
      tags: ["지원센터", "정책"],
    },
  ],
};

const categories: CategoryConfig[] = [
  {
    id: "housing",
    label: "주거 / 자취",
    icon: "🏠",
    intro: "첫 자취부터 월세 지원, 공공임대까지. 집과 관련된 고민을 정리해 볼 수 있는 코너예요.",
    tip: "월세 지원, 공공임대, 자취 예산 가이드는 꼭 한 번씩 눌러보길 추천!",
    featuredIds: ["seoul-housing-portal", "myhome-main", "blog-budget-guide"],
  },
  {
    id: "saving",
    label: "적금 / 돈",
    icon: "💰",
    intro: "사회초년생이 목돈을 만들 때 참고하면 좋은 적금·지원 제도들을 모았어요.",
    tip: "청년 도약 계좌, 희망두배 청년통장은 모집 기간을 꼭 확인해야 해요.",
    featuredIds: ["yl-account", "seoul-double-hope"],
  },
  {
    id: "job",
    label: "취업 / 인턴",
    icon: "🧑‍💼",
    intro: "공공기관 채용, 청년 인턴, 일경험 프로그램을 찾아볼 수 있는 공간이에요.",
    tip: "잡 알리오 + 청년일경험 포털 조합으로 정규직/체험형 정보를 함께 보면 좋아요.",
    featuredIds: ["job-alio", "youth-work-experience"],
  },
  {
    id: "portal",
    label: "청년 정보 포털",
    icon: "📚",
    intro: "집, 돈, 일, 활동까지 전반적인 청년 정책을 한 번에 훑고 싶을 때 보는 인덱스.",
    tip: "서울 거주라면 청년 몽땅 정보통, 그 외 지역은 온통청년부터 보는 걸 추천!",
    featuredIds: ["seoul-youth-all", "ontong-youth"],
  },
];

export default function Quest5Library({ onClose, onFinish }: Quest5LibraryProps) {
  const [current, setCurrent] = useState<CategoryId>("housing");
  const [openAgency, setOpenAgency] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const currentCategory = categories.find((c) => c.id === current)!;
  const currentResources = resources[current];

  const featured = currentResources.filter((r) =>
    currentCategory.featuredIds.includes(r.id)
  );
  const others = currentResources.filter(
    (r) => !currentCategory.featuredIds.includes(r.id)
  );

  const handleOpen = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      role="dialog"
      aria-modal="true"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/assets/background/quest_back.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        boxShadow: `inset 0 0 200px ${C.shadow}`,
        mixBlendMode: "overlay",
        opacity: 0.34,
      }}
    >
      {/* 메인 콘텐츠 */}
      <Flex
        position="absolute"
        inset={0}
        align="center"
        justify="center"
        px={[4, 6]}
      >
        <Flex
          w={["100%", "100%", "1340px"]}
          maxH="80vh"
          bg="rgba(20,10,0,0.88)"
          borderRadius="24px"
          boxShadow={`0 18px 40px ${C.shadow}`}
          overflow="hidden"
        >
          {/* 왼쪽: 책장 네비 */}
          <VStack
            w={["120px", "220px", "260px"]}
            align="stretch"
            spacing={3}
            p={4}
            bgGradient="linear(to-b, #3c2615, #231309)"
          >
            <Heading
              size="md"
              color="yellow.100"
              fontFamily="NeoDGM"
              mb={1}
            >
              청년 도서관
            </Heading>
            <Text fontSize="xs" color="yellow.50" opacity={0.8}>
              보고 싶은 분야를 눌러서 정보를 열어보세요!
            </Text>

            {categories.map((c) => {
              const isActive = c.id === current;
              return (
                <Button
                  key={c.id}
                  justifyContent="flex-start"
                  bg={isActive ? "yellow.500" : "transparent"}
                  _hover={{ bg: isActive ? "yellow.500" : "rgba(255,255,255,0.06)" }}
                  color={isActive ? "black" : "yellow.100"}
                  borderRadius="full"
                  size="sm"
                  fontFamily="NeoDGM"
                  leftIcon={<span>{c.icon}</span>}
                  onClick={() => setCurrent(c.id)}
                >
                  {c.label}
                </Button>
              );
            })}

            <Button
              mt={1}
              justifyContent="flex-start"
              bg="rgba(255,255,255,0.08)"
              _hover={{ bg: "rgba(255,255,255,0.12)" }}
              color="yellow.100"
              borderRadius="full"
              size="sm"
              fontFamily="NeoDGM"
              leftIcon={<span>🏛️</span>}
              onClick={() => setOpenAgency(true)}
            >
              사용 기관 모음
            </Button>

            <Modal isOpen={openAgency} onClose={() => setOpenAgency(false)} isCentered size="3xl">
              <ModalOverlay bg="blackAlpha.700" />
              <ModalContent bg="rgba(20,10,0,0.92)" color="yellow.50">
                <ModalHeader fontFamily="NeoDGM">사용 기관/포털 모음</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Image
                    src={AGENCY_IMG}
                    alt="사용한 기관/포털 모음"
                    w="100%"
                    h="auto"
                    objectFit="contain"
                    borderRadius="md"
                  />
                </ModalBody>
              </ModalContent>
            </Modal>


            <Box flex="1" />

            <Button
              size="sm"
              variant="outline"
              colorScheme="yellow"
              onClick={() => {
                onFinish?.();
                onClose?.();
              }}
            >
            맵으로 돌아가기
            </Button>
            <Button
              size="xs"
              variant="ghost"
              color="yellow.200"
              onClick={onClose}
            >
              ESC를 눌러 나가기
            </Button>
          </VStack>

          {/* 오른쪽: 펼쳐진 책 */}
          <Box
            flex="1"
            p={[3, 6]}
            bg="#f0e0c8"
            position="relative"
          >
            {/* 책 가운데 접힌 부분 */}
            <Box
              position="absolute"
              left="50%"
              top={4}
              bottom={4}
              width="2px"
              bg="rgba(0,0,0,0.12)"
            />

            <Flex h="100%" gap={6}>
              {/* 왼쪽 페이지: 요약 + 추천 */}
              <Box
                flex="1"
                pr={4}
                overflowY="auto"
              >
                <Heading
                  size="md"
                  mb={1}
                  fontFamily="NeoDGM"
                >
                  {currentCategory.icon} {currentCategory.label}
                </Heading>
                <Text fontSize="sm" mb={3}>
                  {currentCategory.intro}
                </Text>
                {currentCategory.tip && (
                  <Box
                    bg="rgba(255,255,200,0.9)"
                    borderRadius="lg"
                    border="1px dashed rgba(120,90,40,0.6)"
                    p={3}
                    mb={4}
                  >
                    <Text fontSize="xs" fontWeight="bold" mb={1}>
                      사서의 한 마디
                    </Text>
                    <Text fontSize="xs">{currentCategory.tip}</Text>
                  </Box>
                )}

                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  color="rgba(80,60,30,0.9)"
                  fontFamily="NeoDGM"
                  mb={2}
                  letterSpacing="0.06em"
                >
                  추천 서가
                </Text>

                <VStack align="stretch" spacing={3}>
                  {featured.map((item) => (
                    <Box
                      key={item.id}
                      bg="rgba(255,255,255,0.95)"
                      borderRadius="xl"
                      border="1px solid rgba(160,120,60,0.5)"
                      boxShadow="0 2px 5px rgba(0,0,0,0.08)"
                      p={3}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="brown.800"
                        >
                          {item.title}
                        </Text>
                        <HStack spacing={1}>
                          {item.region && (
                            <Badge colorScheme="orange" fontSize="0.6rem">
                              {item.region}
                            </Badge>
                          )}
                          <Badge
                            colorScheme={item.type === "블로그" ? "purple" : "green"}
                            fontSize="0.6rem"
                          >
                            {item.type}
                          </Badge>
                        </HStack>
                      </HStack>
                      {item.description && (
                        <Text fontSize="xs" mb={2}>
                          {item.description}
                        </Text>
                      )}
                      {item.tags && (
                        <HStack spacing={1} mb={2}>
                          {item.tags.map((t) => (
                            <Tag
                              key={t}
                              size="xs"
                              variant="subtle"
                              colorScheme="yellow"
                            >
                              <TagLabel>#{t}</TagLabel>
                            </Tag>
                          ))}
                        </HStack>
                      )}
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="orange"
                        onClick={() => handleOpen(item.url)}
                      >
                        자세히 보기
                      </Button>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* 오른쪽 페이지: 전체 링크 목록 */}
              <Box
                flex="1"
                pl={4}
                borderLeft="1px dashed rgba(0,0,0,0.05)"
                overflowY="auto"
              >
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  color="rgba(80,60,30,0.9)"
                  mb={2}
                  letterSpacing="0.06em"
                  fontFamily="NeoDGM"
                >
                  서가 목록
                </Text>

                <VStack
                  align="stretch"
                  spacing={2}
                  divider={<StackDivider borderColor="rgba(0,0,0,0.06)" />}
                >
                  {others.map((item) => (
                    <HStack key={item.id} align="flex-start" spacing={3}>
                      <Box flex="1">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm" fontWeight="semibold">
                            {item.title}
                          </Text>
                          <HStack spacing={1}>
                            {item.region && (
                              <Badge colorScheme="orange" fontSize="0.6rem">
                                {item.region}
                              </Badge>
                            )}
                            <Badge
                              colorScheme={item.type === "블로그" ? "purple" : "green"}
                              fontSize="0.6rem"
                            >
                              {item.type}
                            </Badge>
                          </HStack>
                        </HStack>
                        {item.description && (
                          <Text fontSize="xs" color="gray.700">
                            {item.description}
                          </Text>
                        )}
                        {item.tags && (
                          <HStack spacing={1} mt={1}>
                            {item.tags.map((t) => (
                              <Tag
                                key={t}
                                size="xs"
                                variant="subtle"
                                colorScheme="yellow"
                              >
                                <TagLabel>#{t}</TagLabel>
                              </Tag>
                            ))}
                          </HStack>
                        )}
                      </Box>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="orange"
                        onClick={() => handleOpen(item.url)}
                      >
                        열기
                      </Button>
                    </HStack>
                  ))}
                </VStack>

                <Text fontSize="xs" mt={4} color="gray.700">
                  링크를 클릭하면 새 탭에서 열립니다.  
                </Text>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
