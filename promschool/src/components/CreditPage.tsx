import { Box, Heading, Text, VStack, HStack, SimpleGrid, Link, Tag, IconButton, Divider, Avatar, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useBgm } from "../BgmProvider";

// 인라인 깃허브 아이콘 (의존성 X)
const GitHubIcon = ({ size = 22 }: { size?: number }) => (
  <Box as="svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5z"/>
  </Box>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <HStack w="full" justify="space-between" mt={6} mb={2}>
    <Heading as="h3" size="md" letterSpacing="0.02em">{children}</Heading>
    <Box flex="1" ml={4}><Divider opacity={0.25}/></Box>
  </HStack>
);

// 인라인 사운드 아이콘
const SoundIcon = ({ muted = false, size = 24 }: { muted?: boolean; size?: number }) => (
  <Box as="svg" width={size} height={size} viewBox="0 0 30 30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.95}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" fill="white" stroke="white" />
    {!muted ? (<><path d="M15 9a3 3 0 010 6" /><path d="M17.5 7a6 6 0 010 10" /></>) : (<><line x1="15.5" y1="8.5" x2="20.5" y2="13.5" /><line x1="20.5" y1="8.5" x2="15.5" y2="13.5" /></>)}
  </Box>
);

const people = [
  { name: "Team Leader", role: "Team Leader", github: "https://github.com/yourname" },
  { name: "Teammate A", role: "Frontend", github: "https://github.com/teammatea" },
  { name: "Teammate B", role: "Backend / Infra", github: "https://github.com/teammateb" },
  { name: "Teammate C", role: "Art / Audio", github: "https://github.com/teammatec" },
  { name: "Teammate C", role: "Art / Audio", github: "https://github.com/teammatec" },
];

const tech = ["React", "TypeScript", "FastAPI"];

export const Credit = () => {
  const navigate = useNavigate();
  const { muted, setMuted, play } = useBgm();

  const ensurePlay = async () => { await play().catch(() => {}); };

  return (
    <Box
      as="main"
      height="100vh"
      width="100vw"
      position="relative"
      display="flex"
      bgImage="url('/assets/sprites/prologue_main.png')"
      bgSize="cover"
      bgPos="center"
      _before={{ content: '""', position: "absolute", inset: 0, bgGradient: "linear(to-b, rgba(40,20,80,0.25), rgba(20,10,40,0.35))" }}
    >
      {/* 우상단: 사운드 토글 */}
      <IconButton
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={() => setMuted(!muted)}
        position="absolute"
        top={{ base: 3, md: 5 }}
        right={{ base: 3, md: 5 }}
        variant="unstyled"
        minW="auto"
        _focus={{ boxShadow: "none" }}
        _hover={{ filter: "brightness(1.15)" }}
      >
        <SoundIcon muted={muted} size={20} />
      </IconButton>

      <VStack
        position="relative"
        zIndex={1}
        w="full"
        maxW="960px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 8, md: 12 }}
        spacing={6}
        align="stretch"
      >
        {/* 헤더 */}
        <HStack justify="space-between" mt={{ base: 6, md: 10 }}>
          <Heading as="h1" size="lg" color="white" textShadow="0 2px 8px rgba(0,0,0,0.45)">
            Credits
          </Heading>
          <HStack>
            {/* 깃허브 레포 바로가기 */}
            <Link href="https://github.com/use08174/StoryM_Prologue" isExternal _hover={{ textDecoration: "none" }} onClick={ensurePlay}>
              <Button variant="solid" size="sm" leftIcon={<GitHubIcon />} colorScheme="whiteAlpha">
                GitHub
              </Button>
            </Link>
            <Button size="sm" onClick={() => { ensurePlay(); navigate(-1); }}>
              ← Back
            </Button>
          </HStack>
        </HStack>

        {/* 소개 카드 */}
        <Box bg="whiteAlpha.100" backdropFilter="blur(6px)" border="1px solid" borderColor="whiteAlpha.300" rounded="lg" p={{ base: 4, md: 6 }}>
          <Text color="whiteAlpha.900" lineHeight="1.7">
            팀 <b>스토림</b>의 프롤로그에 오신 걸 환영합니다! 저희는 청년들을 위한 성장 시뮬레이션 게임을 제작하고 있습니다.
          </Text>

          <SectionTitle>Team</SectionTitle>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
            {people.map((p) => (
              <VStack key={p.name} align="start" spacing={2} bg="whiteAlpha.80" color="gray.900" rounded="md" p={3}>
                <HStack w="full">
                  <Avatar size="sm" name={p.name} />
                  <VStack spacing={0} align="start">
                    <Text fontWeight="semibold">{p.name}</Text>
                    <Text fontSize="sm" color="gray.600">{p.role}</Text>
                  </VStack>
                </HStack>
                <Link href={p.github} isExternal color="gray.700" _hover={{ color: "gray.900" }}>
                  <HStack spacing={1}>
                    <GitHubIcon size={18} />
                    <Text fontSize="sm">GitHub</Text>
                  </HStack>
                </Link>
              </VStack>
            ))}
          </SimpleGrid>

          <SectionTitle>Tech Stack</SectionTitle>
          <HStack flexWrap="wrap" gap={2}>
            {tech.map((t) => <Tag key={t} size="md" variant="subtle" colorScheme="purple">{t}</Tag>)}
          </HStack>

          <SectionTitle>Contact</SectionTitle>
          <VStack align="start" spacing={1} color="whiteAlpha.900">
            <Text fontSize="sm">문의: storym0723@gmail.com</Text>
            <Text fontSize="sm">이슈/피드백: 위 GitHub 이슈 탭 활용</Text>
          </VStack>

          <Divider my={4} borderColor="whiteAlpha.400" />
          <HStack justify="space-between" color="whiteAlpha.700" fontSize="sm">
            <Text>Version: 0.1.0</Text>
            <Text>© {new Date().getFullYear()} Prologue</Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Credit;
