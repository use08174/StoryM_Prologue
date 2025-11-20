import { useState, useEffect, useMemo } from "react";
import {
  Box, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, List, ListItem, Text, useDisclosure,
  useToast, HStack, Button, Tag, keyframes, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, Divider
} from "@chakra-ui/react";
import { TopicType as APITopicType, YouthPolicyTip } from "../api/getYouthPolicyTip";
import { getYouthPolicyTip } from "../api/getYouthPolicyTip";
import { getCharacterMeta, CharacterMeta } from "features/getCharacterMeta";
import { usePolicyTipStore } from "state/policyTipStore";
import type { PolicyTipState } from "state/policyTipStore";

const C = { primary:"#7E44A8", accent:"#FCCFDB", mid:"#A372C2", dark:"#121318", panel:"#1A1B22" };

const pixelBorder = (outer = C.primary, inner = C.mid) => ({
  border: "0",
  boxShadow: `0 0 0 2px ${outer}, 0 0 0 4px ${inner}, inset 0 0 0 2px ${inner}`,
  borderRadius: "0",
});

const blink = keyframes`0%,100%{opacity:.2}50%{opacity:1}`;
const wiggle = keyframes`
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.06); }
  100% { transform: translateY(0) scale(1); }
`;
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,.6); }
  70% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
`;

type Props = {
  topicType?: APITopicType;
  topicName?: string;
  characterId?: number;
  userId?: string;
  characterMeta?: { gender?: string; region?: string; job?: string };
  boxSize?: string;
  src?: string;
  autoOpenOnUnlock?: boolean;
  highlight?: boolean;     
  alarmCount?: number;     
};

const LCLSF_TOPICS = ["교육", "복지문화", "일자리", "주거", "참여권리"];
const MCLSF_GROUPS = [
  { label: "교육(1)", items: ["건강","교육비지원","권익보호","기숙사","문화활동"] },
  { label: "교육(2)", items: ["미래역량강화","예술인지원","온라인교육","재직자"] },
  { label: "주거", items: ["전월세 및 주거급여 지원","정책인프라구축","주택 및 거주지"] },
  { label: "참여/취업/금융", items: ["창업","청년국제교류","청년참여","취약계층 및 금융지원","취업"] },
];

const BADGE_SIZE = 22;

export default function PolicyTipIcon({
  topicType,
  topicName,
  characterId,
  userId,
  characterMeta,
  boxSize = "60px",
  src = "/assets/sprites/storym_tip.png",
  autoOpenOnUnlock = true,
  highlight,
  alarmCount,
}: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<YouthPolicyTip | null>(null);
  const [meta, setMeta] = useState<CharacterMeta | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [selected, setSelected] = useState<{ t: APITopicType; name: string } | null>(null);
  const toast = useToast();

  const markRead       = usePolicyTipStore((s: PolicyTipState) => s.markRead);
  const cacheTip       = usePolicyTipStore((s: PolicyTipState) => s.cacheTip);
  const lastUnlockedId = usePolicyTipStore((s: PolicyTipState) => s.lastUnlockedId);
  const findById       = usePolicyTipStore((s: PolicyTipState) => s.findById);
  const unreadCount    = usePolicyTipStore((s: PolicyTipState) => s.entries.filter((x) => x.unread).length);

  const computedBadge  = typeof alarmCount === "number" ? alarmCount : unreadCount;
  const doPulse        = typeof highlight === "boolean" ? highlight : computedBadge > 0;
  const isDirectMode   = !!(topicType && topicName);

  useEffect(() => {
    if (characterMeta) {
      setMeta({ character_id: characterId ?? 0, user_id: userId ?? "", ...characterMeta });
      return;
    }
    (async () => {
      if (!characterId) return;
      try {
        const m = await getCharacterMeta(characterId);
        setMeta(m);
      } catch {
        toast({ title: "캐릭터 정보", description: "메타를 불러오지 못했습니다.", status: "warning" });
      }
    })();
  }, [characterId, characterMeta, userId, toast]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      let target: { topicType: APITopicType; topicName: string; entryId?: string } | null = null;
      if (lastUnlockedId) {
        const entry = findById(lastUnlockedId);
        if (entry) target = { topicType: entry.topicType as APITopicType, topicName: entry.topicName, entryId: entry.id };
      } else if (isDirectMode) {
        target = { topicType: topicType!, topicName: topicName! };
      } else if (selected) {
        target = { topicType: selected.t, topicName: selected.name };
      }
      if (!target) return;
      await loadTip(target.topicType, target.topicName, target.entryId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!autoOpenOnUnlock) return;
    if (lastUnlockedId) { setTabIndex(0); onOpen(); }
  }, [autoOpenOnUnlock, lastUnlockedId, onOpen]);

  async function loadTip(tType: APITopicType, tName: string, entryId?: string) {
    setLoading(true);
    try {
      const data = await getYouthPolicyTip({
        topicType: tType, topicName: tName,
        characterId: meta?.character_id, userId: meta?.user_id,
        characterMeta: { gender: meta?.gender, region: meta?.region, job: meta?.job },
      });
      setTip(data);
      if (entryId) {
        cacheTip(entryId, {
          title: data.title,
          bullets: data.bullets?.map((b) => ({ title: b.title, summary: b.summary })),
        });
        markRead(entryId);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "잠시 후 다시 시도해주세요.";
      toast({ title: "Tip 불러오기 실패", description: msg, status: "error" });
    } finally { setLoading(false); }
  }

  const chooseTopic = (t: APITopicType, name: string) => setSelected({ t, name });
  const fetchSelected = async () => { if (!selected) return; setTabIndex(0); await loadTip(selected.t, selected.name); };

  const headerTypeText =
    isDirectMode ? (topicType === "lclsf" ? "대주제" : "중주제")
    : lastUnlockedId && findById(lastUnlockedId) ? (findById(lastUnlockedId)!.topicType === "lclsf" ? "대주제" : "중주제")
    : selected ? (selected.t === "lclsf" ? "대주제" : "중주제")
    : "대주제/중주제";

  const headerNameText =
    isDirectMode ? topicName
    : lastUnlockedId && findById(lastUnlockedId) ? findById(lastUnlockedId)!.topicName
    : selected?.name ?? "-";

  const isSelected = (t: APITopicType, name: string) => selected?.t === t && selected?.name === name;

  return (
    <>
      <Box
        as="button"
        onClick={() => { setTabIndex(0); onOpen(); }}
        cursor="pointer"
        _hover={{ transform: "scale(1.06)" }}
        transition="transform 80ms steps(4)"
        position="relative"
        animation={doPulse ? `${wiggle} 900ms ease-in-out infinite` : undefined}
      >
        {doPulse && (
          <Box
            position="absolute"
            inset="-4px"
            borderRadius="12px"
            animation={`${pulse} 1.4s ease-out infinite`}
            pointerEvents="none"
          />
        )}

        <Image src={src} alt="info" boxSize={boxSize} pointerEvents="none" />

        {computedBadge > 0 && (
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            w={`${BADGE_SIZE}px`}
            h={`${BADGE_SIZE}px`}
            pointerEvents="none"
          >
            <Image
              src="/assets/sprites/alarm.png"
              alt="alarm"
              boxSize={`${BADGE_SIZE}px`}
              draggable={false}
            />
            <Box
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="10px"
              fontWeight="bold"
              color="white"
              textShadow="0 1px 2px rgba(0,0,0,.6)"
              lineHeight={`${BADGE_SIZE}px`}
            >
              {computedBadge}
            </Box>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(0px)" />
        <ModalContent bg={C.panel} color={C.accent} maxW="760px" {...pixelBorder(C.primary, C.mid)} position="relative">
          <Box h="28px" bg={C.primary} />
          <ModalCloseButton sx={pixelBorder(C.accent, C.primary)} bg={C.accent} color={C.primary} _hover={{ bg: C.accent }} top="8px" right="8px" />

          <ModalHeader pt="10px" pb="0" fontFamily="neodgm" fontSize="20px" letterSpacing="0.5px" color={C.accent}>
            {tip?.title ?? "💡 청년정책 Tip"}
          </ModalHeader>

          <ModalBody pt="14px" pb="16px" fontFamily="NeoDGM">
            <Tabs variant="unstyled" colorScheme="purple" index={tabIndex} onChange={setTabIndex}>
              <TabList>
                <Tab _selected={{ color: C.accent, borderBottom: `2px solid ${C.accent}` }}>TIP</Tab>
                <Tab _selected={{ color: C.accent, borderBottom: `2px solid ${C.accent}` }}>주제 선택하기</Tab>
              </TabList>
              <TabPanels mt={3}>
                {/* 새 소식 */}
                <TabPanel>
                  {(tip || isDirectMode || lastUnlockedId || selected) && (
                    <HStack spacing={2} mb={3} flexWrap="wrap">
                      <Tag size="sm" bg={C.mid} color="white" {...pixelBorder(C.primary, C.primary)}>{headerTypeText}</Tag>
                      <Tag size="sm" bg={C.accent} color={C.primary} {...pixelBorder(C.primary, C.primary)}>{headerNameText}</Tag>
                    </HStack>
                  )}
                  {loading && (
                    <Box bg={C.dark} p="16px" {...pixelBorder(C.mid, C.primary)} fontFamily="neodgm" fontSize="20px" letterSpacing="0.5px">
                      LOADING
                      <Box as="span" animation={`${blink} 1s infinite`} ml="2px">.</Box>
                      <Box as="span" animation={`${blink} 1s infinite .15s`}>.</Box>
                      <Box as="span" animation={`${blink} 1s infinite .3s`}>.</Box>
                    </Box>
                  )}
                  {!loading && tip && (
                    <Box bg={C.dark} p="14px" {...pixelBorder(C.mid, C.primary)}>
                      <List spacing={3}>
                        {tip.bullets.map((b, i) => (
                          <ListItem key={i}>
                            <HStack align="start" spacing={3}>
                              <Box w="10px" h="10px" bg={C.accent} boxShadow={`0 0 0 2px ${C.primary}, 0 0 0 4px ${C.mid}`} flexShrink={0} />
                              <Box>
                                <Text as="span" fontWeight="bold" color={C.accent} fontFamily="neodgm" fontSize="12px">
                                  {i + 1}. {b.title}
                                </Text>
                                {b.summary && <Text mt="4px" fontSize="12px" color="#CFCFD6">— {b.summary}</Text>}
                              </Box>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {!loading && !tip && (
                    <Text fontSize="sm" color="#CFCFD6">새로 언락된 TIP이 없어요. “선택함”에서 주제를 골라 Tip을 불러와 보세요.</Text>
                  )}
                </TabPanel>

                {/* 선택함 */}
                <TabPanel>
                  <Box mb={3}>
                    <Text fontWeight="bold" mb={2} color={C.accent}>청년정책 대주제</Text>
                    <HStack spacing={5} wrap="wrap">
                      {LCLSF_TOPICS.map((name) => {
                        const sel = isSelected("lclsf", name);
                        return (
                          <Button
                            key={name}
                            size="sm"
                            onClick={() => chooseTopic("lclsf", name)}
                            bg={sel ? C.primary : C.accent}
                            color={sel ? "white" : C.primary}
                            _hover={{ bg: sel ? C.primary : C.accent }}
                            {...pixelBorder(C.primary, C.primary)}
                          >
                            {name}
                          </Button>
                        );
                      })}
                    </HStack>
                    <Divider mt={4} borderColor={C.mid} opacity={0.35} />
                  </Box>

                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" mb={1} color={C.accent}>청년정책 중주제</Text>
                    {MCLSF_GROUPS.map((g) => (
                      <Box key={g.label}>
                        <Text fontSize="xs" opacity={0.8} mb={1}>{g.label}</Text>
                        <HStack spacing={5} wrap="wrap">
                          {g.items.map((name) => {
                            const sel = isSelected("mclsf", name);
                            return (
                              <Button
                                key={name}
                                size="xs"
                                onClick={() => chooseTopic("mclsf", name)}
                                variant={sel ? "solid" : "outline"}
                                bg={sel ? C.primary : "transparent"}
                                color={sel ? "white" : C.accent}
                                borderColor={C.accent}
                                _hover={{ bg: sel ? C.primary : "transparent" }}
                                {...pixelBorder(sel ? C.primary : C.accent, C.mid)}
                              >
                                {name}
                              </Button>
                            );
                          })}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>

                  <Box mt={5} bg={C.dark} p={3} {...pixelBorder(C.mid, C.primary)}>
                    <HStack justify="space-between" align="center" wrap="wrap" gap={2}>
                      <HStack>
                        <Tag size="sm" bg={C.mid} color="white" {...pixelBorder(C.primary, C.primary)}>선택 키워드</Tag>
                        <Text fontSize="sm" color="#CFCFD6">
                          {selected ? `${selected.t === "lclsf" ? "대주제" : "중주제"} · ${selected.name}` : "아직 선택된 주제가 없어요."}
                        </Text>
                      </HStack>
                      <Button
                        size="sm"
                        onClick={fetchSelected}
                        isDisabled={!selected}
                        isLoading={loading}
                        bg={C.accent}
                        color={C.primary}
                        _hover={{ bg: C.accent }}
                        {...pixelBorder(C.primary, C.primary)}
                      >
                        Tip 불러오기
                      </Button>
                    </HStack>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
